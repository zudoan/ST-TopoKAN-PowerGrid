import json
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.core.physics import ElectricalPhysics

class DataService:
    def __init__(self):
        self._df_test: Optional[pd.DataFrame] = None
        self._split_metadata: Optional[Dict[str, Any]] = None
        self._load_data()

    def _load_data(self):
        if settings.TEST_FILE.exists():
            self._df_test = pd.read_csv(settings.TEST_FILE)
            self._df_test['TIME'] = pd.to_datetime(self._df_test['TIME'])
        else:
            raise FileNotFoundError(f"Test dataset not found at {settings.TEST_FILE}")

        if settings.SPLIT_META_FILE.exists():
            with open(settings.SPLIT_META_FILE, 'r', encoding='utf-8') as f:
                self._split_metadata = json.load(f)

    @property
    def total_test_records(self) -> int:
        return len(self._df_test) if self._df_test is not None else 0

    def get_metadata(self) -> Dict[str, Any]:
        p224_min = float(self._df_test['P_224'].min())
        p224_max = float(self._df_test['P_224'].max())
        p224_mean = float(self._df_test['P_224'].mean())
        
        return {
            "project_name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "substation_name": settings.SUBSTATION_NAME,
            "substation_capacity_mva": settings.SUBSTATION_CAPACITY_MVA,
            "nominal_voltage_kv": settings.NOMINAL_VOLTAGE_KV,
            "frequency_hz": settings.GRID_FREQUENCY_HZ,
            "test_total_records": self.total_test_records,
            "test_start_time": self._df_test['TIME'].iloc[0].strftime("%Y-%m-%d %H:%M:%S"),
            "test_end_time": self._df_test['TIME'].iloc[-1].strftime("%Y-%m-%d %H:%M:%S"),
            "load_stats": {
                "min_mw": round(p224_min, 2),
                "max_mw": round(p224_max, 2),
                "mean_mw": round(p224_mean, 2),
                "rated_mva": settings.SUBSTATION_CAPACITY_MVA
            },
            "split_info": self._split_metadata,
            "feeders": settings.FEEDERS
        }

    def get_telemetry_at_index(self, index: int = 0) -> Dict[str, Any]:
        """
        Returns full electrical telemetry snapshot at a given index in test.csv.
        """
        if index < 0 or index >= self.total_test_records:
            index = 0

        row = self._df_test.iloc[index]
        dt = row['TIME']

        p_474 = float(row['P_474 Tân Hưng'])
        p_476 = float(row['P_476 Tân Hưng'])
        p_478 = float(row['P_478 Tân Hưng'])
        p_480 = float(row['P_480 Tân Hưng'])
        p_224 = float(row['P_224'])

        # Check physical conservation P_224 == sum(feeders)
        is_conserved, error_diff = ElectricalPhysics.check_physical_conservation(
            p_224, [p_474, p_476, p_478, p_480]
        )

        # Electrical quantities for Transformer 224
        cos_phi = 0.94
        s_mva = ElectricalPhysics.calculate_apparent_power(p_224, cos_phi)
        q_mvar = ElectricalPhysics.calculate_reactive_power(p_224, cos_phi)
        i_primary_amps = ElectricalPhysics.calculate_line_current(p_224, u_kv=110.0, cos_phi=cos_phi)
        i_secondary_amps = ElectricalPhysics.calculate_line_current(p_224, u_kv=22.0, cos_phi=cos_phi)
        load_factor_pct = round((s_mva / settings.SUBSTATION_CAPACITY_MVA) * 100.0, 2)

        # Feeders detailed telemetry
        feeders_data = []
        feeder_cols = [
            ("P_474 Tân Hưng", p_474),
            ("P_476 Tân Hưng", p_476),
            ("P_478 Tân Hưng", p_478),
            ("P_480 Tân Hưng", p_480),
        ]

        for col_name, p_val in feeder_cols:
            f_meta = settings.FEEDERS[col_name]
            i_f = ElectricalPhysics.calculate_line_current(p_val, u_kv=22.0, cos_phi=0.93)
            q_f = ElectricalPhysics.calculate_reactive_power(p_val, cos_phi=0.93)
            load_pct = round((p_val / f_meta['max_mw']) * 100.0, 1) if f_meta['max_mw'] > 0 else 0.0

            feeders_data.append({
                "key": col_name,
                "code": f_meta["code"],
                "name": f_meta["name"],
                "category": f_meta["category"],
                "p_mw": round(p_val, 3),
                "q_mvar": q_f,
                "current_a": i_f,
                "rated_current_a": f_meta["rated_current_a"],
                "load_factor_pct": min(100.0, load_pct),
                "color": f_meta["color"],
                "description": f_meta["description"],
                "status": "NORMAL" if load_pct < 85 else ("WARNING" if load_pct < 95 else "CRITICAL")
            })

        # EVN Tariff zone
        tariff_info = ElectricalPhysics.get_evn_tariff_zone(dt)

        # Weather telemetry
        weather = {
            "temp_c": float(row['temp']),
            "humidity_pct": float(row['rhum']),
            "precip_mm": float(row['prcp']),
            "wind_speed_kmh": float(row['wspd'])
        }

        return {
            "index": index,
            "timestamp": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "timestamp_iso": dt.isoformat(),
            "date_display": dt.strftime("%d/%m/%Y"),
            "time_display": dt.strftime("%H:%M"),
            "transformer_224": {
                "name": "MBA 224 (110/22kV - 63MVA)",
                "p_mw": round(p_224, 3),
                "s_mva": s_mva,
                "q_mvar": q_mvar,
                "rated_mva": settings.SUBSTATION_CAPACITY_MVA,
                "load_factor_pct": load_factor_pct,
                "voltage_110kv": 115.2,
                "voltage_22kv": 22.8,
                "current_primary_a": i_primary_amps,
                "current_secondary_a": i_secondary_amps,
                "frequency_hz": settings.GRID_FREQUENCY_HZ,
                "cos_phi": cos_phi,
                "conservation_check": {
                    "is_conserved": is_conserved,
                    "delta_mw": round(error_diff, 8),
                    "status": "VALID_PHYSICAL_BALANCE" if is_conserved else "PHYSICAL_VIOLATION"
                }
            },
            "feeders": feeders_data,
            "weather": weather,
            "tariff": tariff_info
        }

    def get_timeline_series(self, start_idx: int = 0, count: int = 48) -> Dict[str, Any]:
        """
        Returns a time window of telemetry for charts.
        """
        end_idx = min(start_idx + count, self.total_test_records)
        df_slice = self._df_test.iloc[start_idx:end_idx]

        timestamps = [t.strftime("%Y-%m-%d %H:%M") for t in df_slice['TIME']]
        p_224 = [round(float(v), 3) for v in df_slice['P_224']]
        p_474 = [round(float(v), 3) for v in df_slice['P_474 Tân Hưng']]
        p_476 = [round(float(v), 3) for v in df_slice['P_476 Tân Hưng']]
        p_478 = [round(float(v), 3) for v in df_slice['P_478 Tân Hưng']]
        p_480 = [round(float(v), 3) for v in df_slice['P_480 Tân Hưng']]
        temp = [round(float(v), 1) for v in df_slice['temp']]
        rhum = [round(float(v), 1) for v in df_slice['rhum']]

        return {
            "start_idx": start_idx,
            "end_idx": end_idx,
            "count": len(timestamps),
            "timestamps": timestamps,
            "series": {
                "P_224": p_224,
                "P_474": p_474,
                "P_476": p_476,
                "P_478": p_478,
                "P_480": p_480,
                "temp": temp,
                "rhum": rhum
            }
        }

data_service = DataService()

