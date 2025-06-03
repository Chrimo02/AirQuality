# Smart Air Quality Automation

## Bisher implementiert
- sensorik/db_helper.py: Erstellt SQLite-Tabelle für Luftdaten
- sensorik/sensor_read.py: Liest Daten vom Sensor, schreibt in DB und Logfile

## Verzeichnisstruktur
sensorik/
docs/
.gitignore

## Installation
1. sqlite3 installieren: sudo apt update && sudo apt install sqlite3
2. Datenbank initialisieren: cd sensorik && python3 db_helper.py
3. Sensor-Skript starten: python3 sensor_read.py

