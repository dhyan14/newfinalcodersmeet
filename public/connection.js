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
            if (!this.isConnected) {
                try {
                    await this.checkHealth();
                } catch (error) {
                    throw new Error('Not connected to server');
                }
            }
            
            const url = `${this.baseURL}${endpoint}`;
            console.log(`API request to: ${url}`);
            
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
                    throw new Error(data.error || data.message || `Request failed: ${response.status}`);
                }
                
                return data;
            } catch (error) {
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
