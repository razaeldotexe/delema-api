import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
import httpx
from utils.logger import webhook_logger

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
    Find products using AI with multi-provider rotation fallback.
    """
    prompt = f"""
    User is searching for products related to: "{data.query}".
    Provide a list of up to {data.limit} recommended products with brief descriptions and estimated prices.
    Format your response ONLY as a raw JSON list like this:
    [
        {{"name": "Product Name", "description": "Short summary", "price": "$99.99"}},
        ...
    ]
    Do not include any markdown formatting like ```json or any introductory text.
    """

    providers = [
        {"name": "Gemini", "fn": try_gemini},
        {"name": "Groq", "fn": try_groq},
        {"name": "OpenRouter", "fn": try_openrouter}
    ]

    for provider in providers:
        try:
            webhook_logger.log(f"Trying product search with {provider['name']}...", "AI")
            raw_response = await provider["fn"](prompt)
            
            # Clean response from potential markdown code blocks
            clean_json = raw_response.strip().replace("```json", "").replace("```", "").strip()
            products = json.loads(clean_json)
            
            if isinstance(products, list):
                webhook_logger.log(f"Product search successful using {provider['name']}", "SUCCESS")
                return [ProductResult(**p) for p in products[:data.limit]]
                
        except Exception as e:
            webhook_logger.log(f"Provider {provider['name']} failed for products: {str(e)}", "WARN")
            continue

    raise HTTPException(status_code=503, detail="All AI providers failed to process the product search request.")
