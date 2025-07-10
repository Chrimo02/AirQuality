import pytest
from sensorik.read_sensor_data import SensorReader

class DummySerial:
    def __init__(self, lines):
        self._lines = lines
        self.in_waiting = bool(self._lines)
    def readline(self):
        if self._lines:
            line = self._lines.pop(0)
            self.in_waiting = bool(self._lines)
            return line.encode('utf-8')
        return b""
    def close(self):
        pass

@pytest.fixture(autouse=True)
def patch_serial(monkeypatch):
    import serial
    dummy_line = "PM1.0,0.1,PM2.5,0.2,PM10,0.3,TEMP,22,HUMID,45,device123"
    def fake_serial(port, baud, timeout):
        return DummySerial([dummy_line, ""])
    monkeypatch.setattr("sensorik.read_sensor_data.serial.Serial", fake_serial)
    yield

def test_lese_daten_and_parse():
    reader = SensorReader(port="dummy", baudrate=0)
    raw = reader.lese_daten()
    assert "PM1.0" in raw
    parsed = reader.parse_sensor_line(raw)
    assert parsed["PM1.0"] == 0.1
    assert parsed["PM2.5"] == 0.2
    assert parsed["PM10"] == 0.3
    assert parsed["TEMP"] == 22
    assert parsed["HUMID"] == 45
    assert parsed["device_id"] == "device123"

def test_get_rating_measurements_and_parsed_loop():
    reader = SensorReader(port="dummy", baudrate=0)
    raw = "PM1.0,0.1,PM2.5,0.2,PM10,0.3,TEMP,22,HUMID,45"
    parsed_from_serial = reader.lese_daten_parsed()
    expected = reader.get_rating_measurements(raw)
    for key in set(parsed_from_serial) & set(expected):
        assert parsed_from_serial[key] == expected[key]