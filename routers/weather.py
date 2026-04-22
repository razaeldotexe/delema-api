from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import httpx
from utils.logger import webhook_logger

router = APIRouter(prefix="/weather", tags=["Weather"])

def get_wmo_condition(code: int) -> str:
    """Map WMO code to condition string."""
    mapping = {
        0: "Clear Sky",
        1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
        45: "Fog", 48: "Depositing Rime Fog",
        51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
        61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
        80: "Slight Rain Showers", 81: "Moderate Rain Showers", 82: "Violent Rain Showers",
        95: "Thunderstorm", 96: "Thunderstorm with Hail", 99: "Thunderstorm with Heavy Hail"
    }
    return mapping.get(code, "Cloudy" if code < 50 else "Rainy" if code < 80 else "Stormy")

class LocationInfo(BaseModel):
    name: str
    country: str
    lat: float
    lon: float
    timezone: str

class CurrentWeather(BaseModel):
    time: str
    temperature: float
    wind_speed: float
    humidity: int
    condition: str
    weather_code: int

class DailyItem(BaseModel):
    date: str
    max_temp: float
    min_temp: float
    condition: str
    weather_code: int

class HourlyItem(BaseModel):
    time: str
    temperature: float
    condition: str
    weather_code: int

class WeatherResponse(BaseModel):
    location: LocationInfo
    current: CurrentWeather
    daily: List[DailyItem]
    hourly: List[HourlyItem]

@router.get("", response_model=WeatherResponse)
async def get_weather(
    city: Optional[str] = Query(None, description="City name"),
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude")
):
    """Get weather data from Open-Meteo."""
    try:
        if not city and (lat is None or lon is None):
            raise HTTPException(status_code=400, detail="Provide either 'city' or both 'lat' and 'lon'")

        async with httpx.AsyncClient() as client:
            if city:
                geo_url = "https://geocoding-api.open-meteo.com/v1/search"
                geo_params = {"name": city, "count": 1, "language": "en", "format": "json"}
                geo_resp = await client.get(geo_url, params=geo_params)
                geo_resp.raise_for_status()
                geo_data = geo_resp.json()
                if not geo_data.get("results"):
                    raise HTTPException(status_code=404, detail=f"City '{city}' not found")
                loc = geo_data["results"][0]
                lat, lon = loc["latitude"], loc["longitude"]
                name, country, tz = loc["name"], loc.get("country", "Unknown"), loc.get("timezone", "UTC")
            else:
                name, country, tz = f"{lat}, {lon}", "Coordinates", "UTC"

            weather_url = "https://api.open-meteo.com/v1/forecast"
            weather_params = {
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
                "hourly": "temperature_2m,weather_code",
                "daily": "weather_code,temperature_2m_max,temperature_2m_min",
                "timezone": tz
            }
            w_resp = await client.get(weather_url, params=weather_params)
            w_resp.raise_for_status()
            w_data = w_resp.json()

            daily_items = [
                DailyItem(
                    date=w_data["daily"]["time"][i],
                    max_temp=w_data["daily"]["temperature_2m_max"][i],
                    min_temp=w_data["daily"]["temperature_2m_min"][i],
                    condition=get_wmo_condition(w_data["daily"]["weather_code"][i]),
                    weather_code=w_data["daily"]["weather_code"][i]
                ) for i in range(len(w_data["daily"]["time"]))
            ]

            hourly_items = [
                HourlyItem(
                    time=w_data["hourly"]["time"][i],
                    temperature=w_data["hourly"]["temperature_2m"][i],
                    condition=get_wmo_condition(w_data["hourly"]["weather_code"][i]),
                    weather_code=w_data["hourly"]["weather_code"][i]
                ) for i in range(len(w_data["hourly"]["time"]))
            ]

            return WeatherResponse(
                location=LocationInfo(name=name, country=country, lat=lat, lon=lon, timezone=tz),
                current=CurrentWeather(
                    time=w_data["current"]["time"],
                    temperature=w_data["current"]["temperature_2m"],
                    wind_speed=w_data["current"]["wind_speed_10m"],
                    humidity=w_data["current"]["relative_humidity_2m"],
                    condition=get_wmo_condition(w_data["current"]["weather_code"]),
                    weather_code=w_data["current"]["weather_code"]
                ),
                daily=daily_items,
                hourly=hourly_items
            )
    except Exception as e:
        webhook_logger.log(f"Weather Error: {str(e)}", "ERROR")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail="Internal server error while fetching weather data")

