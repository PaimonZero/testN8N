/**
 * Geocoding Service — Call Mapbox Geocoding API
 * Convert a city/place name into Latitude and Longitude.
 */

const logger = require('./logger');
const MAPBOX_API_KEY = process.env.MAPBOX_API_KEY;

/**
 * Fetch coordinates for a given location string.
 *
 * @param {string} placeName - e.g. "Vũng Tàu", "Huyện Đức Trọng"
 * @returns {object} { latitude, longitude, placeName }
 */
async function getCoordinates(placeName, userKeys = {}) {
  const apiKey = userKeys.mapboxApiKey || MAPBOX_API_KEY;
  if (!apiKey || apiKey === 'your-mapbox-api-key-here') {
    logger.error('GEOCODING', 'MAPBOX_API_KEY is not configured.');
    throw new Error('Nghiêm trọng: Chưa cấu hình MAPBOX_API_KEY. Vui lòng thêm vào .env');
  }

  const encodedPlace = encodeURIComponent(placeName);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedPlace}.json?access_token=${apiKey}&limit=1`;

  try {
    logger.info('GEOCODING', `Searching for: "${placeName}"...`);
    const response = await fetch(url);
    if (!response.ok) {
      const err = await response.text();
      logger.error('GEOCODING', `API Error: ${response.status}`, err);
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      logger.warn('GEOCODING', `No results found for: "${placeName}"`);
      throw new Error(`Không tìm thấy toạ độ cho địa điểm: ${placeName}`);
    }

    const feature = data.features[0];
    const [longitude, latitude] = feature.center;
    const result = {
      latitude,
      longitude,
      placeName: feature.place_name || placeName
    };
    
    logger.success('GEOCODING', `Found: ${result.placeName} (${result.latitude}, ${result.longitude})`);
    return result;
  } catch (error) {
    logger.error('GEOCODING', `Unexpected error: ${error.message}`, error);
    throw error;
  }
}

module.exports = { getCoordinates };
