from fastapi import APIRouter
from app.services.topology_service import topology_service

router = APIRouter(prefix="/api/topology", tags=["Power Substation Topology"])

@router.get("/single-line-diagram")
def get_single_line_diagram():
    return topology_service.get_single_line_diagram()

@router.get("/learned-graph")
def get_learned_feature_graph():
    return topology_service.get_learned_feature_graph()

