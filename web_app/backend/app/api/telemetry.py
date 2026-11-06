from fastapi import APIRouter, Query
from app.services.data_service import data_service

router = APIRouter(prefix="/api/telemetry", tags=["SCADA Telemetry"])

@router.get("/metadata")
def get_metadata():
    return data_service.get_metadata()

@router.get("/live")
def get_live_telemetry(index: int = Query(0, ge=0, description="Record index in test dataset")):
    return data_service.get_telemetry_at_index(index)

@router.get("/series")
def get_telemetry_series(
    start: int = Query(0, ge=0, description="Start index"),
    count: int = Query(48, ge=1, le=288, description="Number of 30-min steps to return")
):
    return data_service.get_timeline_series(start, count)

