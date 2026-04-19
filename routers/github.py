from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
import httpx

router = APIRouter(prefix="/github", tags=["GitHub"])

class GitHubScanRequest(BaseModel):
    owner: str
    repo: str
    token: Optional[str] = None
    path: str = ""

class GitHubContentRequest(BaseModel):
    owner: str
    repo: str
    token: Optional[str] = None
    path: str

class FileInfo(BaseModel):
    name: str
    path: str
    type: str
    download_url: Optional[str] = None

@router.post("/scan", response_model=List[FileInfo])
async def scan_github(data: GitHubScanRequest):
    """
    Scans a GitHub repository for files.
    """
    url = f"https://api.github.com/repos/{data.owner}/{data.repo}/contents/{data.path}"
    headers = {"Accept": "application/vnd.github.v3+json"}
    if data.token:
        headers["Authorization"] = f"token {data.token}"
        
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.json().get("message", "GitHub API Error"))
            
            contents = response.json()
            if not isinstance(contents, list):
                # It's a single file
                contents = [contents]
                
            return [FileInfo(
                name=item["name"],
                path=item["path"],
                type=item["type"],
                download_url=item.get("download_url")
            ) for item in contents if item["type"] == "file" and item["name"].endswith(".md")]
            
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.post("/content")
async def get_github_content(data: GitHubContentRequest):
    """
    Fetches the content of a file from GitHub.
    """
    url = f"https://api.github.com/repos/{data.owner}/{data.repo}/contents/{data.path}"
    headers = {"Accept": "application/vnd.github.v3.raw"}
    if data.token:
        headers["Authorization"] = f"token {data.token}"
        
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch file content")
            
            return {"content": response.text}
            
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=str(e))
