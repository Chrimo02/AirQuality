import sqlite3
from datetime import datetime

DB_FILE = 'database/air_quality.db'

def init_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    # Neue Spalte session_type ergänzen
    c.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            name          TEXT    NOT NULL UNIQUE,
            location      TEXT,
            start_time    TEXT    NOT NULL,
            end_time      TEXT,
            session_type  TEXT    NOT NULL
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

def start_session(conn, name: str, location: str = None, session_type: str = "indoor") -> int:
    c = conn.cursor()
    # Existiert schon?
    try:
        c.execute('SELECT id FROM sessions WHERE name = ?', (name,))
        row = c.fetchone()
    except sqlite3.Error as e:
        print(f"[DB-ERROR] Bei SELECT session: {e}")
        return None
    if row:
        return row['id']
    ts = datetime.now().isoformat()
    try:
        c.execute('''
            INSERT INTO sessions (name, location, start_time, session_type)
            VALUES (?, ?, ?, ?)
        ''', (name, location, ts, session_type))
        conn.commit()
    except sqlite3.IntegrityError as e:
        print(f"[DB-ERROR] IntegrityError bei Session-Insert: {e}")
        c.execute('SELECT id FROM sessions WHERE name = ?', (name,))
        row = c.fetchone()
        return row['id'] if row else None
    except sqlite3.Error as e:
        print(f"[DB-ERROR] Bei INSERT session: {e}")
        return None
    return c.lastrowid

def end_session(conn, session_id: int):
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
