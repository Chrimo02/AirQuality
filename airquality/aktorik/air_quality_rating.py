from enum import Enum

class AirQuality(Enum):
    SEHR_SCHLECHT = 1
    SCHLECHT = 2
    MÄSSIG = 3
    GUT = 4
    SEHR_GUT = 5

class SessionType(Enum):
    INDOOR = "indoor"
    OUTDOOR = "outdoor"

class AirQualityRules:
    def __init__(self, session_type: SessionType):
        self.session_type = session_type
        if session_type == SessionType.INDOOR:
            self.thresholds = {
                'PM2.5': [5, 10, 15, 25],
                'CO2eq': [600, 800, 1000, 1400],
                'VOCAQI': [25, 50, 100, 200],
                'TEMP': [18, 22, 26, 30],
                'HUMID': {
                    'SEHR_GUT': (40, 50),
                    'GUT': (30, 60),
                    'MÄSSIG': (20, 70),
                    'SCHLECHT': (10, 80)
                }
            }
        else:
            self.thresholds = {
                'PM2.5': [10, 15, 25, 35],
                'CO2eq': [450, 500, 600, 800],
                'VOCAQI': [15, 30, 60, 120],
                'TEMP': [10, 20, 30, 35],
                'HUMID': {
                    'SEHR_GUT': (40, 70),
                    'GUT': (30, 80),
                    'MÄSSIG': (20, 90),
                    'SCHLECHT': (10, 95)
                }
            }

    def rate_parameter(self, value: float, param: str) -> AirQuality:
        if param == 'HUMID':
            return self.rate_humidity(value)
        thresholds = self.thresholds[param]
        if value <= thresholds[0]:
            return AirQuality.SEHR_GUT
        elif value <= thresholds[1]:
            return AirQuality.GUT
        elif value <= thresholds[2]:
            return AirQuality.MÄSSIG
        elif value <= thresholds[3]:
            return AirQuality.SCHLECHT
        else:
            return AirQuality.SEHR_SCHLECHT

    def rate_humidity(self, humidity: float) -> AirQuality:
        t = self.thresholds['HUMID']
        if t['SEHR_GUT'][0] <= humidity <= t['SEHR_GUT'][1]:
            return AirQuality.SEHR_GUT
        elif t['GUT'][0] <= humidity <= t['GUT'][1]:
            return AirQuality.GUT
        elif t['MÄSSIG'][0] <= humidity <= t['MÄSSIG'][1]:
            return AirQuality.MÄSSIG
        elif t['SCHLECHT'][0] <= humidity <= t['SCHLECHT'][1]:
            return AirQuality.SCHLECHT
        else:
            return AirQuality.SEHR_SCHLECHT

    def get_overall_air_quality(self, measurements: dict[str, float]) -> AirQuality:
        overall = AirQuality.SEHR_GUT
        for param, value in measurements.items():
            rating = self.rate_parameter(value, param)
            if rating.value < overall.value:
                overall = rating
        return overall

def air_quality_to_string(quality: AirQuality) -> str:
    mapping = {
        AirQuality.SEHR_GUT: "Sehr gut",
        AirQuality.GUT: "Gut",
        AirQuality.MÄSSIG: "Mäßig",
        AirQuality.SCHLECHT: "Schlecht",
        AirQuality.SEHR_SCHLECHT: "Sehr schlecht"
    }
    return mapping.get(quality, "Unbekannt")