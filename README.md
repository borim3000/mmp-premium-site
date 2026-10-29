# MMP Premium – Content Portfolio

> Platzhalter: Diese README wird im Lauf des Projekts ausgefüllt. Alles in _kursiv_ ersetzen.

Ein Scrollytelling-Portfolio für den Content von [MMP Premium](https://www.instagram.com/mmp_premium): Cuschinar Difficil, L.I.F.T, Berlin, Multimedia Awards 2025, Rotterdam und unsere Digezz-Projekte, mit versteckten Easter Eggs, Achievements und dem Labubuech.

**Team:** Naim de Amri, Robin Uliten
**Modul:** Interaktive Medien 5, FH Graubünden, HS26
**Live:** _URL eintragen_

![Screenshot der Startseite](img/berge.jpg)

## Kurzbeschreibung

_Zwei bis drei Sätze: Was ist die Seite, für wen ist sie, was erlebt man beim Scrollen?_

## Aufbau der Seite

| Abschnitt                 | Inhalt                                                                       | Scrollytelling                                                                                |
| ------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Hero                      | Bergbild, Content Portfolio, zugeklapptes Labubuech                          | Parallax, Vogel wechselt zum Flugbild und fliegt ein Stück weg                                |
| Featured                  | Cuschinar Difficil, 6 Folgen auf YouTube                                     | Pinker Vorhang geht auf, dann gepinnt: Folgen fahren seitwärts, Video stoppt beim Wegscrollen |
| 01 L.I.F.T                | _Inhalt_                                                                     | Instagram-Reel, lädt im Hintergrund vor; Text und Reel fliegen ein                               |
| 02 Berlin                 | _Inhalt_                                                                     | Gepinnt, Galerie fährt seitwärts                                                              |
| 03 Multimedia Awards 2025 | _Inhalt_                                                                     | Pokal, Text und Bilder fliegen beim Hineinscrollen ein                                        |
| 04 Rotterdam              | _Inhalt_                                                                     | Gepinnt, Galerie fährt seitwärts                                                              |
| 05 Digezz                 | Cuschinar Difficil, ISEMAA                                                   | Gepinnt, Projekte wechseln beim Scrollen, Videos über YouTube                                 |
| Stay tuned                | Ausblick                                                                     | Satz fährt beim Scrollen durchs Bild                                                          |
| Labubuech                 | Gästebuch als Buch-Pop-up: mit Pfeilen blättern, 2 Minuten pro Tag schreiben | Lesezeichen öffnet das Buch, Seiten klappen beim Blättern um                                  |

## Technologien

| Technologie                                                  | Wofür                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------ |
| HTML, CSS, JavaScript                                        | ganze Seite                                            |
| [GSAP](https://gsap.com) und ScrollTrigger                   | Scrollytelling                                         |
| YouTube-Einbettung (youtube-nocookie)                        | Featured, Awards und Digezz                            |
| Instagram-Einbettung (embed.js)                              | L.I.F.T-Reel, lädt nach dem Seitenaufruf im Hintergrund                     |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | Konfetti auf der Gewinnseite                           |
| localStorage                                                 | Achievements (vorläufig, nur im eigenen Browser)       |
| PHP (PDO) und MySQL                                          | Labubuech: Einträge laden und speichern, Regeln prüfen |

## Ordnerstruktur

```
index.html      Portfolio
legacy.html     Altes Gewinnspiel (Easter Egg)
win.html        Gewinnseite (Easter Egg)
style.css       Gestaltung
script.js       Scrollytelling, Easter Eggs, Achievements
img/            Bilder
video/          Videos und Poster-Bilder
sound/          Sounds
php/            Labubuech: labubuech.php, config.example.php, labubuech.sql
```

## Lokal starten

_Beschreiben, wie man die Seite öffnet, z. B. mit der VS-Code-Erweiterung «Live Server» oder `php -S localhost:8000`._

## Labubuech (PHP und Datenbank)

Das Labubuech braucht einen Server mit PHP und MySQL. Auf GitHub Pages oder mit Live Server zeigt das Buch «Gerade nicht erreichbar».

1. Tabelle anlegen: `php/labubuech.sql` (in phpMyAdmin unter «SQL» einfügen), falls sie noch nicht existiert.
2. `php/config.example.php` kopieren, die Kopie `php/config.php` nennen und Zugangsdaten, Tabellenname und einen langen Zufallstext als `salt` eintragen. `config.php` steht in der `.gitignore` und kommt nicht ins Repo.
3. Alle Dateien auf den Server laden, auch `php/config.php`.

Der Server prüft die Regeln, nicht der Browser:

- Name höchstens 24, Nachricht höchstens 400 Zeichen, Nachricht nicht leer
- ein Eintrag pro Besucher und Tag (Schweizer Zeit). Besucher werden über ein Cookie erkannt, nicht über die IP-Adresse, weil sich im FH-WLAN alle eine IP teilen.
- gespeichert wird nur innerhalb von 2 Minuten ab dem ersten Buchstaben (mit 15 Sekunden Puffer)

Einen Eintrag ausblenden: in phpMyAdmin bei diesem Eintrag `hidden` auf `1` setzen.

Zum Testen nochmals schreiben: im Browser die Cookies der Seite löschen, dann gilt man als neuer Besucher.

## Easter Eggs (Liste für die Dozierenden)

Ein Klick auf den Zähler oben rechts (Stern) öffnet die Übersicht aller Achievements: gefundene mit Beschreibung, offene mit einem Tipp. Gespeichert wird im Browser (localStorage).

| Easter Egg     | Wo                     | Auslöser                                                                 | Achievement |
| -------------- | ---------------------- | ------------------------------------------------------------------------ | ----------- |
| Faahhhh-Button | Footer                 | Gelben Knopf «Nicht drücken» drücken                                     | FAAHHHH     |
| Piep           | Jeder goldene Vogel    | Anklicken, jedes Piepen ist etwas anders hoch                            | –           |
| Geheimfoto     | Jeder goldene Vogel    | Innerhalb von 1,5 Sekunden fünfmal anklicken                             | Geheimfoto  |
| Inside Joke    | Bildunterschriften     | Gepunktet unterstrichenes Wort antippen oder darüberfahren               | Insider     |
| Ganz unten     | Ende der Seite         | Bis zum Footer scrollen                                                  | Ganz unten  |
| Legacy         | Footer                 | Dreimal auf den Schriftzug «MMP PREMIUM» klicken, öffnet einen neuen Tab | Legacy      |
| Jackpot        | legacy.html            | «Gewinnspiel hier drücken», Gewinnchance 1 %                             | Jackpot     |
| Buttadawg      | legacy.html            | Bild rechts: darüberfahren und anklicken                                 | –           |
| Labubuech      | Hero links und am Ende | Am pinken Lesezeichen ziehen (Klick auf den Deckel lässt es wackeln)     | –           |
| _weitere_      |                        |                                                                          |             |

## Learnings

- _…_

## Schwierigkeiten

- _…_

## Verwendung von KI

_Wofür ihr KI-Tools eingesetzt habt und was ihr selbst gemacht habt._

## Ressourcen

- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Google Fonts](https://fonts.google.com): Bodoni Moda, Hanken Grotesk, Monoton
- _weitere Tutorials, Bilder, Sounds mit Quelle_
