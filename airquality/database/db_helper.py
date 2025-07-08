import sqlite3
from datetime import datetime

DB_FILE = 'database/air_quality.db'

def init_db():
    """
    Erstellt (falls nicht vorhanden) die SQLite-DB mit:
      - sessions(id, name UNIQUE, location, start_time, end_time)
      - air_data(id, timestamp, pm1_0, pm2_5, pm10, raw_line, session_id)
    """
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()

    # Sessions mit UNIQUE-Constraint auf 'name'
    c.execute('''
      CREATE TABLE IF NOT EXISTS sessions (
         id          INTEGER PRIMARY KEY AUTOINCREMENT,
         name        TEXT    NOT NULL UNIQUE,
         location    TEXT,
         start_time  TEXT    NOT NULL,
         end_time    TEXT
      );
    ''')

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
    """
    Legt eine neue Session nur dann an, wenn der Name noch nicht existiert.
    Falls schon vorhanden, wird die bestehende session_id zurückgegeben.
    """
    c = conn.cursor()

    # Existenz prüfen
    c.execute('SELECT id FROM sessions WHERE name = ?', (name,))
    row = c.fetchone()
    if row:
        return row[0]

    # Neu anlegen
    ts = datetime.now().isoformat()
    c.execute('''
      INSERT INTO sessions (name, location, start_time)
      VALUES (?, ?, ?)
    ''', (name, location, ts))
    conn.commit()
    return c.lastrowid

def end_session(conn, session_id: int):
    """Setzt die end_time für eine Session."""
    ts = datetime.now().isoformat()
    c = conn.cursor()
    c.execute('''
      UPDATE sessions
         SET end_time = ?
       WHERE id = ?
    ''', (ts, session_id))
    conn.commit()
