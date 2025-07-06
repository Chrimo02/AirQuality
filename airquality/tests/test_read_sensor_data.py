import pytest
from sensorik.read_sensor_data import SensorReader

class DummySerial:
    def __init__(self, lines):
        self._lines = lines
        self.in_waiting = bool(lines)
    def readline(self):
        # simulate popping one line
        line = self._lines.pop(0)
        self.in_waiting = bool(self._lines)
        return line.encode('utf-8')
    def close(self):
        pass

@pytest.fixture(autouse=True)
def patch_serial(monkeypatch):
    # intercept serial.Serial to return DummySerial
    import serial
    def fake_serial(port, baud, timeout):
        return DummySerial([
            "PM1.0,0.1,PM2.5,0.2,PM10,0.3,TEMP,22,HUMID,45,device123",
            ""
        ])
    monkeypatch.setattr("sensorik.read_sensor_data.serial.Serial", fake_serial)
    yield

def test_lese_daten_and_parse():
    reader = SensorReader(port="dummy", baudrate=0)
    # first call: returns raw line
    raw = reader.lese_daten()
    assert "PM1.0" in raw
    # parse it
    parsed = reader.parse_sensor_line(raw)
    assert parsed["PM1.0"] == 0.1
    assert parsed["PM2.5"] == 0.2
    assert parsed["PM10"] == 0.3
    assert parsed["TEMP"] == 22
    assert parsed["HUMID"] == 45
    assert parsed["device_id"] == "device123"

def test_get_rating_measurements_and_parsed_loop():
    reader = SensorReader(port="dummy", baudrate=0)
    parsed = reader.lese_daten_parsed()
    # parsed should be same as parse_sensor_line
    assert parsed["PM2.5"] == reader.get_rating_measurements("PM1.0,0.1,PM2.5,2.5,PM10,3.3,TEMP,20,HUMID,60")["PM2.5"]
