from fastapi import APIRouter, Query
from app.services.kan_service import kan_service

router = APIRouter(prefix="/api/kan", tags=["Kolmogorov-Arnold Network"])

@router.get("/spline-basis")
def get_spline_basis(
    grid_size: int = Query(5, ge=3, le=12, description="KAN grid resolution"),
    spline_order: int = Query(3, ge=1, le=5, description="B-spline order (3=cubic)")
):
    return kan_service.get_spline_basis_curves(grid_size=grid_size, spline_order=spline_order)

@router.get("/comparison")
def get_kan_comparison():
    return kan_service.get_kan_vs_mlp_comparison()

