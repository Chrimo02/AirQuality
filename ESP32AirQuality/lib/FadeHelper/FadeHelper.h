#pragma once
#include <cstdint>

struct RGB { uint8_t r, g, b; };

RGB interpolate(const RGB& start, const RGB& target, uint16_t step, uint16_t maxSteps) {
  float frac = float(step) / maxSteps;
  return {
    uint8_t(start.r + (target.r - start.r) * frac),
    uint8_t(start.g + (target.g - start.g) * frac),
    uint8_t(start.b + (target.b - start.b) * frac)
  };
}
