// Connection management for the application
(function() {
    // Global connection configuration
    window.AppConnection = {
        // Base URL detection - use deployed URL or fallback
        baseURL: window.location.origin,
        
        // API endpoints
        endpoints: {
            health: '/health',
            status: '/api/status',
            login: '/api/login',
            signup: '/api/signup'
        },
        
        // Connection status
        isConnected: false,
        
        // Initialize connection
        init: async function() {
            console.log('Initializing connection to:', this.baseURL);
            try {
                await this.checkHealth();
                return true;
            } catch (error) {
                console.error('Connection initialization failed:', error);
                this.showConnectionError();
                return false;
            }
        },
        
        // Simple health check
        checkHealth: async function() {
            try {
                const response = await fetch(`${this.baseURL}${this.endpoints.health}`);
                if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
                this.isConnected = true;
                console.log('Server health check: OK');
                return true;
            } catch (error) {
                this.isConnected = false;
                console.error('Health check failed:', error);
                throw error;
            }
        },
        
        // API request helper
        request: async function(endpoint, options = {}) {
            const url = `${this.baseURL}${endpoint}`;
            console.log(`API request to: ${url}`);
            
            try {
                // Add timeout to prevent hanging requests
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                let data;
                try {
                    data = await response.json();
                } catch (e) {
                    console.error('Error parsing response:', e);
                    throw new Error('Invalid server response');
                }
                
                if (!response.ok) {
                    throw new Error(data.error || data.message || `Request failed: ${response.status}`);
                }
                
                return data;
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.error(`Request timeout for ${endpoint}`);
                    throw new Error('Request timed out. Server may be unavailable.');
                }
                
                if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                    console.error(`Network error for ${endpoint}`);
                    throw new Error('Network error. Please check your connection.');
                }
                
                console.error(`API error (${endpoint}):`, error);
                throw error;
            }
        },
        
        // Show connection error message
        showConnectionError: function() {
            const errorDiv = document.createElement('div');
            errorDiv.style.position = 'fixed';
            errorDiv.style.top = '0';
            errorDiv.style.left = '0';
            errorDiv.style.right = '0';
            errorDiv.style.padding = '10px';
            errorDiv.style.backgroundColor = '#f8d7da';
            errorDiv.style.color = '#721c24';
            errorDiv.style.textAlign = 'center';
            errorDiv.style.zIndex = '9999';
            errorDiv.textContent = 'Unable to connect to server. Please check your internet connection.';
            
            document.body.prepend(errorDiv);
        }
    };
    
    // Initialize connection when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        window.AppConnection.init();
    });
})(); 
