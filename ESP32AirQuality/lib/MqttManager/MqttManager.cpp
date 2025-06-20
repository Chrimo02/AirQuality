// MqttManager.cpp
#include "MqttManager.h"
#include "Config.h"
#include <Arduino.h>

MqttManager::MqttManager(PubSubClient& client) : _client(client) {}

void MqttManager::begin(const char* server, uint16_t port) {
  _client.setServer(server, port);
}

void MqttManager::setCommandCallback(std::function<void(const char*, const uint8_t*, unsigned int)> cb) {
  _client.setCallback([cb](char* topic, byte* payload, unsigned int length){
    cb(topic, payload, length);
  });
}

void MqttManager::reconnect() {
  while (!_client.connected()) {
    Serial.printf("MQTT connect, delay %lums\n", _reconnectDelay);
    if (_client.connect("ESP32_Client")) {
      _client.subscribe(MQTT_TOPIC);
      Serial.println("MQTT verbunden");
      _reconnectDelay = 2000;
    } else {
      delay(_reconnectDelay);
      _reconnectDelay = min(_reconnectDelay * 2, (unsigned long)60000);
    }
  }
}

void MqttManager::loop() {
  if (!_client.connected()) reconnect();
  _client.loop();
}
