// Fix for the dashboard user data display
document.addEventListener('DOMContentLoaded', function() {
    const userString = localStorage.getItem('user');
    
    if (!userString) {
        // Redirect to login if no user data found
        window.location.href = 'login.html';
        return;
    }
    
    try {
        // Parse user data
        const user = JSON.parse(userString);
        console.log('User data:', user);
        
        // Update UI with user data
        const userNameElement = document.getElementById('userName');
        const userUsernameElement = document.getElementById('userUsername');
        const welcomeNameElement = document.getElementById('welcomeName');
        const userAvatarElement = document.getElementById('userAvatar');
        
        if (user.fullName) {
            userNameElement.textContent = user.fullName;
            welcomeNameElement.textContent = user.fullName.split(' ')[0]; // First name only
        }
        
        if (user.username) {
            userUsernameElement.textContent = '@' + user.username;
        }
        
        // Set avatar with initials
        if (user.fullName) {
            const initials = user.fullName
                .split(' ')
                .map(name => name[0])
                .join('')
                .toUpperCase();
            userAvatarElement.textContent = initials;
        }
        
        // Don't try to fetch user data from server since we don't have that endpoint
        // Just use the data from localStorage
        
    } catch (error) {
        console.error('Error parsing user data:', error);
        // Handle error - maybe clear localStorage and redirect to login
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}); 
