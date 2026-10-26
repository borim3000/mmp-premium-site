# MMP Premium – Content Portfolio

> Platzhalter: Diese README wird im Lauf des Projekts ausgefüllt. Alles in _kursiv_ ersetzen.

Ein Scrollytelling-Portfolio für den Content von [MMP Premium](https://www.instagram.com/mmp_premium): L.I.F.T, Berlin, Rotterdam und unsere Digezz-Projekte, mit versteckten Easter Eggs, Achievements und dem Labubuech.

**Team:** Naim de Amri, Robin Uliten
**Modul:** Interaktive Medien 5, FH Graubünden, HS26
**Live:** _URL eintragen_

![Screenshot der Startseite](_img/berge.jpg_)

## Kurzbeschreibung

_Zwei bis drei Sätze: Was ist die Seite, für wen ist sie, was erlebt man beim Scrollen?_

## Aufbau der Seite

| Abschnitt | Inhalt | Scrollytelling |
| --- | --- | --- |
| Hero | Bergbild, Content Portfolio | Parallax, Vogel springt weg |
| 01 L.I.F.T | _Inhalt_ | Gepinnt, Scrollen spult das Video |
| 02 Berlin | _Inhalt_ | Gepinnt, Galerie fährt seitwärts |
| 03 Rotterdam | _Inhalt_ | Gepinnt, Galerie fährt seitwärts |
| 04 Digezz | _Inhalt_ | Gepinnt, Projekte wechseln beim Scrollen, Videos über YouTube |
| Labubuech | Gästebuch | _Stand eintragen_ |

## Technologien

| Technologie | Wofür |
| --- | --- |
| HTML, CSS, JavaScript | ganze Seite |
| [GSAP](https://gsap.com) und ScrollTrigger | Scrollytelling |
| YouTube-Einbettung (youtube-nocookie) | lange Videos im Kapitel Digezz |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | Konfetti auf der Gewinnseite |
| _PHP und Datenbank_ | _Accounts, Labubuech (geplant)_ |

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

## Easter Eggs (Liste für die Dozierenden)

| Easter Egg | Wo | Auslöser | Achievement |
| --- | --- | --- | --- |
| Faahhhh-Button | Footer | Gelben Knopf «Nicht drücken» drücken | FAAHHHH |
| Geheimfoto | Jeder goldene Vogel | Innerhalb von 1,5 Sekunden fünfmal anklicken | Geheimfoto |
| Inside Joke | Bildunterschriften | Gepunktet unterstrichenes Wort antippen oder darüberfahren | Insider |
| Ganz unten | Ende der Seite | Bis zum Footer scrollen | Ganz unten |
| Legacy | Footer | Dreimal auf den Schriftzug «MMP PREMIUM» klicken | Legacy |
| Jackpot | legacy.html | «Gewinnspiel hier drücken», Gewinnchance 1 % | Jackpot |
| Buttadawg | legacy.html | Bild rechts: darüberfahren und anklicken | – |
| _weitere_ | | | |

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
