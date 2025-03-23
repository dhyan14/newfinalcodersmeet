// Create this new file
const config = {
  apiBaseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://your-api-domain.com'
    : '',
  socketUrl: process.env.NODE_ENV === 'production'
    ? 'https://your-api-domain.com'
    : window.location.origin
};

// Add a helper for API calls
const api = {
  async fetch(endpoint, options = {}) {
    const url = `${config.apiBaseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }
}; 