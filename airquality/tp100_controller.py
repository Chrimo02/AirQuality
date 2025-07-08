#!/usr/bin/env python3

from PyP100 import PyP100

# Daten aus Tapo App
TP100_IP = ""
TAPO_EMAIL = ""
TAPO_PASSWORD = ""

class TP100Controller:
    def __init__(self, ip, email, password):
        self.p100 = PyP100.P100(ip, email, password)
        self._login()

    def _login(self):
        try:
            self.p100.handshake()
            self.p100.login()
        except Exception as e:
            raise RuntimeError(f"Verbindung fehlgeschlagen: {e}")

    def turn_on(self):
        self.p100.turnOn()

    def turn_off(self):
        self.p100.turnOff()

    def get_status(self):
        info = self.p100.getDeviceInfo()
        return "EIN" if info.get('device_on', False) else "AUS"

    def get_name(self):
        return self.p100.getDeviceName()