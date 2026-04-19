try:
    from duckduckgo_search import DDGS
except ImportError:
    from ddgs import DDGS

from typing import List, Dict, Any
from utils.logger import webhook_logger

def fetch_real_products(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    """
    Mengambil data produk riil dari DuckDuckGo Search (Shopping/Web results).
    """
    results = []
    try:
        webhook_logger.log(f"Fetching real products for: {query}", "SCRAPER")
        with DDGS() as ddgs:
            # Mencari di DuckDuckGo dengan keyword shopping agar data lebih akurat
            search_query = f"{query} price buy online"
            ddgs_results = ddgs.text(search_query, max_results=max_results)
            
            for r in ddgs_results:
                results.append({
                    "name": r.get("title", "Unknown Product"),
                    "description": r.get("body", "No description available."),
                    "source_url": r.get("href", "#"),
                    "source_name": "Web Result"
                })
        
        webhook_logger.log(f"Found {len(results)} real product links.", "SUCCESS")
    except Exception as e:
        webhook_logger.log(f"Scraper failed: {str(e)}", "ERROR")
        
    return results
