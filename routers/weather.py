from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import httpx
from utils.logger import webhook_logger

router = APIRouter(prefix="/weather", tags=["Weather"])

class CurrentWeather(BaseModel):
    time: str
    temperature: float
    wind_speed: float
    condition_code: int

class DailyForecast(BaseModel):
    time: List[str]
    temperature_max: List[float]
    temperature_min: List[float]
    condition_code: List[int]

class HourlyForecast(BaseModel):
    time: List[str]
    temperature: List[float]
    condition_code: List[int]

class WeatherResponse(BaseModel):
    city: str
    country: str
    latitude: float
    longitude: float
    timezone: str
    current: CurrentWeather
    daily: DailyForecast
    hourly: HourlyForecast

@router.get("", response_model=WeatherResponse)
async def get_weather(city: str = Query(..., description="The city to get weather for")):
    """
    Get weather for a specific city using Open-Meteo.
    """
    try:
        webhook_logger.log(f"Weather check requested for city: {city}")
        
        async with httpx.AsyncClient() as client:
            # 1. Geocoding
            geo_url = "https://geocoding-api.open-meteo.com/v1/search"
            geo_params = {
                "name": city,
                "count": 1,
                "language": "en",
                "format": "json"
            }
            geo_response = await client.get(geo_url, params=geo_params)
            geo_response.raise_for_status()
            geo_data = geo_response.json()
            
            if not geo_data.get("results"):
                webhook_logger.log(f"City not found: {city}", "WARNING")
                raise HTTPException(status_code=404, detail=f"City '{city}' not found")
            
            location = geo_data["results"][0]
            lat = location["latitude"]
            lon = location["longitude"]
            city_name = location["name"]
            country = location.get("country", "Unknown")
            timezone = location.get("timezone", "UTC")

            # 2. Weather Forecast
            weather_url = (
                f"https://api.open-meteo.com/v1/forecast?"
                f"latitude={lat}&longitude={lon}&"
                f"current=temperature_2m,wind_speed_10m,weather_code&"
                f"hourly=temperature_2m,weather_code&"
                f"daily=weather_code,temperature_2m_max,temperature_2m_min&"
                f"timezone={timezone}"
            )
            weather_response = await client.get(weather_url)
            weather_response.raise_for_status()
            w_data = weather_response.json()

            webhook_logger.log(f"Weather data retrieved for {city_name}, {country}")

            return WeatherResponse(
                city=city_name,
                country=country,
                latitude=lat,
                longitude=lon,
                timezone=timezone,
                current=CurrentWeather(
                    time=w_data["current"]["time"],
                    temperature=w_data["current"]["temperature_2m"],
                    wind_speed=w_data["current"]["wind_speed_10m"],
                    condition_code=w_data["current"]["weather_code"]
                ),
                daily=DailyForecast(
                    time=w_data["daily"]["time"],
                    temperature_max=w_data["daily"]["temperature_2m_max"],
                    temperature_min=w_data["daily"]["temperature_2m_min"],
                    condition_code=w_data["daily"]["weather_code"]
                ),
                hourly=HourlyForecast(
                    time=w_data["hourly"]["time"],
                    temperature=w_data["hourly"]["temperature_2m"],
                    condition_code=w_data["hourly"]["weather_code"]
                )
            )

    except httpx.HTTPStatusError as e:
        webhook_logger.log(f"HTTP error occurred: {str(e)}", "ERROR")
        raise HTTPException(status_code=e.response.status_code, detail=f"Open-Meteo API error: {str(e)}")
    except HTTPException as e:
        raise e
    except Exception as e:
        webhook_logger.log(f"Unexpected error in weather router: {str(e)}", "ERROR")
        raise HTTPException(status_code=500, detail="Internal server error while fetching weather data")
