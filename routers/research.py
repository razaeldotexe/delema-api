from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import arxiv
import wikipediaapi
import httpx

router = APIRouter(prefix="/research", tags=["Research"])

# Wikipedia Setup
wiki_en = wikipediaapi.Wikipedia('OpenZeroBot/1.0', 'en')

class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 10

class ArxivPaper(BaseModel):
    title: str
    authors: List[str]
    summary: str
    published: str
    primary_category: str
    pdf_url: str
    entry_id: str

class WikipediaResult(BaseModel):
    title: str
    summary: str
    fullurl: str

class NerdFontResult(BaseModel):
    patchedName: str
    unpatchedName: str
    folderName: str
    downloadUrl: str

@router.post("/arxiv", response_model=List[ArxivPaper])
async def search_arxiv(data: SearchRequest):
    """
    Search for scientific papers on arXiv.
    """
    try:
        search = arxiv.Search(
            query=data.query,
            max_results=data.limit,
            sort_by=arxiv.SortCriterion.Relevance
        )
        
        results = []
        for result in search.results():
            results.append(ArxivPaper(
                title=result.title,
                authors=[a.name for a in result.authors],
                summary=result.summary,
                published=result.published.strftime("%Y-%m-%d"),
                primary_category=result.primary_category,
                pdf_url=result.pdf_url,
                entry_id=result.entry_id
            ))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/wikipedia", response_model=WikipediaResult)
async def search_wikipedia(data: SearchRequest):
    """
    Search for information on Wikipedia.
    """
    try:
        page = wiki_en.page(data.query)
        if not page.exists():
            raise HTTPException(status_code=404, detail="Page not found")
        
        return WikipediaResult(
            title=page.title,
            summary=page.summary[:2000], # Limit summary length
            fullurl=page.fullurl
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/nerdfont", response_model=List[NerdFontResult])
async def search_nerdfont(data: SearchRequest):
    """
    Search for Nerd Fonts (mock/simplified search).
    In a real scenario, this would scan GitHub releases or a static list.
    """
    # Common Nerd Fonts
    fonts = [
        {"name": "JetBrainsMono", "display": "JetBrains Mono Nerd Font", "unpatched": "JetBrains Mono"},
        {"name": "FiraCode", "display": "Fira Code Nerd Font", "unpatched": "Fira Code"},
        {"name": "Hack", "display": "Hack Nerd Font", "unpatched": "Hack"},
        {"name": "Meslo", "display": "Meslo LG Nerd Font", "unpatched": "Meslo LG"},
        {"name": "SourceCodePro", "display": "Source Code Pro Nerd Font", "unpatched": "Source Code Pro"},
        {"name": "CascadiaCode", "display": "Cascadia Code Nerd Font", "unpatched": "Cascadia Code"},
        {"name": "UbuntuMono", "display": "Ubuntu Mono Nerd Font", "unpatched": "Ubuntu Mono"},
    ]
    
    query = data.query.lower()
    results = []
    version = "v3.3.0" # Current stable
    
    for font in fonts:
        if query in font["name"].lower() or query in font["display"].lower():
            results.append(NerdFontResult(
                patchedName=font["display"],
                unpatchedName=font["unpatched"],
                folderName=font["name"],
                downloadUrl=f"https://github.com/ryanoasis/nerd-fonts/releases/download/{version}/{font['name']}.zip"
            ))
            
    if not results:
        # Fallback to simple name search if no match
        # This is just a placeholder logic
        name = data.query.replace(" ", "")
        results.append(NerdFontResult(
            patchedName=f"{data.query} Nerd Font",
            unpatchedName=data.query,
            folderName=name,
            downloadUrl=f"https://github.com/ryanoasis/nerd-fonts/releases/download/{version}/{name}.zip"
        ))
        
    return results
