# MMP Premium – Content Portfolio

> Platzhalter: Diese README wird im Lauf des Projekts ausgefüllt. Alles in _kursiv_ ersetzen.

Ein Scrollytelling-Portfolio für den Content von [MMP Premium](https://www.instagram.com/mmp_premium): ISE MAA, L.I.F.T, Berlin, Multimedia Awards 2025, Rotterdam, unsere Digezz-Projekte und die Nominierung für den Multimedia Award 2026, mit versteckten Easter Eggs, Achievements und dem Labubuech.

**Team:** Naim de Amri, Robin Uliten
**Modul:** Interaktive Medien 5, FH Graubünden, HS26
**Live:** _URL eintragen_

![Screenshot der Startseite](img/berge.jpg)

## Kurzbeschreibung

_Zwei bis drei Sätze: Was ist die Seite, für wen ist sie, was erlebt man beim Scrollen?_

## Aufbau der Seite

| Abschnitt                  | Inhalt                                                                         | Scrollytelling                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Hero                       | Bergbild, Content Portfolio, zugeklapptes Labubuech                            | Parallax, Vogel wechselt zum Flugbild und fliegt ein Stück weg                                                  |
| Featured                   | ISE MAA, unser neues Format in 3 Folgen auf YouTube                            | Pinker Vorhang geht auf, dann gepinnt: Folgen legen sich als Kartenstapel übereinander, Folgen-Navigation links |
| 01 L.I.F.T                 | Hopecore-Edit als eigenes MP4                                                  | Eigener Player in Pink (Play, Zeitleiste, Ton, Vollbild); stoppt beim Wegscrollen                               |
| 02 Berlin                  | Blockwoche, Recaps, Umfrage, Carousels, BTS, Spatzenlingo und das Projektvideo | Gepinnt, Galerie fährt seitwärts; Reels als Schlaufe (Klick öffnet Instagram), Carousels zum Blättern           |
| 03 Multimedia Awards 2025  | Dabei als Gäste: Recap + Voxpop als Reel (video/awards/)                       | Pokal, Text und Reel fliegen beim Hineinscrollen ein; Link führt zum Finale                                      |
| 04 Rotterdam               | Trailer, 2 Recaps und 3 Carousels (Beachdays, Kochen für 20 Personen)        | Gepinnt, Galerie fährt seitwärts; Reels als Schlaufe (Klick öffnet Instagram), Carousels zum Blättern; pinker Spatz → Flappy Spatz |
| 05 Digezz                  | Cuschinar Difficil, 6 Folgen auf YouTube, mit Illustration pro Gericht         | Gepinnt, Folgen fahren seitwärts, Illustrationen springen auf die Karten, Video stoppt beim Wegscrollen         |
| Finale: Multimedia Award 2026 | Nominiert mit Cuschinar Difficil, Film, Video & Animation; 17.12.2026, THE HALL Dübendorf | Gepinnt: Umschlag öffnet sich, Karte kommt heraus; Countdown; Knopf «Drück eus de Duume» mit Zähler (php/daumen.php) |
| Stay tuned                 | Ausblick                                                                       | Satz fährt beim Scrollen durchs Bild                                                                            |
| Labubuech                  | Gästebuch als Buch-Pop-up: mit Pfeilen blättern, 2 Minuten pro Tag schreiben   | Lesezeichen öffnet das Buch, Seiten klappen beim Blättern um                                                    |
| Flappy Spatz (flappy.html) | Minigame mit unserem Spatz, eigene Seite                                       | Canvas-Spiel: pinke Säulen, Berge ziehen als Parallaxe vorbei, lokaler Rekord                                   |

## Technologien

| Technologie                                                  | Wofür                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------- |
| HTML, CSS, JavaScript                                        | ganze Seite                                                   |
| [GSAP](https://gsap.com) und ScrollTrigger                   | Scrollytelling                                                |
| YouTube-Einbettung (youtube-nocookie)                        | Featured, Berlin, Awards und Digezz                           |
| Instagram-Einbettung (embed.js)                              | Bereit für weitere Beiträge, im Moment nicht im Einsatz       |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | Konfetti auf der Gewinnseite                                  |
| Canvas 2D und Web Audio API                                  | Spiel Flappy Spatz (flappy.js), Ton für Punkte                |
| localStorage                                                 | Achievements und Flappy-Spatz-Rekord (nur im eigenen Browser) |
| PHP (PDO) und MySQL                                          | Labubuech: Einträge laden und speichern, Regeln prüfen        |

## Ordnerstruktur

```
index.html      Portfolio
legacy.html     Altes Gewinnspiel (Easter Egg)
win.html        Gewinnseite (Easter Egg)
flappy.html     Minigame Flappy Spatz (Easter Egg)
style.css       Gestaltung
script.js       Scrollytelling und Easter Eggs des Portfolios
shared.js       Achievements, Meldungen und Hilfen für alle Seiten
flappy.js       Spiel Flappy Spatz
img/            Bilder
video/          Videos und Poster-Bilder
sound/          Sounds
php/            Labubuech: labubuech.php, config.example.php, labubuech.sql
                Daumen-Zähler (Finale): daumen.php, daumen.sql
```

## Lokal starten

_Beschreiben, wie man die Seite öffnet, z. B. mit der VS-Code-Erweiterung «Live Server» oder `php -S localhost:8000`._

## Labubuech (PHP und Datenbank)

Das Labubuech braucht einen Server mit PHP und MySQL. Auf GitHub Pages oder mit Live Server zeigt das Buch «Gerade nicht erreichbar».

1. Tabelle anlegen: `php/labubuech.sql` (in phpMyAdmin unter «SQL» einfügen), falls sie noch nicht existiert.
2. `php/config.example.php` kopieren, die Kopie `php/config.php` nennen und Zugangsdaten, Tabellenname und einen langen Zufallstext als `salt` eintragen. `config.php` steht in der `.gitignore` und kommt nicht ins Repo.
3. Alle Dateien auf den Server laden, auch `php/config.php`.

Der Server prüft die Regeln, nicht der Browser:

- Name höchstens 24, Nachricht höchstens 280 Zeichen (passt so immer auf eine Seite), Nachricht nicht leer
- ein Eintrag pro Besucher und Tag (Schweizer Zeit). Besucher werden über ein Cookie erkannt, nicht über die IP-Adresse, weil sich im FH-WLAN alle eine IP teilen.
- gespeichert wird nur innerhalb von 2 Minuten ab dem ersten Buchstaben (mit 15 Sekunden Puffer)

Einen Eintrag ausblenden: in phpMyAdmin bei diesem Eintrag `hidden` auf `1` setzen.

### Daumen-Zähler im Finale

Nutzt die gleiche `php/config.php` und das gleiche Besucher-Cookie wie das Labubuech.

1. Tabelle anlegen: `php/daumen.sql` in phpMyAdmin unter «SQL» einfügen.
2. Fertig. Heisst die Tabelle anders, in `config.php` zusätzlich `'table_daumen' => 'name'` eintragen.

Jeder Browser zählt einmal. Ohne PHP (z. B. mit Live Server) funktioniert der Knopf trotzdem, nur ohne Zahl.

Nach der Verleihung: in `index.html` beim Finale den Text bei `data-after` und das Badge «Nominiert» auf der Karte anpassen (z. B. «Gewonnen»).

Zum Testen nochmals schreiben: im Browser die Cookies der Seite löschen, dann gilt man als neuer Besucher.

## Easter Eggs (Liste für die Dozierenden)

Ein Klick auf den Zähler oben rechts (Stern) öffnet die Übersicht aller Achievements: gefundene mit Beschreibung, offene mit einem Tipp. Gespeichert wird im Browser (localStorage). Sind alle gefunden, kann man sie dort mit «Achievements nochmal neu suchen» (mit Bestätigung) zurücksetzen. Beim Finden erscheint unten links eine Meldung und es spielt `sound/achievement.mp3`.

| Easter Egg     | Wo                         | Auslöser                                                                 | Achievement  |
| -------------- | -------------------------- | ------------------------------------------------------------------------ | ------------ |
| Faahhhh-Button | Footer                     | Pinken Knopf «Nicht drücken» drücken                                     | FAAHHHH      |
| Piep           | Jeder goldene Vogel        | Anklicken, jedes Piepen ist etwas anders hoch                            | –            |
| Geheimfoto     | Jeder goldene Vogel        | Innerhalb von 1,5 Sekunden fünfmal anklicken                             | Geheimfoto   |
| Inside Joke    | Bildunterschriften         | Gepunktet unterstrichenes Wort antippen oder darüberfahren               | Insider      |
| Ganz unten     | Ende der Seite             | Bis zum Footer scrollen                                                  | Ganz unten   |
| Legacy         | Footer                     | Dreimal auf den Schriftzug «MMP PREMIUM» klicken, öffnet einen neuen Tab | Legacy       |
| Jackpot        | legacy.html                | «Gewinnspiel hier drücken», Gewinnchance 1 %                             | Jackpot      |
| Buttadawg      | legacy.html                | Bild rechts: darüberfahren und anklicken                                 | –            |
| Labubuech      | Hero links und am Ende     | Am pinken Lesezeichen ziehen (Klick auf den Deckel lässt es wackeln)     | –            |
| Flappy Spatz   | Pinker Spatz bei Rotterdam | Innerhalb von 1,5 Sekunden fünfmal anklicken, führt zum Spiel            | Flappy Spatz |
| Vielflieger    | flappy.html                | 10 Punkte schaffen                                                       | Vielflieger  |
| Daumen        | Finale (Award 2026)        | Knopf «Drück eus de Duume» drücken                                       | Daumen gedrückt |
| _weitere_      |                            |                                                                          |              |

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
