#pragma once
#include <WiFi.h>

class WiFiManager {
public:
  static void begin(const char* ssid, const char* password);
  static void maintain();  // ggf. reconnect
private:
  static unsigned long _lastAttempt;
};