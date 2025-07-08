#pragma once

#include <Arduino.h>

// --- WLAN ---
static constexpr char WIFI_SSID[]     = "Christians iPhone";
static constexpr char WIFI_PASSWORD[] = "christian";

// --- MQTT ---
//static constexpr char MQTT_SERVER[]   = "172.20.10.3"; //ip lenovo
static constexpr char MQTT_SERVER[]   = "172.20.10.4"; //ip raspberry
static constexpr uint16_t MQTT_PORT   = 1883;
static constexpr char MQTT_TOPIC[]    = "airquality/command/led";

// --- NeoPixel ---
static constexpr uint8_t LED_PIN    = 5;
static constexpr uint16_t NUMPIXELS = 12;

// --- Fade-Parameter (Default) ---
static constexpr uint16_t FADE_STEPS_DEFAULT    = 50;
static constexpr uint16_t FADE_INTERVAL_DEFAULT = 20; // ms
