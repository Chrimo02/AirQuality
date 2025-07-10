import sqlite3
import pytest
from database.db_helper import init_db, start_session
from database.save_data import insert_data, speichere_daten

@pytest.fixture
def conn(tmp_path, monkeypatch):
    # temporäre DB-Datei
    db_file = tmp_path / "test_air_quality.db"
    monkeypatch.setenv("DB_FILE", str(db_file))
    import database.db_helper as dbh
    dbh.DB_FILE = str(db_file)
    return init_db()

def test_insert_data_and_log(tmp_path, conn, capsys, monkeypatch):
    raw = "PM1.0,1.1,PM2.5,2.2,PM10,3.3,TEMP,20,HUMID,50"
    sid = start_session(conn, "SessionX", None)

    # prüfen, dass Werte in DB landen
    insert_data(conn, raw, sid)
    cur = conn.cursor()
    cur.execute("SELECT pm1_0, pm2_5, pm10, session_id FROM air_data")
    pm1, pm2p5, pm10, sess = cur.fetchone()
    assert pm1 == 1.1
    assert pm2p5 == 2.2
    assert pm10 == 3.3
    assert sess == sid

    # prüfen, dass Logfile geschrieben wird und Console-Output erfolgt
    log_file = tmp_path / "ips7100_data.log"
    monkeypatch.chdir(tmp_path)
    speichere_daten(raw)
    assert log_file.exists()
    content = log_file.read_text()
    assert raw in content

    captured = capsys.readouterr()
    assert raw in captured.out
