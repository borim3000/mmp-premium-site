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

| Abschnitt                 | Inhalt                                                                       | Scrollytelling                                                  |
| ------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Hero                      | Bergbild, Content Portfolio, zugeklapptes Labubuech                          | Parallax, Vogel wechselt zum Flugbild und fliegt ein Stück weg  |
| Featured                  | Cuschinar Difficil, 6 Folgen auf YouTube                                     | Gepinnt, Folgen fahren seitwärts, Video stoppt beim Wegscrollen |
| 01 L.I.F.T                | _Inhalt_                                                                     | Gepinnt, Scrollen spult das Video, mit Ton im Pop-up            |
| 02 Berlin                 | _Inhalt_                                                                     | Gepinnt, Galerie fährt seitwärts                                |
| 03 Multimedia Awards 2025 | _Inhalt_                                                                     | Pokal, Text und Bilder fliegen beim Hineinscrollen ein          |
| 04 Rotterdam              | _Inhalt_                                                                     | Gepinnt, Galerie fährt seitwärts                                |
| 05 Digezz                 | Cuschinar Difficil, ISEMAA                                                   | Gepinnt, Projekte wechseln beim Scrollen, Videos über YouTube   |
| Stay tuned                | Ausblick                                                                     | Satz fährt beim Scrollen durchs Bild                            |
| Labubuech                 | Gästebuch als Buch-Pop-up: mit Pfeilen blättern, 2 Minuten pro Tag schreiben | Lesezeichen öffnet das Buch, Seiten klappen beim Blättern um    |

## Technologien

| Technologie                                                  | Wofür                                                                   |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| HTML, CSS, JavaScript                                        | ganze Seite                                                             |
| [GSAP](https://gsap.com) und ScrollTrigger                   | Scrollytelling                                                          |
| YouTube-Einbettung (youtube-nocookie)                        | Featured, Awards und Digezz                                             |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | Konfetti auf der Gewinnseite                                            |
| localStorage                                                 | Achievements und Labubuech-Einträge (vorläufig, nur im eigenen Browser) |
| _PHP und Datenbank_                                          | _Accounts, Labubuech für alle (geplant)_                                |

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
```

## Lokal starten

_Beschreiben, wie man die Seite öffnet, z. B. mit der VS-Code-Erweiterung «Live Server» oder `php -S localhost:8000`._

## Labubuech zurücksetzen (zum Testen)

Solange es noch kein PHP gibt, speichert das Labubuech nur im eigenen Browser. In der Browser-Konsole gibt `localStorage.removeItem("mmp_labubuech_tag")` wieder zwei Minuten, `localStorage.removeItem("mmp_labubuech")` löscht die eigenen Einträge.

## Easter Eggs (Liste für die Dozierenden)

| Easter Egg     | Wo                     | Auslöser                                                             | Achievement |
| -------------- | ---------------------- | -------------------------------------------------------------------- | ----------- |
| Faahhhh-Button | Footer                 | Gelben Knopf «Nicht drücken» drücken                                 | FAAHHHH     |
| Geheimfoto     | Jeder goldene Vogel    | Innerhalb von 1,5 Sekunden fünfmal anklicken                         | Geheimfoto  |
| Inside Joke    | Bildunterschriften     | Gepunktet unterstrichenes Wort antippen oder darüberfahren           | Insider     |
| Ganz unten     | Ende der Seite         | Bis zum Footer scrollen                                              | Ganz unten  |
| Legacy         | Footer                 | Dreimal auf den Schriftzug «MMP PREMIUM» klicken                     | Legacy      |
| Jackpot        | legacy.html            | «Gewinnspiel hier drücken», Gewinnchance 1 %                         | Jackpot     |
| Buttadawg      | legacy.html            | Bild rechts: darüberfahren und anklicken                             | –           |
| Labubuech      | Hero links und am Ende | Am pinken Lesezeichen ziehen (Klick auf den Deckel lässt es wackeln) | –           |
| _weitere_      |                        |                                                                      |             |

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
