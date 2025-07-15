#include "WiFiManager.h"
#include "Config.h"
#include <Arduino.h>

unsigned long WiFiManager::_lastAttempt = 0;

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
    unsigned long now = millis();
    if (now - _lastAttempt > 5000) { // Alle 5s versuchen
      Serial.println("WLAN getrennt, reconnect...");
      WiFi.reconnect();
      _lastAttempt = now;
    }
  }
}