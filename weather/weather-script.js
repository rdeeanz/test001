class WeatherDashboard {
    constructor() {
        this.currentWeatherData = null;
        this.forecastData = null;
        this.currentLocation = { lat: null, lon: null };
        this.units = localStorage.getItem('weatherUnits') || WEATHER_CONFIG.DEFAULT_UNITS;
        this.favorites = JSON.parse(localStorage.getItem('weatherFavorites')) || [];
        this.map = null;
        this.chart = null;
        this.currentMapLayer = 'temp';
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.updateDateTime();
        this.updateUnitDisplay();
        this.renderFavorites();
        
        // Start with user's location or default
        await this.getCurrentLocation();
        
        // Set up auto-refresh intervals
        this.setupAutoRefresh();
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('location-input').addEventListener('input', 
            this.debounce(this.handleSearchInput.bind(this), 300));
        document.getElementById('location-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchLocation(e.target.value);
            }
        });

        // Location button
        document.getElementById('location-btn').addEventListener('click', 
            this.getCurrentLocation.bind(this));

        // Unit toggle
        document.getElementById('unit-toggle').addEventListener('click', 
            this.toggleUnits.bind(this));

        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', 
            this.refreshData.bind(this));

        // Favorites
        document.getElementById('add-favorite').addEventListener('click', 
            this.addToFavorites.bind(this));

        // Map layer controls
        document.querySelectorAll('.map-layer-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchMapLayer(e.target.dataset.layer);
            });
        });

        // Update date/time every minute
        setInterval(this.updateDateTime.bind(this), 60000);
    }

    setupAutoRefresh() {
        // Refresh current weather every 10 minutes
        setInterval(() => {
            if (this.currentLocation.lat && this.currentLocation.lon) {
                this.fetchWeatherData(this.currentLocation.lat, this.currentLocation.lon);
            }
        }, WEATHER_CONFIG.UPDATE_INTERVALS.CURRENT_WEATHER);

        // Refresh favorites every 30 minutes
        setInterval(() => {
            this.updateFavoritesWeather();
        }, WEATHER_CONFIG.UPDATE_INTERVALS.FAVORITES);
    }

    async getCurrentLocation() {
        try {
            this.showLoading(true);
            
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        this.currentLocation = { lat: latitude, lon: longitude };
                        await this.fetchWeatherData(latitude, longitude);
                        this.showLoading(false);
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        this.showError('Unable to get your location. Please search for a city.');
                        // Default to London
                        this.searchLocation('London');
                    }
                );
            } else {
                this.showError('Geolocation is not supported by this browser.');
                this.searchLocation('London');
            }
        } catch (error) {
            console.error('Error getting location:', error);
            this.showError('Error getting location. Please try again.');
            this.showLoading(false);
        }
    }

    async handleSearchInput(value) {
        if (value.length < 3) {
            this.hideSuggestions();
            return;
        }

        try {
            const suggestions = await this.fetchLocationSuggestions(value);
            this.showSuggestions(suggestions);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    }

    async fetchLocationSuggestions(query) {
        const url = `${WEATHER_CONFIG.GEOCODING_URL}${WEATHER_CONFIG.ENDPOINTS.DIRECT_GEOCODING}?q=${encodeURIComponent(query)}&limit=5&appid=${WEATHER_CONFIG.API_KEY}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        
        return await response.json();
    }

    showSuggestions(suggestions) {
        const container = document.getElementById('search-suggestions');
        container.innerHTML = '';

        if (suggestions.length === 0) {
            container.innerHTML = '<div class="suggestion-item">No locations found</div>';
        } else {
            suggestions.forEach(location => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = `${location.name}, ${location.country}${location.state ? `, ${location.state}` : ''}`;
                item.addEventListener('click', () => {
                    this.selectLocation(location);
                });
                container.appendChild(item);
            });
        }

        container.classList.remove('hidden');
    }

    hideSuggestions() {
        document.getElementById('search-suggestions').classList.add('hidden');
    }

    async selectLocation(location) {
        document.getElementById('location-input').value = `${location.name}, ${location.country}`;
        this.hideSuggestions();
        this.currentLocation = { lat: location.lat, lon: location.lon };
        await this.fetchWeatherData(location.lat, location.lon);
    }

    async searchLocation(query) {
        try {
            this.showLoading(true);
            const suggestions = await this.fetchLocationSuggestions(query);
            
            if (suggestions.length > 0) {
                await this.selectLocation(suggestions[0]);
            } else {
                this.showError('Location not found. Please try a different search.');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Error searching for location. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async fetchWeatherData(lat, lon) {
        try {
            // Fetch current weather
            const currentUrl = `${WEATHER_CONFIG.BASE_URL}${WEATHER_CONFIG.ENDPOINTS.CURRENT}?lat=${lat}&lon=${lon}&units=${this.units}&appid=${WEATHER_CONFIG.API_KEY}`;
            const currentResponse = await fetch(currentUrl);
            
            if (!currentResponse.ok) {
                throw new Error(`HTTP error! status: ${currentResponse.status}`);
            }
            
            this.currentWeatherData = await currentResponse.json();

            // Fetch 5-day forecast
            const forecastUrl = `${WEATHER_CONFIG.BASE_URL}${WEATHER_CONFIG.ENDPOINTS.FORECAST}?lat=${lat}&lon=${lon}&units=${this.units}&appid=${WEATHER_CONFIG.API_KEY}`;
            const forecastResponse = await fetch(forecastUrl);
            
            if (!forecastResponse.ok) {
                throw new Error(`HTTP error! status: ${forecastResponse.status}`);
            }
            
            this.forecastData = await forecastResponse.json();

            // Update UI
            this.updateCurrentWeather();
            this.updateHourlyForecast();
            this.updateDailyForecast();
            this.updateWeatherChart();
            this.updateWeatherMap();

        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.showError('Failed to fetch weather data. Please check your API key and try again.');
        }
    }

    updateCurrentWeather() {
        if (!this.currentWeatherData) return;

        const data = this.currentWeatherData;
        
        // Location and date
        document.getElementById('current-location').textContent = 
            `${data.name}, ${data.sys.country}`;
        
        // Temperature
        document.getElementById('current-temp').textContent = 
            Math.round(data.main.temp);
        
        // Weather icon and description
        const iconCode = data.weather[0].icon;
        const iconElement = document.getElementById('current-icon');
        iconElement.className = WEATHER_ICONS[iconCode] || 'fas fa-sun';
        
        document.getElementById('current-description').textContent = 
            data.weather[0].description;

        // Weather details
        document.getElementById('visibility').textContent = 
            `${(data.visibility / 1000).toFixed(1)} km`;
        document.getElementById('humidity').textContent = 
            `${data.main.humidity}%`;
        document.getElementById('wind-speed').textContent = 
            `${data.wind.speed} ${this.units === 'metric' ? 'm/s' : 'mph'}`;
        document.getElementById('feels-like').textContent = 
            `${Math.round(data.main.feels_like)}°`;
        document.getElementById('pressure').textContent = 
            `${data.main.pressure} hPa`;
        
        // UV Index (if available)
        document.getElementById('uv-index').textContent = '--';

        // Update background based on weather
        this.updateBackgroundTheme(data.weather[0].main);
    }

    updateHourlyForecast() {
        if (!this.forecastData) return;

        const container = document.getElementById('hourly-container');
        container.innerHTML = '';

        // Take first 8 forecast items (24 hours)
        const hourlyData = this.forecastData.list.slice(0, 8);

        hourlyData.forEach(item => {
            const hourlyItem = document.createElement('div');
            hourlyItem.className = 'hourly-item fade-in';
            
            const time = new Date(item.dt * 1000);
            const iconCode = item.weather[0].icon;
            
            hourlyItem.innerHTML = `
                <div class="hourly-time">${time.getHours()}:00</div>
                <div class="hourly-icon">
                    <i class="${WEATHER_ICONS[iconCode] || 'fas fa-sun'}"></i>
                </div>
                <div class="hourly-temp">${Math.round(item.main.temp)}°</div>
            `;
            
            container.appendChild(hourlyItem);
        });
    }

    updateDailyForecast() {
        if (!this.forecastData) return;

        const container = document.getElementById('forecast-container');
        container.innerHTML = '';

        // Group forecast data by day
        const dailyData = this.groupForecastByDay(this.forecastData.list);

        dailyData.slice(0, 5).forEach((day, index) => {
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item fade-in';
            
            const date = new Date(day.dt * 1000);
            const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en', { weekday: 'short' });
            const iconCode = day.weather[0].icon;
            
            forecastItem.innerHTML = `
                <div class="forecast-header">
                    <div class="forecast-day">${dayName}</div>
                    <div class="forecast-date">${date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>
                </div>
                <div class="forecast-main">
                    <div class="forecast-icon">
                        <i class="${WEATHER_ICONS[iconCode] || 'fas fa-sun'}"></i>
                    </div>
                    <div class="forecast-temps">
                        <div class="forecast-high">${Math.round(day.main.temp_max)}°</div>
                        <div class="forecast-low">${Math.round(day.main.temp_min)}°</div>
                    </div>
                </div>
                <div class="forecast-description">${day.weather[0].description}</div>
            `;
            
            container.appendChild(forecastItem);
        });
    }

    groupForecastByDay(forecastList) {
        const grouped = {};
        
        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();
            
            if (!grouped[dayKey]) {
                grouped[dayKey] = {
                    ...item,
                    main: {
                        ...item.main,
                        temp_max: item.main.temp_max,
                        temp_min: item.main.temp_min
                    }
                };
            } else {
                grouped[dayKey].main.temp_max = Math.max(grouped[dayKey].main.temp_max, item.main.temp_max);
                grouped[dayKey].main.temp_min = Math.min(grouped[dayKey].main.temp_min, item.main.temp_min);
            }
        });
        
        return Object.values(grouped);
    }

    updateWeatherChart() {
        if (!this.forecastData) return;

        const ctx = document.getElementById('weather-chart').getContext('2d');
        
        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        const hourlyData = this.forecastData.list.slice(0, 12);
        const labels = hourlyData.map(item => {
            const date = new Date(item.dt * 1000);
            return date.getHours() + ':00';
        });
        const temperatures = hourlyData.map(item => Math.round(item.main.temp));
        const humidity = hourlyData.map(item => item.main.humidity);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `Temperature (°${this.units === 'metric' ? 'C' : 'F'})`,
                    data: temperatures,
                    borderColor: '#74b9ff',
                    backgroundColor: 'rgba(116, 185, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Humidity (%)',
                    data: humidity,
                    borderColor: '#fdcb6e',
                    backgroundColor: 'rgba(253, 203, 110, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: '12-Hour Weather Trend'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                        },
                    },
                }
            }
        });
    }

    updateWeatherMap() {
        if (!this.currentLocation.lat || !this.currentLocation.lon) return;

        const mapContainer = document.getElementById('weather-map');
        
        // Initialize map if not exists
        if (!this.map) {
            this.map = L.map('weather-map').setView([this.currentLocation.lat, this.currentLocation.lon], 10);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);
        } else {
            // Update map center
            this.map.setView([this.currentLocation.lat, this.currentLocation.lon], 10);
        }

        // Add weather layer
        this.switchMapLayer(this.currentMapLayer);

        // Add marker for current location
        if (this.currentLocationMarker) {
            this.map.removeLayer(this.currentLocationMarker);
        }
        
        this.currentLocationMarker = L.marker([this.currentLocation.lat, this.currentLocation.lon])
            .addTo(this.map)
            .bindPopup(`Current Location<br>${this.currentWeatherData?.name || 'Unknown'}`);
    }

    switchMapLayer(layerType) {
        if (!this.map) return;

        // Remove existing weather layer
        if (this.currentWeatherLayer) {
            this.map.removeLayer(this.currentWeatherLayer);
        }

        // Add new weather layer
        const layerName = WEATHER_CONFIG.MAP_LAYERS[layerType];
        if (layerName) {
            this.currentWeatherLayer = L.tileLayer(
                `${WEATHER_CONFIG.MAP_URL}/${layerName}/{z}/{x}/{y}.png?appid=${WEATHER_CONFIG.API_KEY}`,
                {
                    attribution: '© OpenWeatherMap',
                    opacity: 0.6
                }
            ).addTo(this.map);
        }

        // Update button states
        document.querySelectorAll('.map-layer-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-layer="${layerType}"]`).classList.add('active');
        
        this.currentMapLayer = layerType;
    }

    toggleUnits() {
        this.units = this.units === 'metric' ? 'imperial' : 'metric';
        localStorage.setItem('weatherUnits', this.units);
        this.updateUnitDisplay();
        
        // Refresh data with new units
        if (this.currentLocation.lat && this.currentLocation.lon) {
            this.fetchWeatherData(this.currentLocation.lat, this.currentLocation.lon);
        }
    }

    updateUnitDisplay() {
        const unitSymbol = this.units === 'metric' ? '°C' : '°F';
        document.getElementById('unit-display').textContent = unitSymbol;
        
        // Update temperature unit display
        document.querySelectorAll('.temp-unit').forEach(el => {
            el.textContent = unitSymbol.charAt(1);
        });
    }

    async refreshData() {
        const refreshBtn = document.getElementById('refresh-btn');
        refreshBtn.style.animation = 'spin 1s linear infinite';
        
        if (this.currentLocation.lat && this.currentLocation.lon) {
            await this.fetchWeatherData(this.currentLocation.lat, this.currentLocation.lon);
        }
        
        refreshBtn.style.animation = '';
    }

    addToFavorites() {
        if (!this.currentWeatherData) return;

        const location = {
            name: this.currentWeatherData.name,
            country: this.currentWeatherData.sys.country,
            lat: this.currentLocation.lat,
            lon: this.currentLocation.lon,
            id: `${this.currentLocation.lat}_${this.currentLocation.lon}`
        };

        // Check if already in favorites
        const exists = this.favorites.some(fav => fav.id === location.id);
        if (exists) {
            this.showError('Location is already in favorites!');
            return;
        }

        this.favorites.push(location);
        localStorage.setItem('weatherFavorites', JSON.stringify(this.favorites));
        this.renderFavorites();
        this.showSuccess('Location added to favorites!');
    }

    removeFavorite(id) {
        this.favorites = this.favorites.filter(fav => fav.id !== id);
        localStorage.setItem('weatherFavorites', JSON.stringify(this.favorites));
        this.renderFavorites();
    }

    async renderFavorites() {
        const container = document.getElementById('favorites-container');
        
        if (this.favorites.length === 0) {
            container.innerHTML = '<p class="no-favorites">No favorite locations yet. Add some to quickly check their weather!</p>';
            return;
        }

        container.innerHTML = '';

        for (const favorite of this.favorites) {
            try {
                // Fetch current weather for favorite
                const url = `${WEATHER_CONFIG.BASE_URL}${WEATHER_CONFIG.ENDPOINTS.CURRENT}?lat=${favorite.lat}&lon=${favorite.lon}&units=${this.units}&appid=${WEATHER_CONFIG.API_KEY}`;
                const response = await fetch(url);
                const data = await response.json();

                const favoriteItem = document.createElement('div');
                favoriteItem.className = 'favorite-item fade-in';
                favoriteItem.innerHTML = `
                    <button class="remove-favorite" onclick="weatherDashboard.removeFavorite('${favorite.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="favorite-location">${favorite.name}, ${favorite.country}</div>
                    <div class="favorite-temp">${Math.round(data.main.temp)}°${this.units === 'metric' ? 'C' : 'F'}</div>
                    <div class="favorite-description">${data.weather[0].description}</div>
                `;

                favoriteItem.addEventListener('click', () => {
                    this.currentLocation = { lat: favorite.lat, lon: favorite.lon };
                    this.fetchWeatherData(favorite.lat, favorite.lon);
                    document.getElementById('location-input').value = `${favorite.name}, ${favorite.country}`;
                });

                container.appendChild(favoriteItem);
            } catch (error) {
                console.error('Error fetching favorite weather:', error);
            }
        }
    }

    async updateFavoritesWeather() {
        if (this.favorites.length > 0) {
            await this.renderFavorites();
        }
    }

    updateBackgroundTheme(weatherMain) {
        const body = document.body;
        const themes = {
            'Clear': 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
            'Clouds': 'linear-gradient(135deg, #636e72 0%, #2d3436 100%)',
            'Rain': 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
            'Drizzle': 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
            'Thunderstorm': 'linear-gradient(135deg, #2d3436 0%, #636e72 100%)',
            'Snow': 'linear-gradient(135deg, #ddd 0%, #74b9ff 100%)',
            'Mist': 'linear-gradient(135deg, #636e72 0%, #74b9ff 100%)',
            'Fog': 'linear-gradient(135deg, #636e72 0%, #74b9ff 100%)'
        };

        body.style.background = themes[weatherMain] || themes['Clear'];
    }

    updateDateTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
    }

    showLoading(show) {
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');
        
        if (show) {
            loadingScreen.classList.remove('hidden');
            app.classList.add('hidden');
        } else {
            loadingScreen.classList.add('hidden');
            app.classList.remove('hidden');
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;

        const colors = {
            error: '#e17055',
            success: '#00b894',
            info: '#74b9ff'
        };

        notification.style.background = colors[type] || colors.info;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.style.transform = 'translateX(0)', 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Utility function for debouncing
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize the weather dashboard when the page loads
let weatherDashboard;

document.addEventListener('DOMContentLoaded', () => {
    // Check if API key is set
    if (WEATHER_CONFIG.API_KEY === 'YOUR_API_KEY_HERE') {
        document.getElementById('loading-screen').innerHTML = `
            <div style="text-align: center; color: white; padding: 2rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; color: #f39c12;"></i>
                <h2>API Key Required</h2>
                <p style="margin-bottom: 1rem;">Please get your free API key from OpenWeatherMap and update the config file.</p>
                <a href="https://openweathermap.org/api" target="_blank" style="color: #74b9ff; text-decoration: underline;">Get API Key</a>
                <p style="margin-top: 1rem; font-size: 0.9rem;">Update the API_KEY in weather-config.js</p>
            </div>
        `;
        return;
    }

    weatherDashboard = new WeatherDashboard();
});

// Handle window resize for map
window.addEventListener('resize', () => {
    if (weatherDashboard && weatherDashboard.map) {
        setTimeout(() => {
            weatherDashboard.map.invalidateSize();
        }, 100);
    }
});
