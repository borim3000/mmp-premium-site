<?php
/* =========================================================
   Daumen drücken – Zähler fürs Finale (Multimedia Award 2026)

   GET   -> { count, pressed }   wie viele schon gedrückt haben, und ob dieser Browser schon
   POST  -> { count, pressed }   einmal drücken (pro Browser nur einmal gezählt)

   Nutzt die gleiche config.php wie das Labubuech (db_host, db_name, db_user, db_pass, salt).
   Tabellenname: 'table_daumen' in config.php, sonst "daumen". Tabelle anlegen: php/daumen.sql
   Läuft mit PHP 7.3 oder neuer.
   ========================================================= */

declare(strict_types=1);

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function reply(int $status, array $data)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

$debug = false;
set_exception_handler(function (Throwable $e) use (&$debug) {
    $data = ['error' => $e instanceof PDOException ? 'Datenbank-Fehler. Gibt es die Tabelle (php/daumen.sql)?' : 'PHP-Fehler.'];
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
$table = preg_replace('/[^A-Za-z0-9_]/', '', $config['table_daumen'] ?? 'daumen');

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

function state(PDO $pdo, string $table, string $visitor): array
{
    $count = (int) $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM `$table` WHERE visitor = ?");
    $stmt->execute([$visitor]);
    return ['count' => $count, 'pressed' => (int) $stmt->fetchColumn() > 0];
}

// ---------- Anfragen ----------

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // INSERT IGNORE: Hat dieser Browser schon gedrückt, passiert nichts (visitor ist eindeutig)
    $stmt = $pdo->prepare("INSERT IGNORE INTO `$table` (visitor, created_at) VALUES (?, UTC_TIMESTAMP())");
    $stmt->execute([$visitor]);
    reply(200, state($pdo, $table, $visitor));
}

if ($method === 'GET') {
    reply(200, state($pdo, $table, $visitor));
}

reply(405, ['error' => 'Nur GET oder POST.']);
