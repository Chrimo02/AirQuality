// LedController.h
#pragma once
#include "Config.h" 
#include <Adafruit_NeoPixel.h>
#include <cstdint>

class LedController {
public:
  LedController(uint8_t pin, uint16_t numPixels);

  void begin();
  void setColor(uint8_t r, uint8_t g, uint8_t b);
  void setColorSmooth(uint8_t r, uint8_t g, uint8_t b,
                      uint16_t steps = FADE_STEPS_DEFAULT,
                      uint16_t interval = FADE_INTERVAL_DEFAULT);
  void handleFade();

private:
  Adafruit_NeoPixel strip;
  // interne State-Variablen…
  uint8_t  _curR, _curG, _curB;
  uint8_t  _startR, _startG, _startB;
  uint8_t  _targetR, _targetG, _targetB;
  uint16_t _fadeSteps;
  uint16_t _currentStep;
  uint32_t _fadeInterval;
  uint32_t _lastFadeTime;
  bool     _fading;
};
