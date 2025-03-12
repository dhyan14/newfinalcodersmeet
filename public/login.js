// Login page specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Check server connection on page load
    checkServerConnection()
        .then(connected => {
            if (!connected) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-warning';
                errorDiv.textContent = 'Server connection issue. Some features may not work.';
                document.body.insertBefore(errorDiv, document.body.firstChild);
            }
        });
});

// Simple server connection check
async function checkServerConnection() {
    try {
        const response = await fetch(`${window.location.origin}/health`);
        return response.ok;
    } catch (error) {
        console.error('Server health check failed:', error);
        return false;
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.querySelector('button[type="submit"]');
    const errorDiv = document.getElementById('loginError') || createErrorDiv();
    
    if (!email || !password) {
        errorDiv.textContent = 'Please enter both email and password';
        return;
    }
    
    try {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        errorDiv.textContent = '';
        
        const response = await fetch(`${window.location.origin}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = 'dashboard.html';
    } catch (error) {
        errorDiv.textContent = error.message || 'Login failed';
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Login';
    }
}

// Create error message div
function createErrorDiv() {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'loginError';
    errorDiv.style.color = 'red';
    errorDiv.style.marginTop = '10px';
    errorDiv.style.textAlign = 'center';
    
    const form = document.querySelector('form');
    form.appendChild(errorDiv);
    
    return errorDiv;
} 
