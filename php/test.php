<?php
/* Labubuech-Test: prüft Schritt für Schritt, ob der Server bereit ist.
   Im Browser öffnen: mmp-premium.ch/php/test.php
   NACH DEM TEST WIEDER LÖSCHEN (zeigt Infos zur Datenbank). */

ini_set('display_errors', '1');
error_reporting(E_ALL);
header('Content-Type: text/plain; charset=utf-8');

function ok($text) { echo "OK      $text\n"; }
function fail($text) { echo "FEHLER  $text\n"; exit; }

echo "Labubuech-Test\n==============\n\n";

ok('PHP läuft, Version ' . PHP_VERSION);
if (PHP_VERSION_ID < 70300) fail('PHP ist zu alt. Im Hosting-Panel PHP 8 einstellen.');

extension_loaded('pdo_mysql') ? ok('pdo_mysql vorhanden') : fail('pdo_mysql fehlt. Im Hosting-Panel aktivieren.');
extension_loaded('mbstring') ? ok('mbstring vorhanden') : fail('mbstring fehlt. Im Hosting-Panel aktivieren.');

$file = __DIR__ . '/config.php';
is_file($file) ? ok('config.php gefunden') : fail('config.php nicht gefunden. Sie muss hier liegen: ' . __DIR__);

$config = include $file;
is_array($config) ? ok('config.php gibt die Werte zurück') : fail('config.php muss so aussehen: <?php return [ \'db_host\' => ..., ... ];');

foreach (['db_host', 'db_name', 'db_user', 'db_pass', 'table', 'salt'] as $key) {
    if (!isset($config[$key]) || $config[$key] === '') fail("In config.php fehlt '$key' oder ist leer.");
}
ok("alle Einträge vorhanden (Host: {$config['db_host']}, Datenbank: {$config['db_name']}, Tabelle: {$config['table']})");

try {
    $pdo = new PDO(
        "mysql:host={$config['db_host']};dbname={$config['db_name']};charset=utf8mb4",
        $config['db_user'],
        $config['db_pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    ok('Verbindung zur Datenbank klappt');
} catch (Exception $e) {
    fail('Keine Verbindung zur Datenbank: ' . $e->getMessage());
}

$tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
if (!in_array($config['table'], $tables, true)) {
    fail("Tabelle '{$config['table']}' gibt es nicht. Vorhandene Tabellen: " . (implode(', ', $tables) ?: 'keine'));
}
ok("Tabelle '{$config['table']}' gefunden");

$columns = $pdo->query("SHOW COLUMNS FROM `{$config['table']}`")->fetchAll(PDO::FETCH_COLUMN);
$missing = array_diff(['id', 'created_at', 'name', 'message', 'hidden', 'visitor'], $columns);
if ($missing) fail('In der Tabelle fehlen Spalten: ' . implode(', ', $missing) . ' (vorhanden: ' . implode(', ', $columns) . ')');
ok('alle Spalten vorhanden: ' . implode(', ', $columns));

session_start() ? ok('Sessions funktionieren') : fail('Sessions funktionieren nicht (Hoster fragen).');

echo "\nAlles bereit. Das Labubuech sollte funktionieren.\nDiese Datei jetzt wieder löschen.\n";
