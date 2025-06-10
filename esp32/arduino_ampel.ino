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


// Aktuelle und Ziel-Farben für non-blocking Fade
uint8_t currentR = 0, currentG = 0, currentB = 0;
uint8_t startR, startG, startB;
uint8_t targetR, targetG, targetB;
uint16_t fadeSteps = 50;
uint16_t currentStep = 0;
unsigned long fadeInterval = 20;  // ms pro Schritt
unsigned long lastFadeTime = 0;
bool fading = false;

// Setup non-blocking Fade
void setColorSmooth(uint8_t r, uint8_t g, uint8_t b, uint16_t steps = 50, uint16_t interval = 20) {
  startR = currentR;
  startG = currentG;
  startB = currentB;
  targetR = r;
  targetG = g;
  targetB = b;
  fadeSteps = steps;
  fadeInterval = interval;
  currentStep = 0;
  lastFadeTime = millis();
  fading = true;
}

// Verarbeitet Fade-Schritte ohne delay()
void handleFade() {
  if (!fading) return;
  unsigned long now = millis();
  if (now - lastFadeTime < fadeInterval) return;
  lastFadeTime = now;
  currentStep++;
  if (currentStep > fadeSteps) {
    // Fade beendet
    currentR = targetR;
    currentG = targetG;
    currentB = targetB;
    fading = false;
    return;
  }
  // Interpolation
  float fraction = (float)currentStep / fadeSteps;
  uint8_t r = startR + (targetR - startR) * fraction;
  uint8_t g = startG + (targetG - startG) * fraction;
  uint8_t b = startB + (targetB - startB) * fraction;
  // LEDs aktualisieren
  for (uint16_t i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, strip.Color(r, g, b));
  }
  strip.show();
}

// Direkter Farbsatz (sofort)
void setColor(uint8_t r, uint8_t g, uint8_t b) {
  currentR = r;
  currentG = g;
  currentB = b;
  for (uint16_t i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, strip.Color(r, g, b));
  }
  strip.show();
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
  // Fade-Schritte verarbeiten
  handleFade();
  // mqtt-Verbindung aufrechterhalten
  if (!mqttClient.connected()) {
    connectMqtt();
  }
  mqttClient.loop();
}