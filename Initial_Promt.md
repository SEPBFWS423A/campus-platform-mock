# UI Mockup for CampusPlatform App

## Meta Details
- **Name:** CampusPlatform
- **Version:** 1.0.0
- **Description:** University platform for students and faculty to manage Grades, Courses Exams, upload Papers, etc. as well as get internal information about the university.
- **Target Audience:** Students and faculty of a university.
- **Platform:** Web application
- **Technology Stack:** Angular, Java, MariaDB

## Prompt

Erstelle ein UI Mockup für die CampusPlatform App, nur HTML und CSS (Nutze nur Javascript wenn notwendig). Die App soll responsiv sein und auf verschiedenen Geräten gut aussehen. Die App soll auch für mobile Geräte optimiert sein. 

Die App soll folgende Funktionen bieten:
- Anmeldung
- Dashboard (Wichtigste Funktionen der APP im Überblick)
- Vorlesungstermine (Kalender, bzw. Stundenplan)
- Noten
- Prüfungstermine
- Abgaben
- Downloads (Dokumente, Vorlesungsunterlagen, etc.)
- Informationen über die Universität

Nutze deine Kenntnisse in modernem UI Design. Erstelle einen Dark und einen Light Mode. Füge eine Navigationsleiste hinzu, die es dem Nutzer ermöglicht, zwischen den verschiedenen Funktionen zu wechseln (Desktop: oben, Mobile: links, ausklappbar).

---

## Promt 2

Wir brauchen diverse Anpassungen an der Webseite. Benutze dafür den SKILL.md:

### 1. Struktur

#### 1.1 Mock-DB
Stelle sicher, dass alle Daten - Nutzer, Vorlesungen, Termine, Prüfungen, Noten, etc. - alle Zentral über die Mock-DB gespeichert und abrufbar sind und Notenspiegel etc. daraus berechnet werden. Kein Hardcoding von Daten im js.

Überprüfe im gleichen Schritt, ob die Mock-DB weiterhin im .js oder in einer .json Datei existieren soll.

#### 1.2 Nutzergruppen

Die Seite hat 3 Nutzergruppen:

1. Studenten
2. Dozenten
3. Verwaltung

Füge drei User über die Mock-DB ein, die jeweils eine dieser Gruppierungen hat. 
Je nach dem, welcher Nutzer gerade angemeldet ist (füge im Nutzerdropdown eine Funktion zum Wechseln der Ansicht ein), ist der Aufbau der Seite anders. Erstelle für diese Nutzergruppen erstmal ein grundlegendes UI, was in Zukunft noch erweitert werden soll.

Überprüfe dabei noch, welche Funktionen, die man aktuell (Studentensicht) sehen kann, vielleicht zu einer anderen Nutzergruppe gehören.

### 2. Anpassungen an der Studentensicht

#### 2.1 Prüfungstermine (Prüfungen)

Der Reiter Prüfungen soll auschließlich den Prüfungsterminen gelten, d.h. bereits Bestandene, oder nicht Bestandene sollen mir dort nicht angezeigt werden. Passe in dem Schritt dann auch den Namen an.

#### 2.2 Notenansicht

Bestandene, Nicht Bestandene Prüfungen und dessen Ergebnisse sollen wie gewohnt in der Notenansicht stehen. Dazu soll noch angezeigt werden, um welchen Versuch es sich handelt, bzw. mit welchem Versuch die Prüfung abgeschlossen wurde.

#### 2.3 Kalender - Vorlesungen

Die Kalenderwoche die angezeigt wird soll immer die aktuelle Woche sein und sich automatisch anpassen. Ansonsten können die Mock Vorlesungen statisch bleiben.

---

## Promt 3

Verbessere die WebApp für Verwaltung und Dozenten (achte auf shared css, clean code und vermeide Redundaten Code):

### Dashboard

Überarbeite das Dashboard für Dozenten und Verwaltung, sodass es Logisch zu diesen Rollen passt und eine gute Übersicht und logische Schnellzugriffe bietet,

### Für Rollengruppe Verwaltung

Überarbeite die Tabs Belegungsplan und Auslastung sowie Prüfungsamt. Sorge für ein gefixtes UI und bessere Nutzerfreundlichkeit, auch bei den Popups.

### Für Rollengruppe Dozenten

Überarbeite meine Kurse und Notenvergabe für bessere Nutzerfreundlichkeit. Überlege, ob noch Funktionen für Dozenten fehlen.

### Responsiveness für die gesamte App

Die App ist noch nicht Responsive genug, überarbeite, verbessere und repariere das für alle Nutzergruppen

