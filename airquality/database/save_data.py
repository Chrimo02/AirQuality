import sqlite3
from datetime import datetime

LOG_FILE = 'ips7100_data.log'

def speichere_daten(raw_line: str):
    """
    Schreibt die rohe Sensor-Zeile in ein Logfile.
    """
    ts = datetime.now().isoformat()
    try:
        with open(LOG_FILE, 'a') as f:
            f.write(f"{ts}, {raw_line}\n")
        print(f"{ts}, {raw_line}")
    except IOError as e:
        print(f"[LOG-ERROR] Beim Schreiben in '{LOG_FILE}': {e}")

def insert_data(conn: sqlite3.Connection, raw_line: str, session_id: int):
    """
    Extrahiert PM1.0, PM2.5 und PM10 aus raw_line und speichert sie in SQLite.
    """
    parts = raw_line.split(',')

    def get_val(key: str):
        try:
            idx = parts.index(key)
            return float(parts[idx + 1])
        except (ValueError, IndexError):
            return None

    pm1   = get_val('PM1.0')
    pm2p5 = get_val('PM2.5')
    pm10  = get_val('PM10')
    ts    = datetime.now().isoformat()

    try:
        c = conn.cursor()
        c.execute('''
            INSERT INTO air_data
              (timestamp, pm1_0, pm2_5, pm10, raw_line, session_id)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (ts, pm1, pm2p5, pm10, raw_line, session_id))
        conn.commit()
    except sqlite3.Error as e:
        print(f"[DB-ERROR] Beim Einfügen in 'air_data': {e}")
