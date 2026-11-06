import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import Dict, Any

@dataclass
class Settings:
    PROJECT_NAME: str = "ST-TopoKAN SCADA & Forecasting System"
    VERSION: str = "2.4.0"
    SUBSTATION_NAME: str = "Trạm 110/22kV Tân Hưng - MBA T2 (224)"
    SUBSTATION_CAPACITY_MVA: float = 63.0
    NOMINAL_VOLTAGE_KV: float = 22.0
    GRID_FREQUENCY_HZ: float = 50.0
    
    # Base paths (project root is 4 levels up from this file)
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent.parent
    DATA_DIR: Path = field(default=None)
    VALIDATION_DIR: Path = field(default=None)
    KIEM_TRA_DIR: Path = field(default=None)
    TRAIN_FILE: Path = field(default=None)
    VAL_FILE: Path = field(default=None)
    TEST_FILE: Path = field(default=None)
    SPLIT_META_FILE: Path = field(default=None)
    FRONTEND_DIR: Path = field(default=None)
    
    def __post_init__(self):
        # Resolve project root correctly
        self.BASE_DIR = Path(__file__).resolve().parents[4]
        self.DATA_DIR = self.BASE_DIR / "data"
        self.VALIDATION_DIR = self.BASE_DIR / "validation"
        self.KIEM_TRA_DIR = self.VALIDATION_DIR
        self.TRAIN_FILE = self.DATA_DIR / "train.csv"
        self.VAL_FILE = self.DATA_DIR / "val.csv"
        self.TEST_FILE = self.DATA_DIR / "test.csv"
        self.SPLIT_META_FILE = self.DATA_DIR / "split_metadata.json"
        self.FRONTEND_DIR = self.BASE_DIR / "web_app" / "frontend"

    # Feeders metadata
    FEEDERS: Dict[str, Dict[str, Any]] = field(default_factory=lambda: {
        "P_474 Tân Hưng": {
            "code": "MC-474",
            "name": "Xuất tuyến 474 Tân Hưng",
            "category": "",
            "rated_current_a": 630.0,
            "max_mw": 24.0,
            "color": "#00f2fe",
            "description": "Xuất tuyến 474 - 22kV"
        },
        "P_476 Tân Hưng": {
            "code": "MC-476",
            "name": "Xuất tuyến 476 Tân Hưng",
            "category": "",
            "rated_current_a": 630.0,
            "max_mw": 20.0,
            "color": "#38bdf8",
            "description": "Xuất tuyến 476 - 22kV"
        },
        "P_478 Tân Hưng": {
            "code": "MC-478",
            "name": "Xuất tuyến 478 Tân Hưng",
            "category": "",
            "rated_current_a": 630.0,
            "max_mw": 20.0,
            "color": "#f59e0b",
            "description": "Xuất tuyến 478 - 22kV"
        },
        "P_480 Tân Hưng": {
            "code": "MC-480",
            "name": "Xuất tuyến 480 Tân Hưng",
            "category": "",
            "rated_current_a": 630.0,
            "max_mw": 24.0,
            "color": "#10b981",
            "description": "Xuất tuyến 480 - 22kV"
        }
    })
    
    # Official evaluation metrics from ST-TopoKAN training results
    HORIZON_METRICS: Dict[str, Dict[str, Any]] = field(default_factory=lambda: {
        "1": {"horizon_name": "1P (30 phút)", "minutes": 30, "model": "Topo_KAN_MS", "mae": 1.2542, "rmse": 1.9087, "wape": 6.1980, "r2": 0.9497, "params_k": 332.2, "latency_ms": 0.065},
        "2": {"horizon_name": "2P (1 giờ)", "minutes": 60, "model": "Topo_KAN_MS", "mae": 1.4746, "rmse": 2.2050, "wape": 7.2870, "r2": 0.9329, "params_k": 334.8, "latency_ms": 0.064},
        "6": {"horizon_name": "6P (3 giờ)", "minutes": 180, "model": "Topo_KAN_MS", "mae": 1.9599, "rmse": 2.8213, "wape": 9.6852, "r2": 0.8902, "params_k": 342.6, "latency_ms": 0.086},
        "12": {"horizon_name": "12P (6 giờ)", "minutes": 360, "model": "Topo_KAN_Standard", "mae": 2.1969, "rmse": 3.0593, "wape": 10.8563, "r2": 0.8709, "params_k": 361.8, "latency_ms": 0.115},
        "24": {"horizon_name": "24P (12 giờ)", "minutes": 720, "model": "Topo_KAN_Standard", "mae": 2.5758, "rmse": 3.5361, "wape": 12.7305, "r2": 0.8277, "params_k": 375.5, "latency_ms": 0.120},
        "48": {"horizon_name": "48P (24 giờ)", "minutes": 1440, "model": "Topo_KAN_Standard", "mae": 2.8041, "rmse": 3.7973, "wape": 13.8589, "r2": 0.8013, "params_k": 403.6, "latency_ms": 0.130}
    })

settings = Settings()
