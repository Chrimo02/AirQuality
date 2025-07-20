import pytest
from aktorik.air_quality_rating import AirQualityRules, AirQuality, SessionType 

def test_indoor_very_good():
    rules = AirQualityRules(SessionType.INDOOR)
    measurements = {
        'PM2.5': 4.0,
        'CO2eq': 550.0,
        'VOCAQI': 40.0,
        'TEMP': 22.0,
        'HUMID': 50.0
    }
    assert rules.get_overall_air_quality(measurements) == AirQuality.SEHR_GUT

def test_indoor_mixed_quality():
    rules = AirQualityRules(SessionType.INDOOR)
    measurements = {
        'PM2.5': 12.0,
        'CO2eq': 700.0,
        'VOCAQI': 120.0,
        'TEMP': 30.0,
        'HUMID': 45.0
    }
    assert rules.get_overall_air_quality(measurements) == AirQuality.MÄSSIG

def test_indoor_missing_values():
    rules = AirQualityRules(SessionType.INDOOR)
    measurements = {
        'PM2.5': 30.0,
        'TEMP': 50.0
    }
    assert rules.get_overall_air_quality(measurements) == AirQuality.SEHR_SCHLECHT

def test_outdoor_good_quality():
    rules = AirQualityRules(SessionType.OUTDOOR)
    measurements = {
        'PM2.5': 12.0,
        'CO2eq': 700.0,
        'VOCAQI': 150.0,
        'TEMP': 22.0,
        'HUMID': 55.0
    }
    assert rules.get_overall_air_quality(measurements) == AirQuality.GUT
