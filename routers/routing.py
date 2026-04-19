from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Union
import hashlib

router = APIRouter(prefix="/routing", tags=["Automated Routing"])

class Variant(BaseModel):
    name: str
    weight: float
    data: Optional[Dict[str, Any]] = None

from typing import Optional

class ABTestRequest(BaseModel):
    user_id: str
    variants: List[Variant]

@router.post("/ab-test")
async def ab_test_assignment(data: ABTestRequest):
    """
    Deterministically assign a user to a variant based on consistent hashing.
    """
    if not data.variants:
        raise HTTPException(status_code=400, detail="No variants provided")
    
    # Normalize weights to 100
    total_weight = sum(v.weight for v in data.variants)
    if total_weight == 0:
        raise HTTPException(status_code=400, detail="Total weight must be greater than 0")
    
    # Generate a deterministic hash for the user_id (0-99)
    hash_val = int(hashlib.md5(data.user_id.encode()).hexdigest(), 16)
    bucket = hash_val % 100
    
    cumulative = 0.0
    for variant in data.variants:
        # Scale variant weight to 100
        scaled_weight = (variant.weight / total_weight) * 100
        cumulative += scaled_weight
        if bucket < cumulative:
            return {"variant": variant.name, "data": variant.data}
            
    # Fallback to last variant
    return {"variant": data.variants[-1].name, "data": data.variants[-1].data}
