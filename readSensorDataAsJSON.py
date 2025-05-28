import serial
import time
import json
from datetime import datetime

SERIAL_PORT = '/dev/ttyUSB0'
BAUDRATE = 115200
LOG_FILE = 'sensor_data.json'

def init_serial_connection():
    try:
        ser = serial.Serial(SERIAL_PORT, BAUDRATE, timeout=2)
        print(f"[INFO] Verbunden mit {SERIAL_PORT}")
        return ser
    except serial.SerialException as e:
        print(f"[ERROR] Verbindung fehlgeschlagen: {e}")
        return None

def lese_daten(ser):
    try:
        if ser.in_waiting:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            return line
    except Exception as e:
        print(f"[ERROR] Lesefehler: {e}")
    return None

def parse_sensor_line(line):
    parts = [p.strip() for p in line.split(',')]
    print(f"[DEBUG] Anzahl Parts: {len(parts)}")
    print(f"[DEBUG] Erste 10 Parts: {parts[:10]}")

    if len(parts) < 2:
        return None  

    result = {}
    result['timestamp'] = datetime.now().isoformat()

    if len(parts) % 2 != 0:
        device_id = parts[-1]
        result['device_id'] = device_id
        parts = parts[:-1]
        print(f"[DEBUG] Device ID gefunden: {device_id}")

    i = 0
    while i < len(parts) - 1:
        key = parts[i]
        value = parts[i + 1]

        print(f"[DEBUG] Parsing: {key} = {value}")

        try:
            value = float(value)
            if value.is_integer():
                value = int(value)
        except ValueError:
            pass

        result[key] = value
        i += 2  

    return result

def speichere_json(daten):
    with open(LOG_FILE, 'a') as f:
        json.dump(daten, f)
        f.write('\n')  
    print(json.dumps(daten, indent=2))

def main():
    ser = init_serial_connection()
    if not ser:
        return

    print("[INFO] Warte auf Sensordaten. (Strg+C zum Beenden)")
    try:
        while True:
            zeile = lese_daten(ser)
            if zeile:
                print(f"[DEBUG] Empfangene rohe Zeile: '{zeile}'")  
                daten = parse_sensor_line(zeile)
                if daten:
                    speichere_json(daten)
                else:
                    print("[DEBUG] Parsing fehlgeschlagen")
            #time.sleep(1)
    except KeyboardInterrupt:
        print("\n[INFO] Abbruch durch Benutzer.")
    finally:
        ser.close()

if name == "main":
    main()