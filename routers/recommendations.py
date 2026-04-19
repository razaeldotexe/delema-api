from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter(prefix="/recommend", tags=["Recommendations"])

class ScoreRequest(BaseModel):
    items: List[Dict[str, Any]]
    weights: Dict[str, float]

@router.post("/score")
async def calculate_scores(data: ScoreRequest):
    """
    Calculate scores for a list of items based on provided weights.
    """
    if not data.items:
        return {"scored_items": []}
    
    scored_items = []
    for item in data.items:
        score = 0.0
        for key, weight in data.weights.items():
            val = item.get(key, 0)
            if isinstance(val, (int, float)):
                score += float(val) * weight
            elif isinstance(val, bool):
                score += (1.0 if val else 0.0) * weight
        
        scored_item = item.copy()
        scored_item["_score"] = round(score, 4)
        scored_items.append(scored_item)
    
    # Sort by score descending
    scored_items.sort(key=lambda x: x["_score"], reverse=True)
    
    return {"scored_items": scored_items}
