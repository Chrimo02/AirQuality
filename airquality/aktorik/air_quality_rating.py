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
                'VOCAQI': [50, 100, 150, 200],
                'TEMP': {
                    'SEHR_GUT': (20, 26),
                    'GUT':  (17, 29),
                    'MÄSSIG': (14, 32),
                    'SCHLECHT': (11, 35)
                },
                'HUMID': {
                    'SEHR_GUT': (40, 60),
                    'GUT': (30, 65),
                    'MÄSSIG': (20, 75),
                    'SCHLECHT': (10, 85)
                }
            }
        else:
            self.thresholds = {
                'PM2.5': [10, 15, 25, 35],
                'CO2eq': [450, 800, 1200, 2000],
                'VOCAQI': [100, 200, 300, 400],
                'TEMP': {
                    'SEHR_GUT': (18, 26),    
                    'GUT':      (12, 30),     
                    'MÄSSIG':   (5, 33),      
                    'SCHLECHT': (0, 36)      
                }, 
                'HUMID': {
                    'SEHR_GUT': (40, 70),
                    'GUT': (30, 80),
                    'MÄSSIG': (20, 90),
                    'SCHLECHT': (10, 95)
                }
            }
        # Gewichtungen der Parameter nach Wichtigkeit für Luftqualität und Gesundheit
        self.weights = {
            'PM2.5': 0.4,      
            'VOCAQI': 0.25,      
            'CO2eq': 0.2,      
            'HUMID': 0.1,       
            'TEMP': 0.05       
        }


    def rate_parameter(self, value: float, param: str) -> AirQuality:
        if param in ['TEMP', 'HUMID']:
            return self.rate_range_parameter(value, param)
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

    def rate_range_parameter(self, value: float, param: str) -> AirQuality:
        param_thresholds = self.thresholds[param]
        for category in ['SEHR_GUT', 'GUT', 'MÄSSIG', 'SCHLECHT']:
            min_val, max_val = param_thresholds[category]
            if min_val <= value <= max_val:
                return AirQuality[category]
        return AirQuality.SEHR_SCHLECHT

    def get_overall_air_quality(self, measurements: dict[str, float]) -> AirQuality:
        total_weight = 0.0
        weighted_sum = 0.0
        for param, weight in self.weights.items():
            if param not in measurements:
                continue
            value = measurements[param]
            rating = self.rate_parameter(value, param)
            weighted_sum += rating.value * weight
            total_weight += weight
        if total_weight == 0:
            return AirQuality.SEHR_SCHLECHT
        avg_score = weighted_sum / total_weight
        rating_value = round(avg_score)
        score = max(1, min(5, rating_value))
        return AirQuality(score)


def air_quality_to_string(quality: AirQuality) -> str:
    mapping = {
        AirQuality.SEHR_GUT: "SEHR GUT",
        AirQuality.GUT: "GUT",
        AirQuality.MÄSSIG: "MAESSIG",
        AirQuality.SCHLECHT: "SCHLECHT",
        AirQuality.SEHR_SCHLECHT: "SEHR SCHLECHT"
    }
    return mapping.get(quality, "UNBEKANNT")