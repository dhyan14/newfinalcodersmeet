function toggleTheme() {
    const body = document.body;
    const themeBtn = document.getElementById('theme-btn');
    const themeBtnMobile = document.getElementById('theme-btn-mobile');
    
    body.classList.toggle('dark-theme');
    
    // Update button icons
    if (body.classList.contains('dark-theme')) {
        themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
        if (themeBtnMobile) {
            themeBtnMobile.innerHTML = '<i class="fas fa-moon"></i>';
        }
    } else {
        themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
        if (themeBtnMobile) {
            themeBtnMobile.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
    
    // Save theme preference
    localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
}

// Load saved theme preference
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('theme-btn').innerHTML = '<i class="fas fa-moon"></i>';
        const themeBtnMobile = document.getElementById('theme-btn-mobile');
        if (themeBtnMobile) {
            themeBtnMobile.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
}); 