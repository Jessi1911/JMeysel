# JMeysel – das wachsende Nichts

Bestehende statische Website, weiterentwickelt auf Basis von `c699962`.
HTML, CSS und JavaScript; keine Build-Schritte oder neuen Laufzeitabhängigkeiten.

## Lokal starten

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Danach http://127.0.0.1:8765 öffnen.

## Konzept beibehalten

Dunkle violette Bühne, Manrope, Flieder, großzügige Abstände, ursprüngliche
15-teilige Geschichte einschließlich Finale und Rückkehrer-Begrüßung. Kein
Portfolio, kein Fortschrittsbalken. JM startet die Geschichte erneut; die
kleinen entdeckten Spuren bleiben für die laufende Sitzung erhalten.

## Bestandsaufnahme und Änderungen

- Vorhanden: Textgeschichte, Menü, Menü-Tap-Reaktionen, Lichtskulptur, Ghost-Rechtecke,
  Scroll-Hinweis und lokale Erinnerung an den Abschluss.
- Behoben: leerer Idle-Hinweis; endlose „Nein.“-Wiederholung ab Menüöffnung vier;
  zu kleine Klickflächen bei JM und Textbutton; fehlende Tab-Begrenzung im Dialog;
  fehlende Screenreader-Ansage der Geschichte; unsichtbare Hilfstexte im Lesebaum.
- Ergänzt: Reaktionen auf leere Hauptflächen (700 ms Abstand), neue Menürepliken
  und wiederholbare Scrollantworten (5 s Abstand). Shuffle-Bags verbrauchen alle
  Texte eines Pools vor der nächsten Runde und verhindern direkte Wiederholungen.
- Mobile: Wheel und Touch unabhängig von der primären Zeigerart; Wischschwelle,
  Mehrfinger-/Abbruchbehandlung; echter Scrollzugang, wenn Inhalte mehr Platz brauchen.
- Wachstum: maximal neun zurückhaltende Punkte, drei mit kurzen Linien.
  Ein neuer Punkt je 40 sichtbaren Sekunden bzw. neun Interaktionen, kombiniert.
- Überraschung: erste nach 65–100 aktiven Sekunden, weitere nach 70–120 Sekunden;
  nicht während Menü/Übergang oder in den ersten acht Sekunden nach einer Aktion.
  Bei reduzierter Bewegung erscheint stattdessen eine kurze Textreaktion.
- Ambient: bestehende langsame Bewegungen erhalten; permanente Animation großer
  Blur-Filter entfernt, Lichtgröße über Transform statt Width/Height animiert.
  Maus-Animation endet im Ruhezustand; unsichtbare Tabs pausieren dekorative Animationen.
- Logo: kleine SVG-Initialen mit gleicher Ober- und Unterkante, identischer Fliederfarbe.

## Tests

```sh
node --check script.js
node tests/interactions.cjs
```

Die Regressionstests führen das echte Script mit kleinem DOM-Ersatz und virtueller
Zeit aus: komplette Geschichte, Doppelklickschutz, Reset, Idle, Menüfokus, Textpools,
Wheel, Touch-Wischereignisse, Hintergrundpause, Wachstumsgrenze und seltene Ereignisse,
jeweils mit und ohne reduzierte Bewegung. Keine Test-Libraries notwendig.

Zusätzlich Browserprüfung: Desktop, 390×844, 320×568 und 844×390; Menü öffnen/schließen,
Escape/Tab, Menü-Taps, Hauptflächenklick, Doppelklick, Scrollversuch, echte Scrollbarkeit
im Querformat und 44-px-Bedienflächen. Keine JavaScript-Warnungen/Fehler im geprüften
Browserablauf. Touch wurde auf Ereignisebene getestet, nicht auf einem physischen
Telefon. Keine GPU-/FPS-Messung oder vollständige Screenreader-Prüfung durchgeführt.

## Weiterarbeit / Veröffentlichung

Die ursprüngliche GitHub-Historie bleibt erhalten. Keine Änderung der Domain,
Hosting-Konfiguration oder Veröffentlichung auf jmeysel.de. Vor einer Veröffentlichung
können die drei Website-Dateien im bestehenden Hosting übernommen werden.
