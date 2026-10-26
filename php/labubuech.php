<?php
/* =========================================================
   Labubuech – Schnittstelle zwischen Seite (script.js) und Datenbank

   GET                       -> { entries: [{name, text, date}], wroteToday, left }
   POST action=start         -> Zeit startet beim ersten Buchstaben -> { left }
   POST action=save          -> name, text speichern -> { entry: {name, text, date} }

   Regeln, die hier (und nicht im Browser) geprüft werden:
   - Name höchstens 24, Nachricht höchstens 400 Zeichen, Nachricht nicht leer
   - pro Besucher ein Eintrag pro Tag (Schweizer Zeit)
   - gespeichert wird nur innerhalb von 2 Minuten ab dem ersten Buchstaben

   Zugangsdaten stehen in php/config.php (nicht im Repo, siehe config.example.php).
   Läuft mit PHP 7.4 oder neuer.
   ========================================================= */

declare(strict_types=1);

date_default_timezone_set('Europe/Zurich');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const NAME_MAX = 24;
const TEXT_MAX = 400;
const SECONDS = 120; // zwei Minuten
const GRACE = 15; // Puffer für langsames Internet beim automatischen Speichern

function reply(int $status, array $data)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// ---------- Verbindung ----------

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    reply(500, ['error' => 'config.php fehlt. Vorlage: config.example.php']);
}
$config = require $configFile;

// Tabellenname kommt aus der Konfiguration, darum nur Buchstaben, Zahlen und _ erlauben
$table = preg_replace('/[^A-Za-z0-9_]/', '', $config['table']);

try {
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
    // Diese Verbindung rechnet in UTC, damit created_at überall gleich gelesen wird
    $pdo->exec("SET time_zone = '+00:00'");
} catch (PDOException $e) {
    reply(500, ['error' => 'Keine Verbindung zur Datenbank']);
}

// ---------- Besucher erkennen ----------
// Jeder Browser bekommt eine zufällige Kennung als Cookie (ein Jahr gültig).
// Bewusst nicht die IP-Adresse: In der FH teilen sich alle im gleichen WLAN eine IP,
// dann könnte nur eine Person pro Tag schreiben. Gespeichert wird nur ein Hash davon.

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

// Die Startzeit der zwei Minuten merkt sich die PHP-Session
session_start();
$today = date('Y-m-d'); // Schweizer Datum

// ---------- Hilfsfunktionen ----------

// Heute 00:00 Schweizer Zeit, umgerechnet in UTC (so steht created_at in der Datenbank)
function startOfTodayUtc(): string
{
    $start = new DateTime('today', new DateTimeZone('Europe/Zurich'));
    $start->setTimezone(new DateTimeZone('UTC'));
    return $start->format('Y-m-d H:i:s');
}

function wroteToday(PDO $pdo, string $table, string $visitor): bool
{
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM `$table` WHERE visitor = ? AND created_at >= ?");
    $stmt->execute([$visitor, startOfTodayUtc()]);
    return (int) $stmt->fetchColumn() > 0;
}

// Datum aus der Datenbank (UTC) als ISO-Text mit Zeitzone, z. B. 2026-10-26T13:27:00+00:00
function isoDate(string $utc): string
{
    return (new DateTime($utc, new DateTimeZone('UTC')))->format(DATE_ATOM);
}

// Wie viele Sekunden heute noch übrig sind, oder null wenn noch nicht angefangen
function secondsLeft(string $today)
{
    if (($_SESSION['lb_day'] ?? '') !== $today || !isset($_SESSION['lb_start'])) {
        return null;
    }
    return max(0, SECONDS - (time() - (int) $_SESSION['lb_start']));
}

function length(string $text): int
{
    return mb_strlen($text, 'UTF-8');
}

// ---------- Anfragen ----------

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = $pdo->query(
        "SELECT name, message, created_at FROM `$table` WHERE hidden = 0 ORDER BY created_at ASC, id ASC"
    )->fetchAll();

    $entries = [];
    foreach ($rows as $row) {
        $entries[] = [
            'name' => $row['name'],
            'text' => $row['message'],
            'date' => isoDate($row['created_at']),
        ];
    }

    reply(200, [
        'entries' => $entries,
        'wroteToday' => wroteToday($pdo, $table, $visitor),
        'left' => secondsLeft($today),
    ]);
}

if ($method !== 'POST') {
    reply(405, ['error' => 'Nur GET und POST']);
}

$action = $_POST['action'] ?? '';

if (wroteToday($pdo, $table, $visitor)) {
    reply(429, ['error' => 'Du hast heute schon ins Labubuech geschrieben.']);
}

if ($action === 'start') {
    // Nur beim ersten Mal pro Tag starten, sonst einfach die Restzeit melden
    if (secondsLeft($today) === null) {
        $_SESSION['lb_day'] = $today;
        $_SESSION['lb_start'] = time();
    }
    reply(200, ['left' => secondsLeft($today)]);
}

if ($action === 'save') {
    $name = trim((string) ($_POST['name'] ?? ''));
    $text = trim((string) ($_POST['text'] ?? ''));
    if ($name === '') {
        $name = 'anonym';
    }

    if ($text === '') {
        reply(422, ['error' => 'Die Nachricht ist leer.']);
    }
    if (length($name) > NAME_MAX || length($text) > TEXT_MAX) {
        reply(422, ['error' => 'Name oder Nachricht ist zu lang.']);
    }

    $start = ($_SESSION['lb_day'] ?? '') === $today ? (int) ($_SESSION['lb_start'] ?? 0) : 0;
    if ($start === 0) {
        reply(403, ['error' => 'Die Zeit wurde nicht gestartet. Lade die Seite neu.']);
    }
    if (time() - $start > SECONDS + GRACE) {
        reply(403, ['error' => 'Deine zwei Minuten sind vorbei. 😔']);
    }

    $stmt = $pdo->prepare("INSERT INTO `$table` (name, message, visitor) VALUES (?, ?, ?)");
    $stmt->execute([$name, $text, $visitor]);

    // Datum so zurückgeben, wie es jetzt in der Datenbank steht
    $stmt = $pdo->prepare("SELECT created_at FROM `$table` WHERE id = ?");
    $stmt->execute([$pdo->lastInsertId()]);
    $created = (string) $stmt->fetchColumn();

    reply(201, ['entry' => ['name' => $name, 'text' => $text, 'date' => isoDate($created)]]);
}

reply(400, ['error' => 'Unbekannte Aktion']);
