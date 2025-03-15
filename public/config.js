// Configuration values for the application
window.APP_CONFIG = {
  // API URL configuration
  API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'  // Local development
    : 'https://api.dhyanjain.me'  // Production API URL
}; 