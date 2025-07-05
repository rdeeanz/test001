// Weather API Configuration
const WEATHER_CONFIG = {
    // Get your free API key from https://openweathermap.org/api
    API_KEY: 'bd618b56cb1d1bb1fc050f2d6aa7dcc9', // Replace with your actual API key
    BASE_URL: 'https://api.openweathermap.org/data/2.5',
    GEOCODING_URL: 'https://api.openweathermap.org/geo/1.0',
    MAP_URL: 'https://tile.openweathermap.org/map',
    
    // Default settings
    DEFAULT_UNITS: 'metric', // 'metric', 'imperial', 'kelvin'
    DEFAULT_LANGUAGE: 'en',
    
    // API endpoints
    ENDPOINTS: {
        CURRENT: '/weather',
        FORECAST: '/forecast',
        ONECALL: '/onecall',
        DIRECT_GEOCODING: '/direct',
        REVERSE_GEOCODING: '/reverse'
    },
    
    // Weather map layers
    MAP_LAYERS: {
        temp: 'temp_new',
        precipitation: 'precipitation_new',
        wind: 'wind_new',
        clouds: 'clouds_new'
    },
    
    // Update intervals (in milliseconds)
    UPDATE_INTERVALS: {
        CURRENT_WEATHER: 10 * 60 * 1000, // 10 minutes
        FORECAST: 60 * 60 * 1000, // 1 hour
        FAVORITES: 30 * 60 * 1000 // 30 minutes
    }
};

// Weather icon mapping
const WEATHER_ICONS = {
    '01d': 'fas fa-sun sunny',
    '01n': 'fas fa-moon',
    '02d': 'fas fa-cloud-sun cloudy',
    '02n': 'fas fa-cloud-moon',
    '03d': 'fas fa-cloud cloudy',
    '03n': 'fas fa-cloud cloudy',
    '04d': 'fas fa-clouds cloudy',
    '04n': 'fas fa-clouds cloudy',
    '09d': 'fas fa-cloud-rain rainy',
    '09n': 'fas fa-cloud-rain rainy',
    '10d': 'fas fa-cloud-sun-rain rainy',
    '10n': 'fas fa-cloud-moon-rain rainy',
    '11d': 'fas fa-bolt stormy',
    '11n': 'fas fa-bolt stormy',
    '13d': 'fas fa-snowflake snowy',
    '13n': 'fas fa-snowflake snowy',
    '50d': 'fas fa-smog',
    '50n': 'fas fa-smog'
};

// Sample API key message
if (WEATHER_CONFIG.API_KEY === 'YOUR_API_KEY_HERE') {
    console.warn('⚠️ Please set your OpenWeatherMap API key in weather-config.js');
    console.info('Get your free API key at: https://openweathermap.org/api');
}
