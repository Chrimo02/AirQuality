// LedController.h
#pragma once
#include "Config.h"
#include "FadeHelper.h"
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
    void blink(uint8_t r, uint8_t g, uint8_t b, uint32_t intervalMs);
    void stopBlinking();
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

    // Blink-Modus
    bool     _blinking;
    uint32_t _blinkInterval;
    uint32_t _lastBlinkTime;
    bool     _blinkState;
    RGB      _blinkColor;
};