#!/usr/bin/env python3
import time
from read_sensor_data import SensorReader
from tp100_controller import TP100Controller
from air_control_rules import AirControlRules
from air_quality_rating import SessionType

VENTILATOR_IP = "192.168.1.100"
DIFFUSOR_IP = "192.168.1.101"
TAPO_EMAIL = "deine@email.de"
TAPO_PASSWORD = "dein_passwort"

def main():
    sensor = SensorReader()
    ventilator = TP100Controller(VENTILATOR_IP, TAPO_EMAIL, TAPO_PASSWORD)
    diffusor = TP100Controller(DIFFUSOR_IP, TAPO_EMAIL, TAPO_PASSWORD)
    rules = AirControlRules(SessionType.INDOOR)
    
    print("System gestartet...")
    
    while True:
        data = sensor.lese_daten_parsed()
        if not data:
            continue
            
        measurements = {k: data[k] for k in ['PM2.5', 'CO2eq', 'VOCAQI', 'TEMP', 'HUMID'] if k in data}
        
        if not measurements:
            continue
            
        ventilator_status = ventilator.get_status()
        if ventilator_status == "AUS" and rules.needs_ventilation(measurements):
            print("Ventilator einschalten")
            ventilator.turn_on()
        elif ventilator_status == "EIN" and rules.ventilation_not_needed(measurements):
            print("Ventilator ausschalten")
            ventilator.turn_off()

        diffusor_status = diffusor.get_status()
        if diffusor_status == "AUS" and rules.diffusor_should_be_on(measurements):
            print("Diffusor einschalten")
            diffusor.turn_on()
        elif diffusor_status == "EIN" and rules.diffusor_should_be_off(measurements):
            print("Diffusor ausschalten")
            diffusor.turn_off()

        
        print(f"Messwerte: {measurements}")
        print(f"Ventilator: {ventilator.get_status()}, Diffusor: {diffusor.get_status()}")
        time.sleep(1)

if __name__ == "__main__":
    main()