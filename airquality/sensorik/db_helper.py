import sqlite3
from datetime import datetime


DB_FILE = 'air_quality.db'

def init_db():
    """
    Erstellt (falls nicht vorhanden) die SQLite-Datenbank mit:
      - sessions(id, name, location, start_time, end_time)
      - air_data(id, timestamp, pm1_0, pm2_5, pm10, raw_line, session_id)
    """
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()

    # Tabelle für Sessions
    c.execute('''
      CREATE TABLE IF NOT EXISTS sessions (
         id          INTEGER PRIMARY KEY AUTOINCREMENT,
         name        TEXT    NOT NULL,
         location    TEXT,
         start_time  TEXT    NOT NULL,
         end_time    TEXT
      );
    ''')

    # air_data um session_id erweitern
    c.execute('''
      CREATE TABLE IF NOT EXISTS air_data (
         id          INTEGER PRIMARY KEY AUTOINCREMENT,
         timestamp   TEXT    NOT NULL,
         pm1_0       REAL,
         pm2_5       REAL,
         pm10        REAL,
         raw_line    TEXT,
         session_id  INTEGER NOT NULL,
         FOREIGN KEY(session_id) REFERENCES sessions(id)
      );
    ''')

    conn.commit()
    return conn

def start_session(conn, name: str, location: str = None) -> int:
    """Legt eine neue Mess-Session an und liefert die session_id."""
    ts = datetime.now().isoformat()
    c = conn.cursor()
    c.execute('''
      INSERT INTO sessions (name, location, start_time)
      VALUES (?, ?, ?)
    ''', (name, location, ts))
    conn.commit()
    return c.lastrowid

def end_session(conn, session_id: int):
    """Schließt eine Session mit Endzeit."""
    ts = datetime.now().isoformat()
    c = conn.cursor()
    c.execute('''
      UPDATE sessions
         SET end_time = ?
       WHERE id = ?
    ''', (ts, session_id))
    conn.commit()

if __name__ == '__main__':
    from datetime import datetime
    conn = init_db()
    print("[DB] sessions und air_data sind bereit.")
    conn.close()
