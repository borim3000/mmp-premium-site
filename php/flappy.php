<?php
/* =========================================================
   Flappy Spatz – Bestenliste

   GET                          -> { top: [{name, score}], me: {name, score, rank} | null }
   POST action=start            -> neue Runde beginnt -> { run }
   POST action=save             -> run, score, name -> { top, me }   (nur wenn es ein neuer Rekord ist)
   POST action=name             -> name ändern -> { top, me }

   Pro Browser gibt es eine Zeile mit dem besten Ergebnis (gleiches Cookie wie beim Labubuech).
   Damit niemand einfach "score=9999" schickt, prüft der Server:
   - die Runde wurde vorher mit action=start begonnen und wird nur einmal gespeichert
   - seit dem Start ist genug Zeit vergangen: für jede Säule braucht man mindestens ~0.9 s
   Ganz verhindern lässt sich Schummeln bei einem Spiel im Browser nie, aber so braucht es Geduld.

   Nutzt die gleiche config.php wie Labubuech und Daumen (db_host, db_name, db_user, db_pass, salt).
   Tabellenname: 'table_flappy' in config.php, sonst "flappy". Die Tabelle wird automatisch angelegt.
   Einen Eintrag ausblenden: in phpMyAdmin hidden auf 1 setzen.
   Testen: php/flappy.php im Browser öffnen -> {"top":[],"me":null}
   Läuft mit PHP 7.3 oder neuer.
   ========================================================= */

declare(strict_types=1);

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const NAME_MAX = 16;
const TOP = 10; // so viele Plätze zeigt die Bestenliste
const SCORE_MAX = 9999;
// Mindestzeit für ein Ergebnis (gleiche Werte wie in flappy.js):
// erste Säule ca. 3.1 s, jede weitere mindestens ca. 0.9 s (bei Höchstgeschwindigkeit). Mit etwas Puffer.
const FIRST_POINT = 2.5;
const PER_POINT = 0.8;
const RUNS_KEPT = 20; // so viele angefangene Runden merkt sich der Server pro Browser (der Name kann auch später kommen)

function reply(int $status, array $data)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

$debug = false;
set_exception_handler(function (Throwable $e) use (&$debug) {
    $data = ['error' => $e instanceof PDOException
        ? 'Datenbank-Fehler. Stimmen die Zugangsdaten in config.php? Mit \'debug\' => true steht hier der genaue Grund.'
        : 'PHP-Fehler.'];
    if ($debug) {
        $data['detail'] = $e->getMessage();
    }
    reply(500, $data);
});

// ---------- Verbindung (gleiche config.php wie das Labubuech) ----------

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    reply(500, ['error' => 'config.php fehlt.']);
}
$config = require $configFile;
foreach (['db_host', 'db_name', 'db_user', 'db_pass', 'salt'] as $key) {
    if (!isset($config[$key])) {
        reply(500, ['error' => "In config.php fehlt '$key'."]);
    }
}
$debug = !empty($config['debug']);
$table = preg_replace('/[^A-Za-z0-9_]/', '', $config['table_flappy'] ?? 'flappy');

$pdo = new PDO(
    "mysql:host={$config['db_host']};dbname={$config['db_name']};charset=utf8mb4",
    $config['db_user'],
    $config['db_pass'],
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
);

// Tabelle anlegen, falls es sie noch nicht gibt (gleich wie php/flappy.sql)
$pdo->exec(
    "CREATE TABLE IF NOT EXISTS `$table` (
        `visitor` CHAR(64) NOT NULL,
        `name` VARCHAR(16) NOT NULL,
        `score` INT UNSIGNED NOT NULL DEFAULT 0,
        `created_at` DATETIME NOT NULL,
        `updated_at` DATETIME NOT NULL,
        `hidden` TINYINT(1) NOT NULL DEFAULT 0,
        PRIMARY KEY (`visitor`),
        KEY `ranking` (`hidden`, `score`, `updated_at`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
);

// ---------- Besucher erkennen (gleiches Cookie wie beim Labubuech) ----------
// Gespeichert wird nur ein Hash der zufälligen Kennung, keine IP-Adresse.

$visitorId = $_COOKIE['mmp_visitor'] ?? '';
if (!preg_match('/^[a-f0-9]{32}$/', $visitorId)) {
    $visitorId = bin2hex(random_bytes(16));
    setcookie('mmp_visitor', $visitorId, [
        'expires' => time() + 365 * 24 * 3600,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);
}
$visitor = hash('sha256', $visitorId . $config['salt']);

// ---------- Hilfen ----------

function length(string $s): int
{
    return function_exists('mb_strlen') ? mb_strlen($s, 'UTF-8') : count(preg_split('//u', $s, -1, PREG_SPLIT_NO_EMPTY));
}

// Name aufräumen: Steuerzeichen und Richtungswechsel-Zeichen raus, Leerzeichen zusammenziehen.
// Das unsichtbare Verbindungszeichen in Emojis wie 🐦‍⬛ bleibt drin.
function cleanName(string $name): string
{
    $name = preg_replace('/[\p{Cc}\p{Co}\x{202A}-\x{202E}\x{2066}-\x{2069}]+/u', '', $name) ?? '';
    $name = preg_replace('/\s+/u', ' ', $name) ?? '';
    return trim($name);
}

function checkName(string $name): void
{
    if ($name === '') {
        reply(422, ['error' => 'Bitte gib einen Namen ein.']);
    }
    if (length($name) > NAME_MAX) {
        reply(422, ['error' => 'Der Name darf höchstens ' . NAME_MAX . ' Zeichen lang sein.']);
    }
}

// Bestenliste und eigener Platz
function board(PDO $pdo, string $table, string $visitor): array
{
    $top = $pdo->query(
        "SELECT name, score FROM `$table` WHERE hidden = 0 AND score > 0
         ORDER BY score DESC, updated_at ASC LIMIT " . TOP
    )->fetchAll();
    foreach ($top as &$row) {
        $row['score'] = (int) $row['score'];
    }
    unset($row);

    $stmt = $pdo->prepare("SELECT name, score, updated_at, hidden FROM `$table` WHERE visitor = ?");
    $stmt->execute([$visitor]);
    $mine = $stmt->fetch();
    $me = null;
    if ($mine) {
        $me = ['name' => $mine['name'], 'score' => (int) $mine['score'], 'rank' => null];
        if (!(int) $mine['hidden'] && (int) $mine['score'] > 0) {
            // Platz = alle, die besser sind (oder gleich gut, aber früher) + 1
            $stmt = $pdo->prepare(
                "SELECT COUNT(*) FROM `$table` WHERE hidden = 0
                 AND (score > ? OR (score = ? AND updated_at < ?))"
            );
            $stmt->execute([$mine['score'], $mine['score'], $mine['updated_at']]);
            $me['rank'] = (int) $stmt->fetchColumn() + 1;
        }
    }
    return ['top' => $top, 'me' => $me];
}

// ---------- Anfragen ----------

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    reply(200, board($pdo, $table, $visitor));
}
if ($method !== 'POST') {
    reply(405, ['error' => 'Nur GET oder POST.']);
}

session_start();
$action = $_POST['action'] ?? '';

if ($action === 'start') {
    // Neue Runde merken: zufällige Kennung und Startzeit. Nur die letzten paar behalten.
    $runs = $_SESSION['fl_runs'] ?? [];
    $run = bin2hex(random_bytes(8));
    $runs[$run] = microtime(true);
    $_SESSION['fl_runs'] = array_slice($runs, -RUNS_KEPT, null, true);
    reply(200, ['run' => $run]);
}

if ($action === 'save') {
    $run = (string) ($_POST['run'] ?? '');
    $score = filter_var($_POST['score'] ?? '', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => SCORE_MAX]]);
    $name = cleanName((string) ($_POST['name'] ?? ''));
    checkName($name);
    if ($score === false) {
        reply(422, ['error' => 'Ungültige Punktzahl.']);
    }
    $runs = $_SESSION['fl_runs'] ?? [];
    if (!isset($runs[$run])) {
        reply(403, ['error' => 'Diese Runde kennt der Server nicht (schon gespeichert oder zu alt). Spiel einfach nochmal.']);
    }
    $elapsed = microtime(true) - (float) $runs[$run];
    $needed = FIRST_POINT + ($score - 1) * PER_POINT;
    unset($runs[$run]); // jede Runde nur einmal
    $_SESSION['fl_runs'] = $runs;
    if ($elapsed < $needed) {
        reply(422, ['error' => 'So schnell fliegt nicht mal unser Spatz. Das Ergebnis wurde nicht gespeichert.']);
    }

    // Eine Zeile pro Browser. Nur ein besseres Ergebnis ersetzt das alte (dann zählt auch die neue Zeit).
    // Reihenfolge wichtig: updated_at zuerst, weil es noch mit dem alten score vergleicht.
    $stmt = $pdo->prepare(
        "INSERT INTO `$table` (visitor, name, score, created_at, updated_at)
         VALUES (?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
         ON DUPLICATE KEY UPDATE
           updated_at = IF(VALUES(score) > score, VALUES(updated_at), updated_at),
           score = GREATEST(score, VALUES(score)),
           name = VALUES(name)"
    );
    $stmt->execute([$visitor, $name, $score]);
    reply(200, board($pdo, $table, $visitor));
}

if ($action === 'name') {
    $name = cleanName((string) ($_POST['name'] ?? ''));
    checkName($name);
    $stmt = $pdo->prepare("UPDATE `$table` SET name = ? WHERE visitor = ?");
    $stmt->execute([$name, $visitor]);
    reply(200, board($pdo, $table, $visitor));
}

reply(400, ['error' => 'Unbekannte Aktion.']);
