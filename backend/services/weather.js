/**
 * Weather Service — Call Open-Meteo Forecast API.
 * Free, no API key required.
 */

// WMO Weather Interpretation Codes
const WEATHER_CODES = {
  0: 'Trời quang đãng (Nắng)',
  1: 'Chủ yếu quang đãng',
  2: 'Mây rải rác',
  3: 'Nhiều mây',
  45: 'Sương mù',
  48: 'Sương mù đóng băng',
  51: 'Mưa phùn nhẹ',
  53: 'Mưa phùn vừa',
  55: 'Mưa phùn dày',
  61: 'Mưa nhẹ',
  63: 'Mưa vừa',
  65: 'Mưa to',
  80: 'Mưa rào nhẹ',
  81: 'Mưa rào vừa',
  82: 'Mưa rào to',
  95: 'Giông bão',
  96: 'Giông bão kèm mưa đá nhẹ',
  99: 'Giông bão kèm mưa đá to',
};

const logger = require('./logger');

/**
 * Fetch weather forecast from Open-Meteo API.
 */
async function getWeather(latitude, longitude, targetDate) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia/Ho_Chi_Minh&forecast_days=14`;

  try {
    logger.info('WEATHER', `Fetching forecast for: [Lat: ${latitude}, Lon: ${longitude}] on date: ${targetDate}...`);
    const response = await fetch(url);

    if (!response.ok) {
      logger.error('WEATHER', `API Error: ${response.status}`);
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json();
    const daily = data.daily;
    
    // Find target date index
    let targetIndex = daily.time.indexOf(targetDate);
    if (targetIndex === -1) {
      logger.warn('WEATHER', `Target date ${targetDate} not found, falling back to 7-day forecast.`);
      targetIndex = Math.min(6, daily.time.length - 1);
    }

    const code = daily.weather_code[targetIndex];
    const maxTemp = daily.temperature_2m_max[targetIndex];
    const minTemp = daily.temperature_2m_min[targetIndex];
    const rainProb = daily.precipitation_probability_max[targetIndex];

    const isSunny = code <= 3 && rainProb < 50;
    const condition = isSunny ? 'sunny' : 'rainy';
    const description = WEATHER_CODES[code] || `Mã thời tiết ${code}`;

    const result = {
      condition,
      isSunny,
      weatherCode: code,
      description,
      maxTemp,
      minTemp,
      rainProbability: rainProb,
      targetDate: daily.time[targetIndex],
      summary: `${description}, nhiệt độ ${minTemp}°C - ${maxTemp}°C, xác suất mưa: ${rainProb}%`,
    };

    logger.success('WEATHER', `Result: ${result.summary}`);
    return result;
  } catch (error) {
    logger.error('WEATHER', `Unexpected error: ${error.message}`, error);
    throw error;
  }
}

module.exports = { getWeather, WEATHER_CODES };
