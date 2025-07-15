#define CATCH_CONFIG_MAIN
#include "catch.hpp"
#include <string>
#include <algorithm>
#include <cstdint>


enum class AirQualityLevel {
  SehrGut,
  Gut,
  Maessig,
  Schlecht,
  SehrSchlecht,
  Unbekannt
};

AirQualityLevel parseAirQuality(const std::string& msg_in) {
  std::string m = msg_in;
  // alles lowercase
  std::transform(m.begin(), m.end(), m.begin(), [](unsigned char c){ return std::tolower(c); });
  // trim
  m.erase(0, m.find_first_not_of(" \t\n\r"));
  m.erase(m.find_last_not_of(" \t\n\r") + 1);

  if (m == "sehr gut") return AirQualityLevel::SehrGut;
  if (m == "gut")      return AirQualityLevel::Gut;
  if (m == "maessig")  return AirQualityLevel::Maessig;
  if (m == "schlecht") return AirQualityLevel::Schlecht;
  if (m == "sehr schlecht") return AirQualityLevel::SehrSchlecht;
  return AirQualityLevel::Unbekannt;
}

uint8_t safeColor(int val) {
  if (val < 0) return 0;
  if (val > 255) return 255;
  return (uint8_t)val;
}

struct RGB { uint8_t r, g, b; };

inline RGB interpolate(const RGB& start, const RGB& target, uint16_t step, uint16_t maxSteps) {
  if (maxSteps == 0) return start;
  float frac = float(step) / maxSteps;
  return {
    uint8_t(start.r + (target.r - start.r) * frac),
    uint8_t(start.g + (target.g - start.g) * frac),
    uint8_t(start.b + (target.b - start.b) * frac)
  };
}

// ------------------ TESTS -----------------------

TEST_CASE("parseAirQuality interpretiert Strings korrekt", "[parseAirQuality]") {
  REQUIRE(parseAirQuality("GUT") == AirQualityLevel::Gut);
  REQUIRE(parseAirQuality("gut") == AirQualityLevel::Gut);
  REQUIRE(parseAirQuality("  sehr gut  ") == AirQualityLevel::SehrGut);
  REQUIRE(parseAirQuality("maessig") == AirQualityLevel::Maessig);
  REQUIRE(parseAirQuality("MAESSIG") == AirQualityLevel::Maessig);
  REQUIRE(parseAirQuality("mässig") == AirQualityLevel::Unbekannt); // eingaben mit "ä" sollen nicht durchgehen
  REQUIRE(parseAirQuality("SCHLECHT") == AirQualityLevel::Schlecht);
  REQUIRE(parseAirQuality("SEHR SCHLECHT") == AirQualityLevel::SehrSchlecht);
  REQUIRE(parseAirQuality("random") == AirQualityLevel::Unbekannt);
  REQUIRE(parseAirQuality("") == AirQualityLevel::Unbekannt);
  REQUIRE(parseAirQuality("    ") == AirQualityLevel::Unbekannt);
}

TEST_CASE("safeColor begrenzt korrekt", "[safeColor]") {
  REQUIRE(safeColor(-1) == 0);
  REQUIRE(safeColor(0) == 0);
  REQUIRE(safeColor(255) == 255);
  REQUIRE(safeColor(256) == 255);
  REQUIRE(safeColor(500) == 255);
  REQUIRE(safeColor(123) == 123);
}

TEST_CASE("interpolate linearisiert RGB korrekt", "[interpolate]") {
  RGB start = {0, 0, 0};
  RGB end   = {255, 255, 255};
  SECTION("Step 0 = Start") {
    RGB res = interpolate(start, end, 0, 10);
    REQUIRE(res.r == 0);
    REQUIRE(res.g == 0);
    REQUIRE(res.b == 0);
  }
  SECTION("Step maxSteps = Target") {
    RGB res = interpolate(start, end, 10, 10);
    REQUIRE(res.r == 255);
    REQUIRE(res.g == 255);
    REQUIRE(res.b == 255);
  }
  SECTION("Halbwegs") {
    RGB res = interpolate(start, end, 5, 10);
    REQUIRE(res.r == Approx(127).margin(1)); // Rundungsungenauigkeit 127/128
    REQUIRE(res.g == Approx(127).margin(1));
    REQUIRE(res.b == Approx(127).margin(1));
  }
  SECTION("Zwischen zwei Farben") {
    start = {100, 50, 200};
    end = {200, 150, 100};
    RGB res = interpolate(start, end, 5, 10);
    REQUIRE(res.r == Approx(150).margin(1));
    REQUIRE(res.g == Approx(100).margin(1));
    REQUIRE(res.b == Approx(150).margin(1));
  }
  SECTION("maxSteps==0 gibt start zurück") {
    RGB res = interpolate(start, end, 5, 0);
    REQUIRE(res.r == start.r);
    REQUIRE(res.g == start.g);
    REQUIRE(res.b == start.b);
  }
}