import sqlite3
import os
import pytest
from database.db_helper import init_db, start_session, end_session, DB_FILE

@pytest.fixture(autouse=True)
def clean_db(tmp_path, monkeypatch):
    # Override DB_FILE to use a temp file
    db_path = tmp_path / "test_air_quality.db"
    monkeypatch.setenv("DB_FILE", str(db_path))
    # Monkeypatch the constant in module
    import database.db_helper as dbh
    dbh.DB_FILE = str(db_path)
    yield
    # cleanup
    if db_path.exists():
        db_path.unlink()

def test_init_db_creates_tables():
    conn = init_db()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = {row[0] for row in cursor.fetchall()}
    assert "sessions" in tables
    assert "air_data" in tables
    conn.close()

def test_start_and_end_session():
    conn = init_db()
    # start new session
    sid = start_session(conn, "TestSession", "TestOrt")
    assert isinstance(sid, int)
    cursor = conn.cursor()
    cursor.execute("SELECT name, location, start_time, end_time FROM sessions WHERE id=?", (sid,))
    name, loc, start, end = cursor.fetchone()
    assert name == "TestSession"
    assert loc == "TestOrt"
    assert start is not None
    assert end is None

    # end session
    end_session(conn, sid)
    cursor.execute("SELECT end_time FROM sessions WHERE id=?", (sid,))
    assert cursor.fetchone()[0] is not None
    conn.close()

def test_start_session_duplicate_name_returns_same_id():
    conn = init_db()
    first = start_session(conn, "Dup", None)
    second = start_session(conn, "Dup", "OtherOrt")
    assert first == second
    conn.close()
