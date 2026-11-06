import math
from typing import Dict, Any, Tuple
from datetime import datetime

class ElectricalPhysics:
    """
    Standard Electrical Engineering calculations conforming to IEC / EVN grid codes
    for 110kV/22kV distribution substations.
    """
    
    @staticmethod
    def calculate_apparent_power(p_mw: float, cos_phi: float = 0.93) -> float:
        """
        Calculates apparent power S (MVA) from active power P (MW) and power factor cos(phi).
        S = P / cos_phi
        """
        if cos_phi <= 0:
            return 0.0
        return round(p_mw / cos_phi, 3)

    @staticmethod
    def calculate_reactive_power(p_mw: float, cos_phi: float = 0.93) -> float:
        """
        Calculates reactive power Q (MVAr) from active power P (MW).
        Q = P * tan(arccos(cos_phi))
        """
        if cos_phi <= 0 or cos_phi >= 1.0:
            return 0.0
        sin_phi = math.sqrt(1 - cos_phi ** 2)
        return round(p_mw * (sin_phi / cos_phi), 3)

    @staticmethod
    def calculate_line_current(p_mw: float, u_kv: float = 22.0, cos_phi: float = 0.93) -> float:
        """
        Calculates 3-phase line current I (Amperes).
        I = (P * 1000) / (sqrt(3) * U * cos_phi)
        """
        if u_kv <= 0 or cos_phi <= 0:
            return 0.0
        i_amps = (p_mw * 1000.0) / (math.sqrt(3) * u_kv * cos_phi)
        return round(i_amps, 1)

    @staticmethod
    def check_physical_conservation(p_total: float, p_feeders: list[float], tolerance: float = 1e-4) -> Tuple[bool, float]:
        """
        Verifies Kirchhoff's active power conservation at the 22kV busbar:
        P_224 == sum(P_feeders)
        """
        sum_feeders = sum(p_feeders)
        error = abs(p_total - sum_feeders)
        is_conserved = error <= tolerance
        return is_conserved, error

    @staticmethod
    def get_evn_tariff_zone(dt: datetime) -> Dict[str, Any]:
        """
        Identifies EVN 3-tier time-of-use tariff zone for Vietnam's power grid:
        - Giờ cao điểm (Peak)
        - Giờ bình thường (Normal)
        - Giờ thấp điểm (Off-peak)
        """
        weekday = dt.weekday()  # 0: Monday ... 6: Sunday
        hour = dt.hour + dt.minute / 60.0
        
        # Off-peak: 22:00 - 04:00 every day
        if hour >= 22.0 or hour < 4.0:
            return {
                "zone_code": "OFF_PEAK",
                "zone_name": "Giờ thấp điểm",
                "color": "#38bdf8",
                "tariff_multiplier": 0.65,
                "badge": "Off-Peak (22h - 04h)"
            }
        
        # Sundays have no peak hours, only Normal & Off-peak
        if weekday == 6:
            return {
                "zone_code": "NORMAL",
                "zone_name": "Giờ bình thường",
                "color": "#10b981",
                "tariff_multiplier": 1.0,
                "badge": "Normal (Chủ nhật)"
            }
        
        # Mon-Sat Peak hours: 09:30 - 11:30 and 17:00 - 20:00
        is_morning_peak = 9.5 <= hour < 11.5
        is_evening_peak = 17.0 <= hour < 20.0
        
        if is_morning_peak or is_evening_peak:
            return {
                "zone_code": "PEAK",
                "zone_name": "Giờ cao điểm",
                "color": "#ef4444",
                "tariff_multiplier": 1.78,
                "badge": "Cao điểm (09h30-11h30 / 17h-20h)"
            }
            
        return {
            "zone_code": "NORMAL",
            "zone_name": "Giờ bình thường",
            "color": "#10b981",
            "tariff_multiplier": 1.0,
            "badge": "Bình thường"
        }

