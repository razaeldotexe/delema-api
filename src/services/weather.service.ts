import axios from 'axios';
import { NotFoundError } from '../utils/errors';

export class WeatherService {
  /**
   * Map WMO code to condition string.
   */
  private static getWMOCondition(code: number): string {
    const mapping: Record<number, string> = {
      0: 'Clear Sky',
      1: 'Mainly Clear',
      2: 'Partly Cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing Rime Fog',
      51: 'Light Drizzle',
      53: 'Moderate Drizzle',
      55: 'Dense Drizzle',
      61: 'Slight Rain',
      63: 'Moderate Rain',
      65: 'Heavy Rain',
      80: 'Slight Rain Showers',
      81: 'Moderate Rain Showers',
      82: 'Violent Rain Showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with Hail',
      99: 'Thunderstorm with Heavy Hail',
    };

    if (mapping[code]) return mapping[code];
    if (code < 50) return 'Cloudy';
    if (code < 80) return 'Rainy';
    return 'Stormy';
  }

  /**
   * Get weather data from Open-Meteo.
   */
  static async getWeather(query: { city?: string; lat?: number; lon?: number }) {
    const { city, lat, lon } = query;

    let finalLat = lat;
    let finalLon = lon;
    let name = `${lat}, ${lon}`;
    let country = 'Coordinates';
    let tz = 'UTC';

    if (city) {
      const geoUrl = 'https://geocoding-api.open-meteo.com/v1/search';
      const geoResp = await axios.get(geoUrl, {
        params: { name: city, count: 1, language: 'en', format: 'json' },
      });

      if (!geoResp.data.results || geoResp.data.results.length === 0) {
        throw new NotFoundError(`City '${city}' not found`);
      }

      const loc = geoResp.data.results[0];
      finalLat = loc.latitude;
      finalLon = loc.longitude;
      name = loc.name;
      country = loc.country || 'Unknown';
      tz = loc.timezone || 'UTC';
    }

    if (finalLat === undefined || finalLon === undefined) {
      throw new Error("Provide either 'city' or both 'lat' and 'lon'");
    }

    const weatherUrl = 'https://api.open-meteo.com/v1/forecast';
    const weatherParams = {
      latitude: finalLat,
      longitude: finalLon,
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
      hourly: 'temperature_2m,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      timezone: tz,
    };

    const wResp = await axios.get(weatherUrl, { params: weatherParams });
    const wData = wResp.data;

    const dailyItems = wData.daily.time.map((time: string, i: number) => ({
      date: time,
      max_temp: wData.daily.temperature_2m_max[i],
      min_temp: wData.daily.temperature_2m_min[i],
      condition: this.getWMOCondition(wData.daily.weather_code[i]),
      weather_code: wData.daily.weather_code[i],
    }));

    const hourlyItems = wData.hourly.time.map((time: string, i: number) => ({
      time: time,
      temperature: wData.hourly.temperature_2m[i],
      condition: this.getWMOCondition(wData.hourly.weather_code[i]),
      weather_code: wData.hourly.weather_code[i],
    }));

    return {
      location: { name, country, lat: finalLat, lon: finalLon, timezone: tz },
      current: {
        time: wData.current.time,
        temperature: wData.current.temperature_2m,
        wind_speed: wData.current.wind_speed_10m,
        humidity: wData.current.relative_humidity_2m,
        condition: this.getWMOCondition(wData.current.weather_code),
        weather_code: wData.current.weather_code,
      },
      daily: dailyItems,
      hourly: hourlyItems,
    };
  }
}
