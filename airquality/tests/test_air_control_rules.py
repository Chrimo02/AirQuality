import pytest
from aktorik.air_control_rules import AirControlRules
from aktorik.air_quality_rating import SessionType, AirQuality


def test_needs_ventilation_outdoor_returns_false():
    acr = AirControlRules(SessionType.OUTDOOR)
    assert not acr.needs_ventilation({'PM2.5': 1000, 'CO2eq': 2000, 'VOCAQI': 500, 'HUMID': 10})


def test_needs_ventilation_indoor_all_good_returns_false():
    measurements = {'PM2.5': 1, 'CO2eq': 500, 'VOCAQI': 20, 'HUMID': 50}
    acr = AirControlRules(SessionType.INDOOR)
    assert not acr.needs_ventilation(measurements)


def test_needs_ventilation_indoor_bad_quality_returns_true():
    measurements = {'PM2.5': 30, 'CO2eq': 500, 'VOCAQI': 20, 'HUMID': 50}
    acr = AirControlRules(SessionType.INDOOR)
    assert acr.needs_ventilation(measurements)


def test_needs_ventilation_boundary_pm25():
    acr = AirControlRules(SessionType.INDOOR)
    base = {'CO2eq': 500, 'VOCAQI': 20, 'HUMID': 50}
    assert not acr.needs_ventilation({**base, 'PM2.5': 15})
    assert acr.needs_ventilation({**base, 'PM2.5': 16})


def test_needs_ventilation_boundary_co2eq():
    acr = AirControlRules(SessionType.INDOOR)
    base = {'PM2.5': 1, 'VOCAQI': 20, 'HUMID': 50}
    assert not acr.needs_ventilation({**base, 'CO2eq': 1000})
    assert acr.needs_ventilation({**base, 'CO2eq': 1001})


def test_needs_ventilation_boundary_vocaqi():
    acr = AirControlRules(SessionType.INDOOR)
    base = {'PM2.5': 1, 'CO2eq': 500, 'HUMID': 50}
    assert not acr.needs_ventilation({**base, 'VOCAQI': 150})
    assert acr.needs_ventilation({**base, 'VOCAQI': 151})


def test_needs_ventilation_combination_scenario():
    measurements = {'PM2.5': 5, 'CO2eq': 900, 'VOCAQI': 160, 'HUMID': 50}
    acr = AirControlRules(SessionType.INDOOR)
    assert acr.needs_ventilation(measurements)


def test_ventilation_not_needed_outdoor_returns_true():
    acr = AirControlRules(SessionType.OUTDOOR)
    assert acr.ventilation_not_needed({'PM2.5': 1000, 'CO2eq': 2000, 'VOCAQI': 500, 'HUMID': 10})


def test_ventilation_not_needed_indoor_all_good_returns_true():
    measurements = {'PM2.5': 1, 'CO2eq': 500, 'VOCAQI': 20, 'HUMID': 50}
    acr = AirControlRules(SessionType.INDOOR)
    assert acr.ventilation_not_needed(measurements)


def test_ventilation_not_needed_indoor_not_all_good_returns_false():
    measurements = {'PM2.5': 1, 'CO2eq': 1500, 'VOCAQI': 20, 'HUMID': 50}
    acr = AirControlRules(SessionType.INDOOR)
    assert not acr.ventilation_not_needed(measurements)


def test_diffusor_should_be_on_conditions_met_returns_true():
    measurements = {'PM2.5': 8, 'VOCAQI': 40, 'HUMID': 25}
    acr = AirControlRules(SessionType.INDOOR)
    assert acr.diffusor_should_be_on(measurements)


def test_diffusor_should_be_on_humidity_exact_30_returns_false():
    measurements = {'PM2.5': 8, 'VOCAQI': 40, 'HUMID': 30}
    acr = AirControlRules(SessionType.INDOOR)
    assert not acr.diffusor_should_be_on(measurements)


def test_diffusor_should_be_off_outdoor_returns_true():
    acr = AirControlRules(SessionType.OUTDOOR)
    assert acr.diffusor_should_be_off({'PM2.5': 100, 'CO2eq': 500, 'VOCAQI': 200, 'HUMID': 50})


def test_diffusor_should_be_off_indoor_humid_sehr_gut_boundary_returns_true():
    acr = AirControlRules(SessionType.INDOOR)
    for h in (40, 60):
        measurements = {'PM2.5': 8, 'VOCAQI': 40, 'HUMID': h}
        assert acr.diffusor_should_be_off(measurements)


def test_diffusor_should_be_off_indoor_bad_voc_returns_true():
    measurements = {'PM2.5': 8, 'VOCAQI': 250, 'HUMID': 25}
    acr = AirControlRules(SessionType.INDOOR)
    assert acr.diffusor_should_be_off(measurements)


def test_diffusor_should_be_off_indoor_bad_pm25_returns_true():
    measurements = {'PM2.5': 30, 'VOCAQI': 40, 'HUMID': 25}
    acr = AirControlRules(SessionType.INDOOR)
    assert acr.diffusor_should_be_off(measurements)


def test_diffusor_should_be_off_indoor_conditions_not_met_returns_false():
    measurements = {'PM2.5': 8, 'VOCAQI': 40, 'HUMID': 25}
    acr = AirControlRules(SessionType.INDOOR)
    assert not acr.diffusor_should_be_off(measurements)
