from fastapi import APIRouter, Query
from app.services.forecast_service import forecast_service

router = APIRouter(prefix="/api/forecast", tags=["ST-TopoKAN Forecasting"])

@router.get("/benchmarks")
def get_benchmarks():
    return {
        "description": "Kết quả thực nghiệm chính thức của mô hình ST-TopoKAN trên 6 khoảng dự báo",
        "benchmarks": forecast_service.get_all_horizon_benchmarks(),
        "summary": {
            "avg_wape": 10.10,
            "best_1p_wape": 6.20,
            "best_48p_wape": 13.86,
            "architecture": "Hybrid KAN + GRU + AR-Independent Heads + Sparse Topology Encoder"
        }
    }

@router.get("/window")
def get_forecast_window(
    index: int = Query(100, ge=48, description="Current time index in test dataset"),
    horizon: int = Query(48, ge=1, le=48, description="Forecast steps: 1, 2, 6, 12, 24, 48")
):
    return forecast_service.generate_horizon_forecast(current_idx=index, horizon_steps=horizon)

