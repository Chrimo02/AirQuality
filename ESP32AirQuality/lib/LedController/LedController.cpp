// LedController.cpp
#include "LedController.h"
#include "Config.h"
#include "FadeHelper.h"
#include <Arduino.h>

LedController::LedController(uint8_t pin, uint16_t numPixels)
 : strip(numPixels, pin, NEO_GRB + NEO_KHZ800),
   _curR(0), _curG(0), _curB(0),
   _fadeSteps(FADE_STEPS_DEFAULT),
   _fadeInterval(FADE_INTERVAL_DEFAULT),
   _currentStep(0), _fading(false),
   _blinking(false), _blinkInterval(0), _lastBlinkTime(0), _blinkState(false)
{}

void LedController::begin() {
  strip.begin();
  strip.show();
}

void LedController::setColor(uint8_t r, uint8_t g, uint8_t b) {
  _curR = r; _curG = g; _curB = b;
  for (uint16_t i = 0; i < strip.numPixels(); i++)
    strip.setPixelColor(i, strip.Color(r, g, b));
  strip.show();
}

void LedController::setColorSmooth(uint8_t r, uint8_t g, uint8_t b, uint16_t steps, uint16_t interval) {
  stopBlinking();
  _startR = _curR; _startG = _curG; _startB = _curB;
  _targetR = r;    _targetG = g;    _targetB = b;
  _fadeSteps = steps;
  _fadeInterval = interval;
  _currentStep = 0;
  _lastFadeTime = millis();
  _fading = true;
}

void LedController::blink(uint8_t r, uint8_t g, uint8_t b, uint32_t intervalMs) {
  stopBlinking();
  _blinkColor = { r, g, b };
  _blinkInterval = intervalMs;
  _lastBlinkTime = millis();
  _blinkState = false;
  _blinking = true;
}

void LedController::stopBlinking() {
  if (!_blinking) return;
  _blinking = false;
  setColor(_curR, _curG, _curB);
}

void LedController::handleFade() {
  uint32_t now = millis();

  // Blinken hat Vorrang
  if (_blinking) {
    if (now - _lastBlinkTime >= _blinkInterval) {
      _lastBlinkTime = now;
      _blinkState = !_blinkState;
      for (uint16_t i = 0; i < strip.numPixels(); i++) {
        if (_blinkState)
          strip.setPixelColor(i, strip.Color(_blinkColor.r, _blinkColor.g, _blinkColor.b));
        else
          strip.setPixelColor(i, strip.Color(0, 0, 0));
      }
      strip.show();
    }
    return;
  }

  // Normales Fade-Verhalten
  if (!_fading) return;
  if (now - _lastFadeTime < _fadeInterval) return;
  _lastFadeTime = now;
  if (++_currentStep > _fadeSteps) {
    setColor(_targetR, _targetG, _targetB);
    _fading = false;
    return;
  }

  RGB start  = { _startR, _startG, _startB };
  RGB target = { _targetR, _targetG, _targetB };
  RGB cur    = interpolate(start, target, _currentStep, _fadeSteps);

  setColor(cur.r, cur.g, cur.b);
}
