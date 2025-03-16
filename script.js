// Theme toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const themeCheckboxes = document.querySelectorAll('.theme-switch__checkbox');
        themeCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    }
    
    // Add event listeners to all theme switches
    const themeSwitches = document.querySelectorAll('.theme-switch__checkbox');
    themeSwitches.forEach(themeSwitch => {
        themeSwitch.addEventListener('change', function() {
            const body = document.body;
            body.classList.toggle('dark-theme');
            
            // Keep all switches in sync
            const isChecked = this.checked;
            themeSwitches.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
            
            // Save theme preference
            localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
        });
    });
    
    // Fix for hamburger button
    const hamburgerButtons = document.querySelectorAll('.hamburg, .hamburger-button');
    hamburgerButtons.forEach(button => {
        button.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.toggle('sidebar-active');
            }
            
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu) {
                navMenu.classList.toggle('active');
            }
            
            const dropdown = document.querySelector('.dropdown');
            if (dropdown) {
                dropdown.classList.toggle('active');
            }
        });
    });
    
    // Logout functionality
    const logoutButtons = document.querySelectorAll('#logoutBtn, [onclick="logout()"]');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    });
});

// Logout function for direct calls
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Function to toggle mobile menu
function hamburg() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('sidebar-active');
    }
    
    const dropdown = document.querySelector('.dropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Function to close mobile menu
function cancel() {
    const dropdown = document.querySelector('.dropdown');
    if (dropdown) {
        dropdown.classList.remove('active');
    }
} 