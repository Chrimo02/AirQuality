#include "Config.h"
#include "WiFiManager.h"
#include "MqttManager.h"
#include "LedController.h"
#include <Arduino.h>
#include <ArduinoJson.h>


WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);
MqttManager  mqttMgr(mqttClient);
LedController leds(LED_PIN, NUMPIXELS);

enum AirQualityLevel {

  AQ_SEHR_GUT,
  AQ_GUT,
  AQ_MAESSIG,
  AQ_SCHLECHT,
  AQ_SEHR_SCHLECHT,
  AQ_UNBEKANNT
};

AirQualityLevel parseAirQuality(const String& msg) {
  String m = msg;
  m.toUpperCase();
  m.trim();
  if (m == "SEHR GUT") {
    return AQ_SEHR_GUT;
  } else if (m == "GUT") {
    return AQ_GUT;
  } else if (m == "MÄSSIG" || m == "MAESSIG") {
    return AQ_MAESSIG;
  } else if (m == "SCHLECHT") {
    return AQ_SCHLECHT;
  } else if (m == "SEHR SCHLECHT") {
    return AQ_SEHR_SCHLECHT;
  }
  return AQ_UNBEKANNT;
}

void onMqttMessage(const char* topic, const uint8_t* payload, unsigned int length) {
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (!err && doc.containsKey("r") && doc.containsKey("g") && doc.containsKey("b")) {
    uint8_t r = doc["r"];
    uint8_t g = doc["g"];
    uint8_t b = doc["b"];
    uint16_t steps   = doc["steps"]   | FADE_STEPS_DEFAULT;
    uint16_t delayMs = doc["delayMs"] | FADE_INTERVAL_DEFAULT;
    leds.setColorSmooth(r, g, b, steps, delayMs);
    return;
  }
  // Fallback auf einfache String-Befehle
  String msg;
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  msg.trim();

  AirQualityLevel level = parseAirQuality(msg);
  switch (level) {
    case AQ_SEHR_GUT:
      leds.setColorSmooth(0, 255, 64); // türkis-grün
      break;
    case AQ_GUT:
      leds.setColorSmooth(0, 255, 0); // grün
      break;
    case AQ_MAESSIG:
      leds.setColorSmooth(255, 255, 0); // gelb
      break;
    case AQ_SCHLECHT:
      leds.setColorSmooth(255, 128, 0); // orange
      break;
    case AQ_SEHR_SCHLECHT:
      leds.setColorSmooth(255, 0, 0); // rot
      break;
    default:
      leds.setColorSmooth(128, 128, 128); // grau für unbekannt
      break;
  }
}

void setup(){
  Serial.begin(115200);

  leds.begin();
  WiFiManager::begin(WIFI_SSID, WIFI_PASSWORD);

  mqttMgr.begin(MQTT_SERVER, MQTT_PORT);
  mqttMgr.setCommandCallback(onMqttMessage);
}

void loop(){
  leds.handleFade();
  WiFiManager::maintain();
  mqttMgr.loop();
}
