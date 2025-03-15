// Configuration values for the application
window.APP_CONFIG = {
  // API URL configuration with CORS proxy for temporary workaround
  API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'  // Local development
    : 'https://cors-anywhere.herokuapp.com/https://newfinalcodersmeet.vercel.app/api'  // With CORS proxy
}; 