import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.api.telemetry import router as telemetry_router
from app.api.forecast import router as forecast_router
from app.api.topology import router as topology_router
from app.api.kan import router as kan_router
from app.api.duck_curve import router as duck_curve_router
from app.api.physics_audit import router as physics_audit_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Hệ thống Điều độ Giám sát SCADA & Dự báo Phụ tải Điện Thông minh ST-TopoKAN",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(telemetry_router)
app.include_router(forecast_router)
app.include_router(topology_router)
app.include_router(kan_router)
app.include_router(duck_curve_router)
app.include_router(physics_audit_router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "substation": settings.SUBSTATION_NAME,
        "version": settings.VERSION,
        "dataset_ready": settings.TEST_FILE.exists()
    }

# Mount static frontend files if directory exists
frontend_path = settings.FRONTEND_DIR
if frontend_path.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_path)), name="static")

    @app.get("/")
    async def serve_index():
        index_file = frontend_path / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return {"message": "Frontend index.html not found, please check web_app/frontend"}

