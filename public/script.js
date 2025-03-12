// Form validation function
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;

    const email = form.querySelector('input[type="email"]');
    const password = form.querySelector('input[type="password"]');
    
    if (!email || !password) return false;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        alert('Please enter a valid email address');
        return false;
    }
    
    // Password validation
    if (password.value.length < 6) {
        alert('Password must be at least 6 characters long');
        return false;
    }
    
    return true;
}

// Mobile menu functionality
function toggleMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const hamburger = document.querySelector('.hamburger');
    
    if (mobileMenu && hamburger) {
        mobileMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    }
}

// Initialize mobile menu
document.addEventListener('DOMContentLoaded', function() {
    // Remove this code block that adds the hamburger button
    /*
    const nav = document.querySelector('nav');
    if (nav) {
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger';
        hamburger.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        hamburger.addEventListener('click', toggleMobileMenu);
        nav.appendChild(hamburger);

        // Create mobile menu
        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        const links = document.querySelector('.links');
        if (links) {
            mobileMenu.innerHTML = links.innerHTML;
            nav.appendChild(mobileMenu);
        }
    }
    */
});

// Theme toggle functionality
function toggleTheme() {
    const body = document.body;
    const themeBtn = document.getElementById('theme-btn');
    const themeBtnMobile = document.getElementById('theme-btn-mobile');
    
    body.classList.toggle('dark-theme');
    
    if (body.classList.contains('dark-theme')) {
        if (themeBtn) themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
        if (themeBtnMobile) themeBtnMobile.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        if (themeBtn) themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
        if (themeBtnMobile) themeBtnMobile.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
}

// Load saved theme
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const themeBtn = document.getElementById('theme-btn');
        const themeBtnMobile = document.getElementById('theme-btn-mobile');
        if (themeBtn) themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
        if (themeBtnMobile) themeBtnMobile.innerHTML = '<i class="fas fa-moon"></i>';
    }
});

// Page load animations
window.onload = async () => {
    try {
        // Check if user is already logged in
        const user = localStorage.getItem('user');
        if (user && window.location.pathname.includes('login.html')) {
            window.location.href = 'dashboard.html';
            return;
        }

        // Check server connection
        const isConnected = await checkServerConnection();
        if (!isConnected) {
            alert('Unable to connect to server. Please make sure the server is running.');
            return;
        }

        // Fade in effect
        document.body.style.opacity = 0;
        let opacity = 0;
        const fadeIn = setInterval(() => {
            opacity += 0.1;
            document.body.style.opacity = opacity;
            if(opacity >= 1) clearInterval(fadeIn);
        }, 100);

        // Slide in login form
        const loginContent = document.querySelector('.login-content');
        if(loginContent) {
            loginContent.style.transform = 'translateY(50px)';
            loginContent.style.opacity = '0';
            setTimeout(() => {
                loginContent.style.transform = 'translateY(0)';
                loginContent.style.opacity = '1';
                loginContent.style.transition = 'all 0.5s ease-out';
            }, 200);
        }

        // Initialize about section animations
        const aboutSection = document.querySelector('#about');
        if (aboutSection) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = "1";
                        entry.target.style.transform = "translateY(0)";
                    }
                });
            }, { threshold: 0.1 });

            const animatedElements = aboutSection.querySelectorAll('.about-content, .about-stats, .about-features');
            animatedElements.forEach(el => {
                el.style.opacity = "0";
                el.style.transform = "translateY(50px)";
                el.style.transition = "all 0.8s ease-out";
                observer.observe(el);
            });
        }
        
        // Adjust signup form layout
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            // Ensure username and password fields are on separate lines
            const formRows = signupForm.querySelectorAll('.form-row');
            formRows.forEach(row => {
                const formGroups = row.querySelectorAll('.form-group');
                if (formGroups.length > 1) {
                    // Create a new row for each form group to ensure they're on separate lines
                    formGroups.forEach((group, index) => {
                        if (index > 0) {
                            const newRow = document.createElement('div');
                            newRow.className = 'form-row';
                            row.parentNode.insertBefore(newRow, row.nextSibling);
                            newRow.appendChild(group);
                        }
                    });
                }
            });
            
            // Add some spacing between form elements
            const style = document.createElement('style');
            style.textContent = `
                .form-row {
                    margin-bottom: 15px;
                }
                .form-group {
                    margin-bottom: 10px;
                }
                #usernameAvailability {
                    margin-top: 3px;
                    margin-bottom: 5px;
                }
                .signup-container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 15px;
                }
                .form-group input {
                    padding: 8px;
                }
                .signup-btn {
                    padding: 8px 20px;
                    font-size: 1em;
                }
            `;
            document.head.appendChild(style);
            
            // Fix full name input to ensure it doesn't touch the header
            const fullNameInput = document.getElementById('fullName');
            if (fullNameInput) {
                const fullNameGroup = fullNameInput.closest('.form-group');
                if (fullNameGroup) {
                    fullNameGroup.style.marginTop = '15px';
                }
            }
        }
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Error initializing application. Please refresh the page.');
    }
};

// API configuration
const API_CONFIG = {
    baseURL: window.location.origin,
    headers: {
        'Content-Type': 'application/json'
    }
};

// API helper function
async function fetchAPI(endpoint, options = {}) {
    try {
        const url = `${API_CONFIG.baseURL}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                ...API_CONFIG.headers,
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

// Server connection check
async function checkServerConnection() {
    try {
        console.log('Checking server connection...');
        const data = await fetchAPI('/api/status');
        console.log('Server status:', data);
        return data.status === 'ok';
    } catch (error) {
        console.error('Server connection failed:', error);
        return false;
    }
}

// Login function
async function login(event) {
    event.preventDefault();
    const loginBtn = document.querySelector('button[type="submit"]');
    
    try {
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
        
        const isConnected = await checkServerConnection();
        if (!isConnected) {
            throw new Error('Unable to connect to server');
        }

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        
        const data = await fetchAPI('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = 'dashboard.html';
    } catch (error) {
        loginBtn.innerHTML = 'Login';
        alert(error.message || 'Login failed');
    }
}

// Update the username availability check function
async function checkUsernameAvailability() {
    const usernameInput = document.getElementById('username');
    const username = usernameInput.value.trim();
    const availabilityMessage = document.getElementById('usernameAvailability');
    
    // Reset message
    availabilityMessage.textContent = '';
    availabilityMessage.className = '';
    
    // Basic validation
    if (!username) {
        return;
    }
    
    if (username.length < 3 || username.length > 20) {
        availabilityMessage.textContent = 'Username must be between 3 and 20 characters';
        availabilityMessage.className = 'error-message';
        return;
    }
    
    // Check if username contains only allowed characters
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
        availabilityMessage.textContent = 'Username can only contain letters, numbers, and underscores';
        availabilityMessage.className = 'error-message';
        return;
    }
    
    try {
        availabilityMessage.textContent = 'Checking...';
        
        const response = await fetch(`${API_CONFIG.baseURL}/check-username`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.available) {
                availabilityMessage.textContent = 'Username is available';
                availabilityMessage.className = 'success-message';
                usernameInput.dataset.available = 'true';
            } else {
                availabilityMessage.textContent = 'Username is already taken';
                availabilityMessage.className = 'error-message';
                usernameInput.dataset.available = 'false';
            }
        } else {
            throw new Error(data.error || 'Failed to check username');
        }
    } catch (error) {
        console.error('Username check error:', error);
        availabilityMessage.textContent = 'Error checking username';
        availabilityMessage.className = 'error-message';
        usernameInput.dataset.available = 'false';
    }
}

// Add signup function with better error handling
async function handleSignup(event) {
    event.preventDefault();
    
    if (!validateForm('signupForm')) return;

    const fullName = document.getElementById('fullName').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const signupBtn = document.querySelector('.signup-btn');
    
    try {
        // Check server connection first
        const isConnected = await checkServerConnection();
        if (!isConnected) {
            throw new Error('Unable to connect to server. Please try again later.');
        }

        if (password !== confirmPassword) {
            throw new Error('Passwords do not match!');
        }
        
        signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        const response = await fetch(`${API_CONFIG.baseURL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fullName,
                username,
                email,
                password
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }
        
        signupBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
        alert('Registration successful! Please login.');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Signup error:', error);
        signupBtn.innerHTML = 'Sign Up';
        alert(error.message || 'Registration failed. Please try again.');
    }
}

// Function to logout
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error signing out');
    }
}

// Google Sign-in
async function handleGoogleLogin() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google'
        });
        
        if (error) throw error;
        
        // The redirect happens automatically
    } catch (error) {
        console.error('Google login error:', error);
        alert(error.message || 'Google login failed');
    }
}

// Add floating label effect
const inputs = document.querySelectorAll('.form-group input');
inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
        if(!this.value) {
            this.parentElement.classList.remove('focused');
        }
    });
});

// Add loading animation to login/signup button
const loginBtn = document.querySelector('.login-btn');
if(loginBtn) {
    loginBtn.addEventListener('click', function(e) {
        if(validateForm(e)) {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            handleLogin(e);
        }
    });
}

// Social login hover effects
const socialIcons = document.querySelectorAll('.social-icons a');
socialIcons.forEach(icon => {
    icon.addEventListener('mouseover', function() {
        this.style.transform = 'translateY(-5px) scale(1.2)';
    });
    
    icon.addEventListener('mouseout', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Add styles for mobile menu
const style = document.createElement('style');
style.textContent = `
    /* Remove the hamburger button styles */
    /*
    .hamburger {
        display: none;
        background: none;
        border: none;
        cursor: pointer;
        padding: 10px;
        z-index: 1000;
    }

    .hamburger span {
        display: block;
        width: 25px;
        height: 3px;
        background-color: #333;
        margin: 5px 0;
        transition: 0.3s;
    }
    */
    
    /* Keep other necessary styles... */
`;

document.head.appendChild(style);

// Rearrange signup form on page load
document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        // Ensure username field has proper layout
        const usernameGroup = document.querySelector('.form-group:has(#username)');
        if (usernameGroup) {
            // Create a container for username input and check button
            const usernameInput = document.getElementById('username');
            const checkButton = document.getElementById('checkUsernameBtn');
            
            if (usernameInput && checkButton) {
                const container = document.createElement('div');
                container.className = 'username-container';
                
                // Rearrange the elements
                usernameInput.parentNode.insertBefore(container, usernameInput);
                container.appendChild(usernameInput);
                container.appendChild(checkButton);
            }
        }
        
        // Add event listener for username check button
        const checkUsernameBtn = document.getElementById('checkUsernameBtn');
        if (checkUsernameBtn) {
            checkUsernameBtn.addEventListener('click', checkUsernameAvailability);
        }
        
        // Add event listener for username input to reset availability status
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.addEventListener('input', function() {
                this.dataset.available = 'false';
                const availabilityDiv = document.getElementById('usernameAvailability');
                if (availabilityDiv) {
                    availabilityDiv.textContent = '';
                    availabilityDiv.className = '';
                }
            });
        }
        
        // Add event listener for form submission
        signupForm.addEventListener('submit', handleSignup);
    }
});

// Update the signup form layout styles
const signupStyles = `
    .signup-container {
        max-width: 400px;
        margin: 0 auto;
        padding: 15px;
    }

    .form-row {
        display: flex;
        flex-direction: row !important;
        gap: 15px;
        margin-bottom: 15px;
        flex-wrap: wrap;
    }

    .form-group {
        flex: 1;
        min-width: 200px;
        margin-bottom: 10px;
    }

    /* Username container specific styles */
    .username-container {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
    }

    /* Input fields */
    .form-group input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    /* Check username button */
    #checkUsernameBtn {
        padding: 8px 12px;
        white-space: nowrap;
        height: fit-content;
        margin-top: 20px;
    }

    /* Availability message */
    #usernameAvailability {
        width: 100%;
        margin-top: 3px;
        font-size: 0.85em;
    }

    /* Submit button container */
    .submit-container {
        display: flex;
        justify-content: flex-end;
        margin-top: 15px;
    }

    .signup-btn {
        padding: 8px 20px;
        font-size: 0.95em;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
        .form-row {
            flex-direction: column !important;
            gap: 8px;
        }

        .form-group {
            width: 100%;
        }
        
        .signup-container {
            max-width: 300px;
            padding: 10px;
        }
    }
`;

// Add the styles to the document
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = signupStyles;
    document.head.appendChild(style);

    // Rearrange signup form layout
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        // Group form fields into rows
        const formGroups = signupForm.querySelectorAll('.form-group');
        const rows = [
            ['fullName', 'email'],
            ['username', 'password'],
            ['confirmPassword']
        ];

        // Clear existing form structure
        const formContent = signupForm.innerHTML;
        signupForm.innerHTML = '';

        // Create new structured rows
        rows.forEach(rowFields => {
            const row = document.createElement('div');
            row.className = 'form-row';
            
            rowFields.forEach(fieldId => {
                const group = Array.from(formGroups).find(g => 
                    g.querySelector(`#${fieldId}`)
                );
                if (group) {
                    row.appendChild(group.cloneNode(true));
                }
            });

            signupForm.appendChild(row);
        });

        // Add submit button in its own row
        const submitRow = document.createElement('div');
        submitRow.className = 'submit-container';
        submitRow.innerHTML = '<button type="submit" class="signup-btn">Sign Up</button>';
        signupForm.appendChild(submitRow);

        // Reattach event listeners
        const usernameInput = signupForm.querySelector('#username');
        if (usernameInput) {
            usernameInput.addEventListener('input', function() {
                this.dataset.available = 'false';
                const availabilityDiv = document.getElementById('usernameAvailability');
                if (availabilityDiv) {
                    availabilityDiv.textContent = '';
                    availabilityDiv.className = '';
                }
            });
        }

        // Add check username button functionality
        const checkUsernameBtn = signupForm.querySelector('#checkUsernameBtn');
        if (checkUsernameBtn) {
            checkUsernameBtn.addEventListener('click', checkUsernameAvailability);
        }

        // Add form submission handler
        signupForm.addEventListener('submit', handleSignup);
    }
});

// Typewriter effect
document.addEventListener('DOMContentLoaded', function() {
    const typewriterText = document.querySelector('.typewriter-text');
    if (typewriterText) {
        const phrases = ['CodersMEET', 'Innovation', 'Collaboration', 'Community'];
        let currentPhraseIndex = 0;
        let currentCharIndex = 0;
        let isDeleting = false;
        let typingSpeed = 100;

        function typeEffect() {
            const currentPhrase = phrases[currentPhraseIndex];
            
            if (isDeleting) {
                typewriterText.textContent = currentPhrase.substring(0, currentCharIndex - 1);
                currentCharIndex--;
                typingSpeed = 50;
            } else {
                typewriterText.textContent = currentPhrase.substring(0, currentCharIndex + 1);
                currentCharIndex++;
                typingSpeed = 100;
            }
            
            if (!isDeleting && currentCharIndex === currentPhrase.length) {
                isDeleting = true;
                typingSpeed = 1000; // Pause at the end
            } else if (isDeleting && currentCharIndex === 0) {
                isDeleting = false;
                currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
                typingSpeed = 500; // Pause before typing next phrase
            }
            
            setTimeout(typeEffect, typingSpeed);
        }
        
        typeEffect();
    }
});

// Update the hamburg function
function hamburg() {
    const dropdown = document.querySelector('.dropdown');
    dropdown.classList.add('active');
}

// Update the cancel function
function cancel() {
    const dropdown = document.querySelector('.dropdown');
    dropdown.classList.remove('active');
}

// Add these functions after other functions
let isEmailVerified = false;

async function sendOTP() {
    const email = document.getElementById('email').value.trim();
    const verifyBtn = document.getElementById('verifyEmailBtn');
    const statusDiv = document.getElementById('emailVerificationStatus');
    
    try {
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = 'Sending...';
        
        const response = await fetch(`${API_CONFIG.baseURL}/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('otpModal').style.display = 'flex';
            document.getElementById('resendOtpBtn').style.display = 'block';
            statusDiv.innerHTML = '<span style="color: green;">OTP sent! Please check your email.</span>';
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        statusDiv.innerHTML = `<span style="color: red;">${error.message}</span>`;
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = 'Verify Email';
    }
}

async function verifyOTP() {
    const email = document.getElementById('email').value.trim();
    const otp = document.getElementById('otpInput').value.trim();
    const messageDiv = document.getElementById('otpMessage');
    const statusDiv = document.getElementById('emailVerificationStatus');
    
    try {
        const response = await fetch(`${API_CONFIG.baseURL}/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, otp })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            isEmailVerified = true;
            document.getElementById('otpModal').style.display = 'none';
            statusDiv.innerHTML = '<span style="color: green;">✓ Email verified!</span>';
            document.getElementById('verifyEmailBtn').disabled = true;
            document.getElementById('email').readOnly = true;
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">${error.message}</span>`;
    }
}

// Update the handleSignup function to check for email verification
async function handleSignup(event) {
    event.preventDefault();
    
    if (!isEmailVerified) {
        alert('Please verify your email first');
        return;
    }
    
    if (!validateForm('signupForm')) return;

    const fullName = document.getElementById('fullName').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const signupBtn = document.querySelector('.signup-btn');
    
    try {
        // Check server connection first
        const isConnected = await checkServerConnection();
        if (!isConnected) {
            throw new Error('Unable to connect to server. Please try again later.');
        }

        if (password !== confirmPassword) {
            throw new Error('Passwords do not match!');
        }
        
        signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        const response = await fetch(`${API_CONFIG.baseURL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fullName,
                username,
                email,
                password
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }
        
        signupBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
        alert('Registration successful! Please login.');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Signup error:', error);
        signupBtn.innerHTML = 'Sign Up';
        alert(error.message || 'Registration failed. Please try again.');
    }
}

// Add event listeners when the document loads
document.addEventListener('DOMContentLoaded', function() {
    const verifyEmailBtn = document.getElementById('verifyEmailBtn');
    const submitOtpBtn = document.getElementById('submitOtpBtn');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    
    if (verifyEmailBtn) {
        verifyEmailBtn.addEventListener('click', sendOTP);
    }
    
    if (submitOtpBtn) {
        submitOtpBtn.addEventListener('click', verifyOTP);
    }
    
    if (resendOtpBtn) {
        resendOtpBtn.addEventListener('click', sendOTP);
    }
});
