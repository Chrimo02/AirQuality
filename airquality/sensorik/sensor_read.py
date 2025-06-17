# sensorik/sensor_read.py
#!/usr/bin/env python3
import serial
import time
from datetime import datetime

from sensorik.db_helper import init_db, start_session, end_session

LOG_FILE    = 'ips7100_data.log'
SERIAL_PORT = '/dev/ttyUSB0'
BAUDRATE    = 115200

def init_serial_connection():
    """
    Öffnet die serielle Schnittstelle zum Sensor.
    """
    try:
        ser = serial.Serial(SERIAL_PORT, BAUDRATE, timeout=2)
        print(f"[INFO] Serielle Verbindung zu {SERIAL_PORT} hergestellt.")
        return ser
    except serial.SerialException as e:
        print(f"[ERROR] Kann Verbindung zu {SERIAL_PORT} nicht öffnen: {e}")
        return None

def lese_daten(ser):
    """
    Liest eine einzelne Zeile vom Sensor, wenn Daten verfügbar sind.
    """
    try:
        if ser.in_waiting:
            return ser.readline().decode('utf-8', errors='ignore').strip()
    except Exception as e:
        print(f"[ERROR] Fehler beim Lesen: {e}")
    time.sleep(1)
    return None

def insert_data(conn, raw_line, session_id):
    """
    Speichert Basismesswerte (PM1.0, PM2.5, PM10) in der SQLite-DB.
    """
    parts = raw_line.split(',')

    def get_val(key):
        try:
            idx = parts.index(key)
            return float(parts[idx + 1])
        except (ValueError, IndexError):
            return None

    pm1   = get_val('PM1.0')
    pm2p5 = get_val('PM2.5')
    pm10  = get_val('PM10')

    ts = datetime.now().isoformat()
    cur = conn.cursor()
    cur.execute('''
        INSERT INTO air_data
          (timestamp, pm1_0, pm2_5, pm10, raw_line, session_id)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (ts, pm1, pm2p5, pm10, raw_line, session_id))
    conn.commit()

def speichere_daten(raw_line):
    """
    Loggt die Rohzeile mit Zeitstempel in eine Datei.
    """
    ts = datetime.now().isoformat()
    with open(LOG_FILE, 'a') as f:
        f.write(f"{ts}, {raw_line}\n")
    print(f"{ts}, {raw_line}")

def parse_measurements(raw_line):
    """
    Parst verschiedene Sensorwerte und liefert ein dict zurück.
    """
    parts = raw_line.split(',')
    def get_val(key):
        try:
            return float(parts[parts.index(key) + 1])
        except (ValueError, IndexError):
            return 0.0

    return {
        'PM2.5':  get_val('PM2.5'),
        'CO2eq':  get_val('CO2eq'),
        'VOCAQI': get_val('VOCAQI'),
        'TEMP':   get_val('TEMP'),
        'HUMID':  get_val('HUMID'),
    }
