// WiFiManager.cpp
#include "WiFiManager.h"
#include "Config.h"
#include <Arduino.h>

void WiFiManager::begin(const char* ssid, const char* password) {
  WiFi.begin(ssid, password);
  Serial.print("WLAN verbindet");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
  }
  Serial.println("\nWLAN verbunden!");
}

void WiFiManager::maintain() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WLAN getrennt, reconnect...");
    WiFi.reconnect();
  }
}
