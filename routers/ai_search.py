import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
import httpx
from utils.logger import webhook_logger
from utils.product_fetcher import fetch_real_products

router = APIRouter(prefix="/ai", tags=["AI Search"])

# AI Models (Consistent with OpenZero ecosystem)
GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite-preview-02-05"]
GROQ_MODELS = ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"]
OPENROUTER_MODELS = ["google/gemini-2.0-flash-001", "meta-llama/llama-3.3-70b-instruct"]

class ProductSearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 5

class ProductResult(BaseModel):
    name: str
    description: str
    price: str
    source_url: Optional[str] = None
    source_name: Optional[str] = "AI Recommended"

async def try_gemini(prompt: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")
        
    async with httpx.AsyncClient() as client:
        for model in GEMINI_MODELS:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                response = await client.post(url, json={
                    "contents": [{"parts": [{"text": prompt}]}]
                }, timeout=10.0)
                
                if response.status_code == 200:
                    data = response.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
            except Exception as e:
                webhook_logger.log(f"Gemini {model} failed: {str(e)}", "WARN")
                continue
    raise Exception("All Gemini models failed")

async def try_groq(prompt: str) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not set")
        
    async with httpx.AsyncClient() as client:
        for model in GROQ_MODELS:
            try:
                url = "https://api.groq.com/openai/v1/chat/completions"
                response = await client.post(url, headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }, json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}]
                }, timeout=10.0)
                
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
            except Exception as e:
                webhook_logger.log(f"Groq {model} failed: {str(e)}", "WARN")
                continue
    raise Exception("All Groq models failed")

async def try_openrouter(prompt: str) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY not set")
        
    async with httpx.AsyncClient() as client:
        for model in OPENROUTER_MODELS:
            try:
                url = "https://openrouter.ai/api/v1/chat/completions"
                response = await client.post(url, headers={
                    "Authorization": f"Bearer {api_key}",
                    "HTTP-Referer": "https://delema.razael-fox.my.id",
                    "X-Title": "Delema API"
                }, json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}]
                }, timeout=15.0)
                
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
            except Exception as e:
                webhook_logger.log(f"OpenRouter {model} failed: {str(e)}", "WARN")
                continue
    raise Exception("All OpenRouter models failed")

@router.post("/search-products", response_model=List[ProductResult])
async def search_products(data: ProductSearchRequest):
    """
    Hybrid Product Search:
    1. Fetches REAL data from the web (DuckDuckGo).
    2. Uses AI to analyze the real data and provide structured recommendations.
    """
    # Phase 1: Fetch Real Data
    real_data = fetch_real_products(data.query, max_results=data.limit * 2)
    
    context_str = ""
    if real_data:
        context_str = "Here are some real search results from the web to help you:\n"
        for i, item in enumerate(real_data):
            context_str += f"{i+1}. {item['name']} - {item['description']} (Source: {item['source_url']})\n"

    # Phase 2: AI Processing
    prompt = f"""
    User is searching for: "{data.query}".
    {context_str}
    
    Task: Based on the real results above (if any) and your knowledge, provide a list of up to {data.limit} best product recommendations.
    Include valid source_url from the real data if it matches a recommendation.
    Format your response ONLY as a raw JSON list:
    [
        {{
            "name": "Product Name", 
            "description": "Short summary", 
            "price": "Estimated or real price",
            "source_url": "Real URL from data above or null",
            "source_name": "Store name or 'Web Result'"
        }},
        ...
    ]
    Do not include markdown or introductory text.
    """

    providers = [
        {"name": "Gemini", "fn": try_gemini},
        {"name": "Groq", "fn": try_groq},
        {"name": "OpenRouter", "fn": try_openrouter}
    ]

    for provider in providers:
        try:
            webhook_logger.log(f"Processing hybrid search with {provider['name']}...", "AI")
            raw_response = await provider["fn"](prompt)
            
            clean_json = raw_response.strip().replace("```json", "").replace("```", "").strip()
            products = json.loads(clean_json)
            
            if isinstance(products, list):
                webhook_logger.log(f"Hybrid search successful using {provider['name']}", "SUCCESS")
                return [ProductResult(**p) for p in products[:data.limit]]
                
        except Exception as e:
            webhook_logger.log(f"Provider {provider['name']} failed: {str(e)}", "WARN")
            continue

    raise HTTPException(status_code=503, detail="All AI providers failed to process the hybrid search request.")
