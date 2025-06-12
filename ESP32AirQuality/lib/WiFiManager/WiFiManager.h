// WiFiManager.h
#pragma once
#include <WiFi.h>

class WiFiManager {
public:
  static void begin(const char* ssid, const char* password);
  static void maintain();  // ggf. reconnect
};
