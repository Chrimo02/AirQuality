# main.py
#!/usr/bin/env python3
import time
import argparse

# Sensor- und DB-Funktionen
from sensorik.read_sensor_data import SensorReader
from airquality.database.save_data import speichere_daten, insert_data
from database.db_helper import init_db, start_session, end_session

# Aktorik und Regeln
from tp100_controller import TP100Controller
from aktorik.air_control_rules import AirControlRules
from aktorik.air_quality_rating import SessionType
from aktorik.air_quality_rating import air_quality_to_string
from aktorik.air_quality_rating import AirQualityRules

# MQTT-Client
from mqtt_client import MQTTClient

# Konfiguration für MQTT
MQTT_BROKER = "172.20.10.4"
MQTT_PORT = 1883
MQTT_TOPIC = "airquality/command/led"

# IPs und Tapo-Zugangsdaten
VENTILATOR_IP = "172.20.10.5"
DIFFUSOR_IP   = "172.20.10.6"
TAPO_EMAIL    = "airqualitythws@gmail.com"
TAPO_PASSWORD = "P20ro25g$"


def parse_args():
    p = argparse.ArgumentParser(
        description="Starte Luftmessung mit Session-Namen und Ort."
    )
    p.add_argument(
        "-s", "--session",
        required=True,
        help="Name der Mess-Session, z.B. 'Wohnzimmer'."
    )
    p.add_argument(
        "-l", "--location",
        default=None,
        help="Optionale Beschreibung des Ortes, z.B. 'EG-Wohnzimmer'."
    )
    return p.parse_args()

def main():
    args = parse_args()
    canareei5Reader = SensorReader()

    conn       = init_db()
    session_id = start_session(conn, args.session, args.location)
    print(f"[SESSION] #{session_id} '{args.session}' gestartet (Ort: {args.location})")

    # Aktoren und Regeln
    ventilator = TP100Controller(VENTILATOR_IP, TAPO_EMAIL, TAPO_PASSWORD)
    diffusor   = TP100Controller(DIFFUSOR_IP,   TAPO_EMAIL, TAPO_PASSWORD)
    rules      = AirControlRules(SessionType.INDOOR)
    ratings    = AirQualityRules(SessionType.INDOOR)

    # MQTT-Client initialisieren
    mqtt_client = MQTTClient(MQTT_BROKER, MQTT_PORT, MQTT_TOPIC)

    print(f"System gestartet für Session '{args.session}'")
    try:
        while True:
            raw = canareei5Reader.lese_daten()
            if not raw:
                time.sleep(1)
                continue

            speichere_daten(raw)
            insert_data(conn, raw, session_id)

            measurements = canareei5Reader.get_rating_measurements(raw)
           
            # Airquality-Stufe bestimmen
            AirQualityRules 
            overall_quality = ratings.get_overall_air_quality(measurements)
            overall_quality_str = air_quality_to_string(overall_quality)

            # MQTT-Nachricht senden
            mqtt_client.publish(overall_quality_str)

            # Ventilator steuern
            status_v = ventilator.get_status()
            if status_v == "AUS" and rules.needs_ventilation(measurements):
                print("Ventilator einschalten")
                ventilator.turn_on()
            elif status_v == "EIN" and rules.ventilation_not_needed(measurements):
                print("Ventilator ausschalten")
                ventilator.turn_off()

            # Diffusor steuern
            status_d = diffusor.get_status()
            if status_d == "AUS" and rules.diffusor_should_be_on(measurements):
                print("Diffusor einschalten")
                diffusor.turn_on()
            elif status_d == "EIN" and rules.diffusor_should_be_off(measurements):
                print("Diffusor ausschalten")
                diffusor.turn_off()

            print(f"Messwerte: {measurements}")
            print(f"Ventilator: {ventilator.get_status()}, Diffusor: {diffusor.get_status()}")
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n[INFO] Beendet durch Benutzer.")
    finally:
        end_session(conn, session_id)
        print(f"[SESSION] #{session_id} beendet.")
        canareei5Reader.close()
        conn.close()

if __name__ == "__main__":
    main()
