#pragma once

#include <Arduino.h>

// --- WLAN ---
static constexpr char WIFI_SSID[]     = "KabelBox-3510";
static constexpr char WIFI_PASSWORD[] = "22218125170237312940";

// --- MQTT ---
static constexpr char MQTT_SERVER[]   = "192.168.0.13";
static constexpr uint16_t MQTT_PORT   = 1883;
static constexpr char MQTT_TOPIC[]    = "airquality/command/led";

// --- NeoPixel ---
static constexpr uint8_t LED_PIN    = 5;
static constexpr uint16_t NUMPIXELS = 12;

// --- Fade-Parameter (Default) ---
static constexpr uint16_t FADE_STEPS_DEFAULT    = 50;
static constexpr uint16_t FADE_INTERVAL_DEFAULT = 20; // ms
