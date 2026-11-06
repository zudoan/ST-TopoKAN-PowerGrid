from fastapi import APIRouter
from app.services.duck_curve_service import duck_curve_service

router = APIRouter(prefix="/api/duck-curve", tags=["Duck Curve & Solar Impact"])

@router.get("/profile")
def get_duck_curve_profile():
    return duck_curve_service.get_hourly_load_profile()

