import time
import argparse

from sensorik.read_sensor_data import SensorReader
from database.save_data import speichere_daten, insert_data
from database.db_helper import init_db, start_session, end_session

from tp100_controller import TP100Controller
from aktorik.air_control_rules import AirControlRules
from aktorik.air_quality_rating import SessionType, AirQualityRules, air_quality_to_string

from mqtt_client import MQTTClient

MQTT_BROKER   = "172.20.10.4"
MQTT_PORT     = 1883
MQTT_TOPIC    = "airquality/command/led"
VENTILATOR_IP = "172.20.10.10"
DIFFUSOR_IP   = "172.20.10.11"
TAPO_EMAIL    = "airqualitythws@gmail.com"
TAPO_PASSWORD = "P20ro25g$"

def parse_args():
    p = argparse.ArgumentParser(
        description="Starte Luftmessung mit Session-Namen, Ort und Typ."
    )
    p.add_argument(
        "-s", "--session",
        required=True,
        help="Name der Mess-Session, z. B. 'Wohnzimmer'."
    )
    p.add_argument(
        "-l", "--location",
        default=None,
        help="Optionale Ortsbeschreibung, z. B. 'EG-Wohnzimmer'."
    )
    p.add_argument(
        "--type",
        choices=["indoor", "outdoor"],
        default="indoor",
        help="Session-Typ: indoor (Standard) oder outdoor"
    )
    return p.parse_args()

def main():
    args = parse_args()
    session_type = SessionType.INDOOR if args.type.lower() == "indoor" else SessionType.OUTDOOR
    reader = SensorReader()
    conn = init_db()
    session_id = start_session(conn, args.session, args.location, session_type.value)
    print(f"[SESSION] #{session_id} '{args.session}' ({session_type.value}) gestartet (Ort: {args.location})")
    ventilator = TP100Controller(VENTILATOR_IP, TAPO_EMAIL, TAPO_PASSWORD)
    diffusor   = TP100Controller(DIFFUSOR_IP, TAPO_EMAIL, TAPO_PASSWORD)
    rules      = AirControlRules(session_type)
    ratings    = AirQualityRules(session_type)
    mqtt_client = MQTTClient(MQTT_BROKER, MQTT_PORT, MQTT_TOPIC)
    print(f"System gestartet für Session '{args.session}' (Typ: {session_type.value})")
    try:
        while True:
            raw = reader.lese_daten()
            if not raw:
                time.sleep(1)
                continue
            speichere_daten(raw)
            insert_data(conn, raw, session_id)
            measurements = reader.get_rating_measurements(raw)
            overall_quality = ratings.get_overall_air_quality(measurements)
            overall_quality_str = air_quality_to_string(overall_quality)
            mqtt_client.publish(overall_quality_str)
            status_v = ventilator.get_status()
            if status_v == "AUS" and rules.needs_ventilation(measurements):
                print("Ventilator einschalten")
                ventilator.turn_on()
            elif status_v == "EIN" and rules.ventilation_not_needed(measurements):
                print("Ventilator ausschalten")
                ventilator.turn_off()
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
        reader.close()
        conn.close()

if __name__ == "__main__":
    main()
