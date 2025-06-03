import sqlite3

DB_FILE = 'air_quality.db'

def init_db():
    """
    Erstellt (falls nicht vorhanden) die SQLite-Datenbank und Tabelle für die
    Luftdaten. Gibt die Connection zurück.
    """
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

if __name__ == '__main__':
    conn = init_db()
    print("[DB] Tabelle air_data ist bereit.")
    conn.close()
