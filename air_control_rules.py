from air_quality_rating import AirQualityRules, SessionType, AirQuality

class AirControlRules:
    def __init__(self, session_type: SessionType):
        self.rules = AirQualityRules(session_type)
        self.session_type = session_type

    def needs_ventilation(self, measurements: dict[str, float]) -> bool:
        if self.session_type != SessionType.INDOOR:
            return False  # Nur Indoor-Lüftung relevant

        pm25 = self.rules.rate_parameter(measurements.get('PM2.5', 0), 'PM2.5')
        co2 = self.rules.rate_parameter(measurements.get('CO2eq', 0), 'CO2eq')
        voc = self.rules.rate_parameter(measurements.get('VOCAQI', 0), 'VOCAQI')
        humid = self.rules.rate_parameter(measurements.get('HUMID', 0), 'HUMID')

        return any(param in [AirQuality.SCHLECHT, AirQuality.SEHR_SCHLECHT]
                   for param in [pm25, co2, voc, humid])

    def ventilation_not_needed(self, measurements: dict[str, float]) -> bool:
        if self.session_type != SessionType.INDOOR:
            return True  # Outdoor keine Belüftung nötig

        pm25 = self.rules.rate_parameter(measurements.get('PM2.5', 0), 'PM2.5')
        co2 = self.rules.rate_parameter(measurements.get('CO2eq', 0), 'CO2eq')
        voc = self.rules.rate_parameter(measurements.get('VOCAQI', 0), 'VOCAQI')
        humid = self.rules.rate_parameter(measurements.get('HUMID', 0), 'HUMID')

        return all(param in [AirQuality.SEHR_GUT, AirQuality.GUT]
                   for param in [pm25, co2, voc, humid])

    def diffusor_should_be_on(self, measurements: dict[str, float]) -> bool:
        if self.session_type != SessionType.INDOOR:
            return False

        humid = self.rules.rate_parameter(measurements.get('HUMID', 0), 'HUMID')
        voc = self.rules.rate_parameter(measurements.get('VOCAQI', 0), 'VOCAQI')
        pm25 = self.rules.rate_parameter(measurements.get('PM2.5', 0), 'PM2.5')

        return humid in [AirQuality.SCHLECHT, AirQuality.MÄSSIG] and \
               voc in [AirQuality.SEHR_GUT, AirQuality.GUT] and \
               pm25 in [AirQuality.SEHR_GUT, AirQuality.GUT, AirQuality.MÄSSIG]

    def diffusor_should_be_off(self, measurements: dict[str, float]) -> bool:
        if self.session_type != SessionType.INDOOR:
            return True

        humid = self.rules.rate_parameter(measurements.get('HUMID', 0), 'HUMID')
        voc = self.rules.rate_parameter(measurements.get('VOCAQI', 0), 'VOCAQI')
        pm25 = self.rules.rate_parameter(measurements.get('PM2.5', 0), 'PM2.5')

        return humid in [AirQuality.GUT, AirQuality.SEHR_GUT] or \
               voc in [AirQuality.SCHLECHT, AirQuality.SEHR_SCHLECHT] or \
               pm25 in [AirQuality.SCHLECHT, AirQuality.SEHR_SCHLECHT]
