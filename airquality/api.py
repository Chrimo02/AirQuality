#!/usr/bin/env python3
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Literal
import json
import asyncio
from datetime import datetime, timedelta
import sqlite3
import uvicorn

from database.db_helper import init_db, start_session, end_session
from sensorik.read_sensor_data import SensorReader
from aktorik.air_quality_rating import AirQualityRules, SessionType, AirQuality, air_quality_to_string
from aktorik.air_control_rules import AirControlRules
from tp100_controller import TP100Controller
from mqtt_client import MQTTClient

app = FastAPI(title="Air Quality Monitor API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  
        "http://localhost:5173",  
        "http://127.0.0.1:5173",
        "http://localhost:8080", 
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = 'database/air_quality.db'
sensor_reader = None
current_session_id = None
websocket_connections = []

MQTT_BROKER   = "172.20.10.4"
MQTT_PORT     = 1883
MQTT_TOPIC    = "airquality/command/led"
VENTILATOR_IP = "172.20.10.5"
DIFFUSOR_IP = "172.20.10.6"
TAPO_EMAIL = "thwsairquality@gmail.com"
TAPO_PASSWORD = "P20ro25g$"
ventilator_auto = True
diffusor_auto = True
last_vent_state  = None          
last_diff_state  = None

mqtt_client = None

class SessionCreate(BaseModel):
    name: str
    location: Optional[str] = None
    session_type: Literal["indoor", "outdoor"] = "indoor"

class SessionResponse(BaseModel):
    id: int
    name: str
    location: Optional[str]
    start_time: str
    end_time: Optional[str]
    is_active: bool
    session_type: str   

class MeasurementResponse(BaseModel):
    id: int
    timestamp: str
    pm1_0: Optional[float]
    pm2_5: Optional[float]
    pm10: Optional[float]
    raw_line: str
    session_id: int
    parsed_data: Dict[str, Any]

class LiveDataResponse(BaseModel):
    timestamp: str
    measurements: Dict[str, float]
    air_quality_rating: Dict[str, Any]
    overall_quality: str
    parsed_data: Dict[str, Any]
    ventilator_auto: bool
    diffusor_auto:   bool
    ventilator_state: str
    diffusor_state:   str

class DeviceStatus(BaseModel):
    name: str
    status: str
    ip: str

class DeviceControl(BaseModel):
    action: str  # "on", "off", "auto"

def get_db_connection():
    return sqlite3.connect(DB_FILE)

def get_current_session_type() -> SessionType:
    global current_session_id
    
    if not current_session_id:
        return SessionType.INDOOR
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT session_type
            FROM sessions
            WHERE id = ? AND end_time IS NULL
        """, (current_session_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            session_type_str = result[0]
            return SessionType.INDOOR if session_type_str == "indoor" else SessionType.OUTDOOR
        else:
            # Session existiert nicht oder ist beendet
            return SessionType.INDOOR
            
    except Exception as e:
        print(f"Error getting session type: {e}")
        return SessionType.INDOOR

def get_air_quality_rules() -> AirQualityRules:
    session_type = get_current_session_type()
    return AirQualityRules(session_type)

def get_air_control_rules() -> AirControlRules:
    session_type = get_current_session_type()
    return AirControlRules(session_type)

def parse_raw_line_to_dict(raw_line: str) -> Dict[str, Any]:
    if not sensor_reader:
        return {}
    
    try:
        parsed = sensor_reader.parse_sensor_line(raw_line)
        return parsed if parsed else {}
    except Exception as e:
        print(f"Error parsing raw line: {e}")
        return {}

def get_air_quality_colors():
    return {
        "SEHR GUT": "#00C851",      
        "GUT": "#7CB342",           
        "MAESSIG": "#FFB300",       
        "SCHLECHT": "#FF8A00",      
        "SEHR SCHLECHT": "#FF4444"  
    }

@app.on_event("startup")
async def startup_event():
    global sensor_reader, mqtt_client, last_vent_state, last_diff_state

    conn = init_db()
    conn.close()
    
    try:
        sensor_reader = SensorReader()
        print("Sensor erfolgreich initialisiert")
    except Exception as e:
        print(f"Sensor konnte nicht initialisiert werden: {e}")
        sensor_reader = None
    try:
        ventilator = TP100Controller(VENTILATOR_IP, TAPO_EMAIL, TAPO_PASSWORD)
        diffusor = TP100Controller(DIFFUSOR_IP, TAPO_EMAIL, TAPO_PASSWORD)
        last_vent_state = ventilator.get_status()
        last_diff_state = diffusor.get_status()

    except Exception as e:
        print(f"Fehler beim Abrufen des Gerätestatus beim Start: {e}")
    try:
        mqtt_client = MQTTClient(MQTT_BROKER, MQTT_PORT, MQTT_TOPIC)
        print(f"MQTT Client verbunden mit {MQTT_BROKER}:{MQTT_PORT}, Topic: {MQTT_TOPIC}")
    except Exception as e:
        print(f"MQTT Client konnte nicht verbunden werden: {e}")
        mqtt_client = None
    
    asyncio.create_task(live_data_loop())
    asyncio.create_task(mqtt_reconnect_loop())

@app.websocket("/ws/live-data")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    websocket_connections.append(websocket)
    try:
        await websocket.receive_text()
    finally:
        if websocket in websocket_connections:
            websocket_connections.remove(websocket)



async def broadcast_live_data(data: Dict[str, Any]):
    if not websocket_connections:
        return
    
    connections_copy = websocket_connections.copy()
    
    for websocket in connections_copy:
        try:
            await websocket.send_text(json.dumps(data))
        except Exception as e:
            print(f"Error sending to WebSocket: {e}")
            if websocket in websocket_connections:
                websocket_connections.remove(websocket)

async def live_data_loop():
    global current_session_id, mqtt_client
    global ventilator_auto, diffusor_auto, last_vent_state, last_diff_state

    while True:
        try:
            if not sensor_reader:
                await asyncio.sleep(1)
                continue

            raw_line = sensor_reader.lese_daten()
            if not raw_line:
                await asyncio.sleep(1)
                continue

            # Vollständige Parser-Daten holen
            parsed = sensor_reader.parse_sensor_line(raw_line)

            # Wenn Session aktiv, Raw-Line in DB speichern
            if current_session_id:
                conn = get_db_connection()
                from database.save_data import insert_data
                insert_data(conn, raw_line, current_session_id)
                conn.close()

            # Nur die fünf Schlüsselmesswerte für die Rating-Logik extrahieren
            rating_vals = sensor_reader.get_rating_measurements(raw_line)

            # Gesamt- und Einzel-Rating berechnen
            rules = get_air_quality_rules()
            overall_quality = rules.get_overall_air_quality(rating_vals)
            overall_quality_str = air_quality_to_string(overall_quality)

            # MQTT Publish
            if mqtt_client:
                try:
                    mqtt_client.publish(overall_quality_str)
                except Exception as e:
                    print(f"Fehler beim MQTT Publish: {e} - MQTT Client wird neu verbunden")
                    mqtt_client = None # löst den reconnect im mqtt_reconnect_loop() aus

            # Automatische Steuerung
            control_rules = get_air_control_rules()
            if ventilator_auto:
                global last_vent_state
                if control_rules.needs_ventilation(rating_vals) and last_vent_state != "on":
                    TP100Controller(VENTILATOR_IP, TAPO_EMAIL, TAPO_PASSWORD).turn_on()
                    last_vent_state = "on"
                elif control_rules.ventilation_not_needed(rating_vals) and last_vent_state != "off":
                    TP100Controller(VENTILATOR_IP, TAPO_EMAIL, TAPO_PASSWORD).turn_off()
                    last_vent_state = "off"

            if diffusor_auto:
                global last_diff_state
                if control_rules.diffusor_should_be_on(rating_vals) and last_diff_state != "on":
                    TP100Controller(DIFFUSOR_IP, TAPO_EMAIL, TAPO_PASSWORD).turn_on()
                    last_diff_state = "on"
                elif control_rules.diffusor_should_be_off(rating_vals) and last_diff_state != "off":
                    TP100Controller(DIFFUSOR_IP, TAPO_EMAIL, TAPO_PASSWORD).turn_off()
                    last_diff_state = "off"

            print(
                "[DEBUG] Steckdosen  |  "
                f"Ventilator: {'AUTO' if ventilator_auto else 'MAN'} / {last_vent_state or 'unknown'}   ||   "
                f"Diffusor: {'AUTO' if diffusor_auto else 'MAN'} / {last_diff_state or 'unknown'}"
            )

            ratings = {}
            for param, val in rating_vals.items():
                rating = rules.rate_parameter(val, param)
                ratings[param] = {
                    'value': val,
                    'rating': air_quality_to_string(rating),
                    'color': get_air_quality_colors()[air_quality_to_string(rating)]
                }

            measurements_all = {
                k: v for k, v in parsed.items()
                if isinstance(v, (int, float))
            }

            # Payload bauen und broadcasten
            live_data = {
                'timestamp': datetime.now().isoformat(),
                'measurements': measurements_all,
                'air_quality_rating': ratings,
                'overall_quality': overall_quality_str,
                'overall_color': get_air_quality_colors()[overall_quality_str],
                'parsed_data': parsed,
                'session_type': get_current_session_type().value,
                'ventilator_auto':  ventilator_auto,
                'diffusor_auto':    diffusor_auto,
                'ventilator_state': last_vent_state,
                'diffusor_state':   last_diff_state
            }
            await broadcast_live_data(live_data)

            await asyncio.sleep(1)

        except Exception as e:
            print(f"Error in live data loop: {e}")
            await asyncio.sleep(5)

async def mqtt_reconnect_loop():
    #Versucht alle 30 Sekunden, den MQTT-Client neu zu verbinden, falls mqtt_client aktuell None ist.

    global mqtt_client
    while True:
        if mqtt_client is None:
            try:
                mqtt_client = MQTTClient(MQTT_BROKER, MQTT_PORT, MQTT_TOPIC)
                print(f"[MQTT] Reconnected to broker at {MQTT_BROKER}:{MQTT_PORT}")
            except Exception as e:
                print(f"[MQTT] Reconnect failed: {e}")
        await asyncio.sleep(30)

# API Endpoints
@app.get("/")
async def root():
    return {"message": "Air Quality Monitor API"}

@app.get("/sessions", response_model=List[SessionResponse])
async def get_sessions():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, name, location, start_time, end_time, session_type
        FROM sessions
        ORDER BY start_time DESC
    """)
    
    sessions = []
    for row in cursor.fetchall():
        sessions.append(SessionResponse(
            id=row[0],
            name=row[1],
            location=row[2],
            start_time=row[3],
            end_time=row[4],
            is_active=(row[4] is None),  
            session_type=row[5]  
        ))
    
    conn.close()
    return sessions

@app.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, name, location, start_time, end_time, session_type
        FROM sessions
        WHERE id = ?
    """, (session_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return SessionResponse(
        id=row[0],
        name=row[1],
        location=row[2],
        start_time=row[3],
        end_time=row[4],
        is_active=(row[4] is None),
        session_type=row[5]  
    )

@app.post("/sessions", response_model=SessionResponse)
async def create_session(session: SessionCreate):
    global current_session_id
    
    conn = get_db_connection()
    
    try:
        session_id = start_session(
            conn, 
            session.name, 
            session.location, 
            session.session_type  
        )
        current_session_id = session_id
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, location, start_time, end_time, session_type
            FROM sessions
            WHERE id = ?
        """, (session_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        return SessionResponse(
            id=row[0],
            name=row[1],
            location=row[2],
            start_time=row[3],
            end_time=row[4],
            is_active=(row[4] is None),
            session_type=row[5]  
        )
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/sessions/{session_id}/end")
async def end_session_endpoint(session_id: int):
    global current_session_id
    
    conn = get_db_connection()
    
    try:
        end_session(conn, session_id)
        if current_session_id == session_id:
            current_session_id = None
        conn.close()
        
        return {"message": "Session ended successfully"}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/sessions/{session_id}/data")
async def get_session_data(session_id: int, limit: Optional[int] = 1000):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, timestamp, pm1_0, pm2_5, pm10, raw_line, session_id
        FROM air_data
        WHERE session_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
    """, (session_id, limit))
    
    data = []
    for row in cursor.fetchall():
        parsed_data = parse_raw_line_to_dict(row[5])  
        data.append(MeasurementResponse(
            id=row[0],
            timestamp=row[1],
            pm1_0=row[2],
            pm2_5=row[3],
            pm10=row[4],
            raw_line=row[5],
            session_id=row[6],
            parsed_data=parsed_data
        ))
    
    conn.close()
    return data

@app.get("/sessions/{session_id}/data/since/{timestamp}")
async def get_session_data_since(session_id: int, timestamp: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, timestamp, pm1_0, pm2_5, pm10, raw_line, session_id
        FROM air_data
        WHERE session_id = ? AND timestamp > ?
        ORDER BY timestamp ASC
    """, (session_id, timestamp))
    
    data = []
    for row in cursor.fetchall():
        parsed_data = parse_raw_line_to_dict(row[5])
        data.append(MeasurementResponse(
            id=row[0],
            timestamp=row[1],
            pm1_0=row[2],
            pm2_5=row[3],
            pm10=row[4],
            raw_line=row[5],
            session_id=row[6],
            parsed_data=parsed_data
        ))
    
    conn.close()
    return data

@app.get("/live-data")
async def get_current_live_data():
    global last_diff_state, last_vent_state, diffusor_auto, ventilator_auto
    if not sensor_reader:
        raise HTTPException(status_code=503, detail="Sensor not available")

    raw_line = sensor_reader.lese_daten()
    if not raw_line:
        raise HTTPException(status_code=204, detail="No data available")

    parsed = sensor_reader.parse_sensor_line(raw_line)

    rating_vals = sensor_reader.get_rating_measurements(raw_line)

    rules = get_air_quality_rules()
    overall_quality = rules.get_overall_air_quality(rating_vals)
    overall_quality_str = air_quality_to_string(overall_quality)

    ratings = {}
    for param, val in rating_vals.items():
        rating = rules.rate_parameter(val, param)
        ratings[param] = {
            'value': val,
            'rating': air_quality_to_string(rating),
            'color': get_air_quality_colors()[air_quality_to_string(rating)]
        }

    measurements_all = {
        k: v for k, v in parsed.items()
        if isinstance(v, (int, float))
    }

    return LiveDataResponse(
        timestamp=datetime.now().isoformat(),
        measurements=measurements_all,
        air_quality_rating=ratings,
        overall_quality=overall_quality_str,
        parsed_data=parsed,
        ventilator_auto=ventilator_auto,
        diffusor_auto=diffusor_auto,
        ventilator_state=last_vent_state,
        diffusor_state=last_diff_state
    )

# Gerätesteuerung
@app.get("/devices/status")
async def get_devices_status():
    try:
        ventilator = TP100Controller(VENTILATOR_IP, TAPO_EMAIL, TAPO_PASSWORD)
        diffusor = TP100Controller(DIFFUSOR_IP, TAPO_EMAIL, TAPO_PASSWORD)
        
        return {
            "ventilator": DeviceStatus(
                name="Ventilator",
                status=ventilator.get_status(),
                ip=VENTILATOR_IP
            ),
            "diffusor": DeviceStatus(
                name="Aroma Diffusor",
                status=diffusor.get_status(),
                ip=DIFFUSOR_IP
            )
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting device status: {str(e)}")

@app.put("/devices/ventilator/control")
async def control_ventilator(control: DeviceControl):
    global ventilator_auto, last_vent_state

    try:
        ventilator = TP100Controller(VENTILATOR_IP, TAPO_EMAIL, TAPO_PASSWORD)

        if control.action == "on":
            ventilator.turn_on()
            ventilator_auto = False
            last_vent_state = "on"

        elif control.action == "off":
            ventilator.turn_off()
            ventilator_auto = False
            last_vent_state = "off"

        elif control.action == "auto":
            ventilator_auto = True          

        else:
            raise HTTPException(status_code=400, detail="Invalid action")

        return {
            "message": f"Ventilator {control.action} executed",
            "status":  ventilator.get_status(),
            "auto":    ventilator_auto
        }

    except Exception as e:
        raise HTTPException(status_code=500,
                            detail=f"Error controlling ventilator: {e}")


@app.put("/devices/diffusor/control")
async def control_diffusor(control: DeviceControl):
    global diffusor_auto, last_diff_state         

    try:
        diffusor = TP100Controller(DIFFUSOR_IP, TAPO_EMAIL, TAPO_PASSWORD)

        if control.action == "on":
            diffusor.turn_on()
            diffusor_auto  = False                 
            last_diff_state = "on"

        elif control.action == "off":
            diffusor.turn_off()
            diffusor_auto  = False
            last_diff_state = "off"

        elif control.action == "auto":
            diffusor_auto = True                  

        else:
            raise HTTPException(status_code=400, detail="Invalid action")

        return {
            "message": f"Diffusor {control.action} executed",
            "status":  diffusor.get_status(),
            "auto":    diffusor_auto
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error controlling diffusor: {e}"
        )


@app.get("/air-quality/colors")
async def get_air_quality_color_scheme():
    return get_air_quality_colors()

@app.get("/current-session-info")
async def get_current_session_info():
    global current_session_id
    
    if not current_session_id:
        return {
            "session_id": None,
            "session_type": "indoor",
            "message": "No active session, defaulting to indoor"
        }
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, name, location, start_time, session_type
            FROM sessions
            WHERE id = ? AND end_time IS NULL
        """, (current_session_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                "session_id": result[0],
                "name": result[1],
                "location": result[2],
                "start_time": result[3],
                "session_type": result[4]
            }
        else:
            return {
                "session_id": None,
                "session_type": "indoor",
                "message": "Active session not found, defaulting to indoor"
            }
    except Exception as e:
        return {
            "session_id": None,
            "session_type": "indoor",
            "error": str(e),
            "message": "Error getting session info, defaulting to indoor"
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)