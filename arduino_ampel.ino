#include <WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_NeoPixel.h>

// Konfiguration Wlan und mqtt
const char* ssid       = "wifissid"; //TODO: Wie können wir das im THWS Wlan machen? (oder gibt es die Möglichkeit bei der Messe einen kleinen Router für das Projekt zu verwenden?)
const char* password   = "pw";
const char* mqttServer = "raspi_ip";
const uint16_t mqttPort = 1883;
const char* mqttTopic  = "airquality/command/led";

// NeoPixel Konfiguration
#define LED_PIN    5         
#define NUMPIXELS 12        
Adafruit_NeoPixel strip(NUMPIXELS, LED_PIN, NEO_GRB + NEO_KHZ800);

// wifi un mqtt Clients
WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

// Funktion zum setzen der Farben an den Leds
void setColor(uint8_t r, uint8_t g, uint8_t b) {
  for (uint16_t i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, strip.Color(r, g, b));
  }
  strip.show();
}

// dummy Variablen um die aktuelle Farbe zwischenspeichern zu können
uint8_t currentR = 0, currentG = 0, currentB = 0;

// die Funktion sorgt dafür, dass der übergang zwischen den Farbstufen smooth erfolgt und die dummyvariablen aktualisiert werden
void setColorSmooth(uint8_t targetR, uint8_t targetG, uint8_t targetB, uint16_t steps = 50, uint16_t delayMs = 20) {
  float stepR = (targetR - currentR) / (float)steps;
  float stepG = (targetG - currentG) / (float)steps;
  float stepB = (targetB - currentB) / (float)steps;

  for (uint16_t i = 0; i <= steps; i++) {
    uint8_t r = currentR + stepR * i;
    uint8_t g = currentG + stepG * i;
    uint8_t b = currentB + stepB * i;

    for (uint16_t j = 0; j < strip.numPixels(); j++) {
      strip.setPixelColor(j, strip.Color(r, g, b));
    }
    strip.show();
    delay(delayMs);
  }

  currentR = targetR;
  currentG = targetG;
  currentB = targetB;
}

//TODO: Anzahl der Abstufungen ggf erweitern und farben anpassen
// MQTT-Nachrichten-Callback
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  msg.trim();

  if (msg == "gut") {
    setColorSmooth(0, 255, 0);   // Grün
  }
  else if (msg == "mittel") {
    setColorSmooth(255, 255, 0); // Gelb
  }
  else if (msg == "schlecht") {
    setColorSmooth(255, 0, 0);   // Rot
  }
  else {
    setColorSmooth(0, 0, 0);     // Aus
  }
}


// Verbindung zum MQTT-Broker herstellen
void connectMqtt() {
  while (!mqttClient.connected()) {
    if (mqttClient.connect("ESP32_NeoPixel_Client")) {
      mqttClient.subscribe(mqttTopic);
      Serial.println("MQTT verbunden & Topic abonniert");
    } else {
      Serial.print("MQTT: Verbindungsversuch fehlgeschlagen, warte 2 s...");
      delay(2000);
    }
  }
}

void setup() {
  // Serielle Debug
  Serial.begin(115200);

  // NeoPixel initialisieren
  strip.begin();
  strip.show(); // alle LEDs aus

  // WLAN verbinden
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWLAN verbunden!");

  // mqtt-Setup
  mqttClient.setServer(mqttServer, mqttPort);
  mqttClient.setCallback(mqttCallback);
  connectMqtt();
}

void loop() {
  // mqtt-Verbindung aufrechterhalten
  if (!mqttClient.connected()) {
    connectMqtt();
  }
  mqttClient.loop();
}