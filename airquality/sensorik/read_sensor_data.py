import serial
import json
from datetime import datetime

class SensorReader:
    def __init__(self, port='/dev/ttyUSB0', baudrate=115200):
        try:
            self.ser = serial.Serial(port, baudrate, timeout=1)
            print(f"[INFO] Verbunden mit {port}")
        except serial.SerialException as e:
            print(f"[ERROR] Verbindung fehlgeschlagen: {e}")
            self.ser = None

    def lese_daten(self):
        try:
            line = self.ser.readline().decode('utf-8', errors='ignore').strip()
            if line:
                return line
        except Exception as e:
            print(f"[ERROR] Lesefehler: {e}")
        return None

    def parse_sensor_line(self, line):
        parts = [p.strip() for p in line.split(',')]
        # Debug-Ausgaben
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

    def speichere_json(self, daten, log_file='sensor_data.json'):
        with open(log_file, 'a') as f:
            json.dump(daten, f)
            f.write('\n')
        print(json.dumps(daten, indent=2))

    def get_rating_measurements(self, raw_line):
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

    def lese_daten_parsed(self):
        raw_line = self.lese_daten()
        if raw_line:
            return self.parse_sensor_line(raw_line)
        return None

    def close(self):
        if self.ser:
            self.ser.close()