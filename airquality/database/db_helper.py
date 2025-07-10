import sqlite3
from datetime import datetime

DB_FILE = 'database/air_quality.db'

def init_db():
    """
    Erstellt (falls nicht vorhanden) die SQLite-Datenbank mit:
      - sessions(id, name UNIQUE, location, start_time, end_time)
      - air_data(id, timestamp, pm1_0, pm2_5, pm10, raw_line, session_id)
    """
    conn = sqlite3.connect(DB_FILE)
    # Damit fetchone() Named-Access unterstützt statt reiner Tuples
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Tabelle für Sessions
    try:
        c.execute('''
          CREATE TABLE IF NOT EXISTS sessions (
             id          INTEGER PRIMARY KEY AUTOINCREMENT,
             name        TEXT    NOT NULL UNIQUE,
             location    TEXT,
             start_time  TEXT    NOT NULL,
             end_time    TEXT
          );
        ''')
    except sqlite3.Error as e:
        print(f"[DB-ERROR] Beim Erstellen der Tabelle 'sessions': {e}")

    # air_data um session_id erweitern
    try:
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
    except sqlite3.Error as e:
        print(f"[DB-ERROR] Beim Erstellen der Tabelle 'air_data': {e}")

    conn.commit()
    return conn

def start_session(conn, name: str, location: str = None) -> int:
    """
    Legt eine neue Mess-Session an und liefert die session_id.
    Wenn der Name bereits existiert, wird die vorhandene ID zurückgegeben.
    """
    c = conn.cursor()

    # Existierend prüfen
    try:
        c.execute('SELECT id FROM sessions WHERE name = ?', (name,))
        row = c.fetchone()
    except sqlite3.Error as e:
        print(f"[DB-ERROR] Bei SELECT session: {e}")
        return None

    if row:
        # schon vorhanden
        return row['id']

    # Neu anlegen
    ts = datetime.now().isoformat()
    try:
        c.execute('''
          INSERT INTO sessions (name, location, start_time)
          VALUES (?, ?, ?)
        ''', (name, location, ts))
        conn.commit()
    except sqlite3.IntegrityError as e:
        print(f"[DB-ERROR] IntegrityError bei Session-Insert: {e}")
        # Fallback: vorhandene ID holen
        c.execute('SELECT id FROM sessions WHERE name = ?', (name,))
        row = c.fetchone()
        return row['id'] if row else None
    except sqlite3.Error as e:
        print(f"[DB-ERROR] Bei INSERT session: {e}")
        return None

    return c.lastrowid

def end_session(conn, session_id: int):
    """Schließt eine Session mit Endzeit."""
    c = conn.cursor()
    ts = datetime.now().isoformat()
    try:
        c.execute('''
          UPDATE sessions
             SET end_time = ?
           WHERE id = ?
        ''', (ts, session_id))
        conn.commit()
    except sqlite3.Error as e:
        print(f"[DB-ERROR] Beim Beenden der Session #{session_id}: {e}")
