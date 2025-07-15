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

enum class AirQualityLevel {
  SehrGut,
  Gut,
  Maessig,
  Schlecht,
  SehrSchlecht,
  Unbekannt
};

// Nur "maessig" mit "ae" akzeptieren!
AirQualityLevel parseAirQuality(const String& msg) {
  String m = msg;
  m.toLowerCase();
  m.trim();
  if (m == "sehr gut") return AirQualityLevel::SehrGut;
  if (m == "gut")      return AirQualityLevel::Gut;
  if (m == "maessig")  return AirQualityLevel::Maessig;
  if (m == "schlecht") return AirQualityLevel::Schlecht;
  if (m == "sehr schlecht") return AirQualityLevel::SehrSchlecht;
  return AirQualityLevel::Unbekannt;
}

// Hilfsfunktion für sichere Farben (0..255)
uint8_t safeColor(int val) {
  if (val < 0) return 0;
  if (val > 255) return 255;
  return (uint8_t)val;
}

void onMqttMessage(const char* topic, const uint8_t* payload, unsigned int length) {
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (!err && doc.containsKey("r") && doc.containsKey("g") && doc.containsKey("b")) {
    int r = doc["r"];
    int g = doc["g"];
    int b = doc["b"];
    uint16_t steps   = doc["steps"]   | FADE_STEPS_DEFAULT;
    uint16_t delayMs = doc["delayMs"] | FADE_INTERVAL_DEFAULT;
    leds.setColorSmooth(safeColor(r), safeColor(g), safeColor(b), steps, delayMs);
    return;
  }

  String msg;
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
  msg.trim();

  AirQualityLevel level = parseAirQuality(msg);
  switch (level) {
    case AirQualityLevel::SehrGut:
      leds.stopBlinking();
      leds.setColorSmooth(0, 255, 0);
      break;
    case AirQualityLevel::Gut:
      leds.stopBlinking();
      leds.setColorSmooth(127, 255, 0);
      break;
    case AirQualityLevel::Maessig:
      leds.stopBlinking();
      leds.setColorSmooth(255, 165, 0);
      break;
    case AirQualityLevel::Schlecht:
      leds.stopBlinking();
      leds.setColorSmooth(200, 0, 0);
      break;
    case AirQualityLevel::SehrSchlecht:
      leds.blink(255, 0, 0, 250);
      break;
    default:
      leds.stopBlinking();
      leds.setColorSmooth(128, 128, 128);
      break;
  }
}

void setup() {
  Serial.begin(115200);
  leds.begin();
  WiFiManager::begin(WIFI_SSID, WIFI_PASSWORD);
  mqttMgr.begin(MQTT_SERVER, MQTT_PORT);
  mqttMgr.setCommandCallback(onMqttMessage);
}

void loop() {
  leds.handleFade();
  WiFiManager::maintain();
  mqttMgr.loop();
}