# main.py
#!/usr/bin/env python3
import time
import argparse

# Sensor- und DB-Funktionen
from sensorik.sensor_read import (
    init_serial_connection,
    lese_daten,
    speichere_daten,
    insert_data,
    parse_measurements
)
from sensorik.db_helper import init_db, start_session, end_session

# Aktorik und Regeln
from tp100_controller import TP100Controller
from aktorik.air_control_rules import AirControlRules
from aktorik.air_quality_rating import SessionType

# IPs und Tapo-Zugangsdaten
VENTILATOR_IP = "192.168.1.100"
DIFFUSOR_IP   = "192.168.1.101"
TAPO_EMAIL    = "deine@email.de"
TAPO_PASSWORD = "dein_passwort"

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

    # serielle Schnittstelle und DB-Session initialisieren
    ser = init_serial_connection()
    if not ser:
        return

    conn       = init_db()
    session_id = start_session(conn, args.session, args.location)
    print(f"[SESSION] #{session_id} '{args.session}' gestartet (Ort: {args.location})")

    # Aktoren und Regeln
    ventilator = TP100Controller(VENTILATOR_IP, TAPO_EMAIL, TAPO_PASSWORD)
    diffusor   = TP100Controller(DIFFUSOR_IP,   TAPO_EMAIL, TAPO_PASSWORD)
    rules      = AirControlRules(SessionType.INDOOR)

    print(f"System gestartet für Session '{args.session}'")
    try:
        while True:
            raw = lese_daten(ser)
            if not raw:
                time.sleep(1)
                continue

            speichere_daten(raw)
            insert_data(conn, raw, session_id)

            meas = parse_measurements(raw)
            # nur die interessierenden Keys extrahieren
            measurements = {k: meas[k] for k in ("PM2.5","CO2eq","VOCAQI","TEMP","HUMID") if k in meas}

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
        ser.close()
        conn.close()

if __name__ == "__main__":
    main()
