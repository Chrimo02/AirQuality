#include "MqttManager.h"
#include "Config.h"
#include <Arduino.h>
#include <WiFi.h>  // Für MAC-Adresse

MqttManager::MqttManager(PubSubClient& client) : _client(client) {}

void MqttManager::generateClientId() {
  uint64_t chipid = ESP.getEfuseMac();
  char buf[32];
  snprintf(buf, sizeof(buf), "ESP32_%04X%08X", (uint16_t)(chipid>>32), (uint32_t)chipid);
  _clientId = String(buf);
}

void MqttManager::begin(const char* server, uint16_t port) {
  generateClientId();
  _client.setServer(server, port);
}

void MqttManager::setCommandCallback(std::function<void(const char*, const uint8_t*, unsigned int)> cb) {
  _client.setCallback([cb](char* topic, byte* payload, unsigned int length){
    cb(topic, payload, length);
  });
}

// Non-blocking reconnect!
void MqttManager::reconnect() {
  if (_client.connected()) return;
  unsigned long now = millis();
  if (now - _lastReconnectAttempt < _reconnectDelay) return;
  _lastReconnectAttempt = now;
  Serial.printf("MQTT connect (%s), delay %lums\n", _clientId.c_str(), _reconnectDelay);
  if (_client.connect(_clientId.c_str())) {
    _client.subscribe(MQTT_TOPIC);
    Serial.println("MQTT verbunden");
    _reconnectDelay = 2000;
  } else {
    Serial.println("MQTT Verbindungsfehler.");
    _reconnectDelay = min(_reconnectDelay * 2, (unsigned long)60000);
  }
}

void MqttManager::loop() {
  if (!_client.connected()) reconnect();
  _client.loop();
}