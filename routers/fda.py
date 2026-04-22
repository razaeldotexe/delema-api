from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
from enum import Enum
import httpx
from utils.logger import webhook_logger

router = APIRouter(prefix="/fda", tags=["FDA Search"])

class FDACategory(str, Enum):
    drug = "drug"
    food = "food"
    device = "device"

class FDASearchRequest(BaseModel):
    query: str
    category: FDACategory
    limit: Optional[int] = 5

@router.post("/search")
async def search_fda(data: FDASearchRequest):
    """
    Search for products using the OpenFDA API.
    Categories: drug (labels), food (enforcement), device (classification).
    """
    base_urls = {
        FDACategory.drug: "https://api.fda.gov/drug/label.json",
        FDACategory.food: "https://api.fda.gov/food/enforcement.json",
        FDACategory.device: "https://api.fda.gov/device/classification.json"
    }
    
    url = base_urls.get(data.category)
    params = {
        "search": data.query,
        "limit": data.limit
    }
    
    webhook_logger.log(f"Searching FDA {data.category} for: {data.query}", "FDA")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=15.0)
            
            if response.status_code == 404:
                return {"results": [], "message": "No results found"}
            
            if response.status_code != 200:
                webhook_logger.log(f"FDA API Error: {response.status_code}", "ERROR")
                raise HTTPException(status_code=response.status_code, detail="FDA API Error")
            
            data_json = response.json()
            return {"results": data_json.get("results", [])}
            
        except httpx.HTTPError as e:
            webhook_logger.log(f"FDA API request failed: {str(e)}", "ERROR")
            raise HTTPException(status_code=500, detail=f"FDA API request failed: {str(e)}")
