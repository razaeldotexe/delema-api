from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx

router = APIRouter(prefix="/apps", tags=["App Search"])

class AppSearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 10

class AppSearchResult(BaseModel):
    name: str
    summary: Optional[str]
    icon_url: Optional[str]
    url: str
    source: str

@router.post("/fdroid", response_model=List[AppSearchResult])
async def search_fdroid(data: AppSearchRequest):
    """
    Search for Android apps on F-Droid using the unofficial search API.
    """
    url = f"https://search.f-droid.org/api/search_apps?q={data.query}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=10.0)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="F-Droid Search API Error")
            
            data_json = response.json()
            apps = data_json.get("apps", [])
            
            results = []
            for app in apps:
                results.append(AppSearchResult(
                    name=app.get("name", "Unknown"),
                    summary=app.get("summary"),
                    icon_url=app.get("icon"),
                    url=app.get("url", f"https://f-droid.org/packages/{app.get('id', '')}"),
                    source="fdroid"
                ))
            
            return results[:data.limit]
            
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"F-Droid API request failed: {str(e)}")

@router.post("/github", response_model=List[AppSearchResult])
async def search_github_apps(data: AppSearchRequest):
    """
    Search for Android applications on GitHub by filtering with 'android' or 'app' topics.
    """
    # Search for repositories matching query and having 'android' or 'app' topic
    search_query = f"{data.query} topic:android"
    url = f"https://api.github.com/search/repositories?q={search_query}&per_page={data.limit}"
    
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "OpenZeroBot/1.0"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=10.0)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=f"GitHub API Error: {response.text}")
            
            data_json = response.json()
            items = data_json.get("items", [])
            
            results = []
            for repo in items:
                results.append(AppSearchResult(
                    name=repo.get("full_name", repo.get("name")),
                    summary=repo.get("description"),
                    icon_url=repo.get("owner", {}).get("avatar_url"),
                    url=repo.get("html_url"),
                    source="github"
                ))
                
            return results
            
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"GitHub API request failed: {str(e)}")
