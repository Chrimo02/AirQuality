# sensor_read.py

import serial
import time
from datetime import datetime
import sqlite3

# Path zur SQLite-DB und Logfile
DB_FILE   = 'air_quality.db'
LOG_FILE  = 'ips7100_data.log'
SERIAL_PORT = '/dev/ttyUSB0'
BAUDRATE    = 115200

def init_serial_connection():
    try:
        ser = serial.Serial(SERIAL_PORT, BAUDRATE, timeout=2)
        print(f"[INFO] Verbindung zu {SERIAL_PORT} hergestellt.")
        return ser
    except serial.SerialException as e:
        print(f"[ERROR] Kann Verbindung zu {SERIAL_PORT} nicht öffnen: {e}")
        return None

def lese_daten(ser):
    try:
        if ser.in_waiting:
            zeile = ser.readline().decode('utf-8', errors='ignore').strip()
            return zeile
    except Exception as e:
        print(f"[ERROR] Fehler beim Lesen: {e}")
    return None

# ---  Neuer Block: DB-Initialisierung & Einfügen  ---
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS air_data (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp   TEXT    NOT NULL,
            pm1_0       REAL,
            pm2_5       REAL,
            pm10        REAL,
            raw_line    TEXT
        );
    ''')
    conn.commit()
    return conn

def insert_data(conn, raw_line):
    """
    Extrahiert PM1.0, PM2.5 und PM10 aus raw_line und speichert sie in SQLite.
    raw_line enthält z. B.:
    "PC0.1,17605,PC0.3,7042,PC0.5,1722,PC1.0,10,PC2.5,0,PC5.0,0,PC10,0,
     PM0.1,0.01611082,PM0.3,0.19010682,PM0.5,0.38713202,PM1.0,0.39689161,
     PM2.5,0.39689161,PM5.0,0.39689161,PM10,0.39689161, …"

    Wir suchen nach "PM1.0", "PM2.5" und "PM10" und nehmen jeweils das direkt folgende Element.
    """

    # 1) Teile die Zeile per Komma in Liste auf
    parts = raw_line.split(',')

    # 2) Standardmäßig None, falls nicht gefunden
    pm1_val   = None
    pm2p5_val = None
    pm10_val  = None

    # 3) Versuche, die Indizes von "PM1.0", "PM2.5" und "PM10" zu finden
    try:
        idx_pm1   = parts.index("PM1.0")
        pm1_val   = float(parts[idx_pm1 + 1])
    except (ValueError, IndexError):
        pm1_val = None

    try:
        idx_pm2p5 = parts.index("PM2.5")
        pm2p5_val = float(parts[idx_pm2p5 + 1])
    except (ValueError, IndexError):
        pm2p5_val = None

    try:
        idx_pm10  = parts.index("PM10")
        pm10_val  = float(parts[idx_pm10 + 1])
    except (ValueError, IndexError):
        pm10_val = None

    # 4) Zeitstempel erzeugen
    timestamp = datetime.now().isoformat()

    # 5) Einfügen in die Tabelle
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO air_data (timestamp, pm1_0, pm2_5, pm10, raw_line)
        VALUES (?, ?, ?, ?, ?)
    ''', (timestamp, pm1_val, pm2p5_val, pm10_val, raw_line))
    conn.commit()
# --- Ende Neuer Block  ---

def speichere_daten(daten):
    timestamp = datetime.now().isoformat()
    mit_zeit = f"{timestamp}, {daten}"
    with open(LOG_FILE, 'a') as f:
        f.write(mit_zeit + '\n')
    print(mit_zeit)

def main():
    ser = init_serial_connection()
    if not ser:
        return

    # Datenbank-Verbindung aufbauen
    conn = init_db()
    print("[INFO] Beginne mit dem Lesen der Sensordaten. (Abbrechen mit Strg+C)")
    try:
        while True:
            daten = lese_daten(ser)
            if daten:
                # 1) In Text-Logdatei speichern
                speichere_daten(daten)
                # 2) In SQLite-Tabelle einfügen
                insert_data(conn, daten)
                print(f"[DB] Eingetragen: {daten}")
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[INFO] Beendet durch Benutzer.")
    finally:
        ser.close()
        conn.close()

if __name__ == "__main__":
    main()
