#pragma once
#include <PubSubClient.h>
#include <functional>
#include <Arduino.h>

class MqttManager {
public:
  MqttManager(PubSubClient& client);
  void begin(const char* server, uint16_t port);
  void setCommandCallback(std::function<void(const char*, const uint8_t*, unsigned int)> cb);
  void loop();
private:
  PubSubClient& _client;
  unsigned long _reconnectDelay = 2000;
  unsigned long _lastReconnectAttempt = 0;
  String _clientId = "";
  void reconnect();
  void generateClientId();
};