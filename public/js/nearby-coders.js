class NearbyCoders {
  constructor() {
    this.codersList = document.getElementById('nearbyCodersList');
    this.searchInput = document.getElementById('skillSearch');
    this.currentPosition = null;
    
    this.setupEventListeners();
    this.getCurrentLocation();
  }

  setupEventListeners() {
    this.searchInput?.addEventListener('input', 
      debounce(() => this.searchCoders(), 300)
    );
  }

  async getCurrentLocation() {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      this.currentPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      // Update user's location in database
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData._id) {
        await this.updateUserLocation(userData._id);
      }

      // Initial search
      this.searchCoders();
    } catch (error) {
      console.error('Error getting location:', error);
      this.showError('Could not get your location. Showing all coders instead.');
      this.searchCoders(false);
    }
  }

  async updateUserLocation(userId) {
    try {
      await api.fetch('/api/users/location', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          latitude: this.currentPosition.lat,
          longitude: this.currentPosition.lng
        })
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }

  async searchCoders(useLocation = true) {
    try {
      const searchQuery = this.searchInput?.value || '';
      let url = '/api/users/search?';

      if (searchQuery) {
        url += `q=${encodeURIComponent(searchQuery)}&`;
      }

      if (useLocation && this.currentPosition) {
        url += `lat=${this.currentPosition.lat}&lng=${this.currentPosition.lng}&`;
      }

      const users = await api.fetch(url);
      this.renderCoders(users);
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Failed to search nearby coders: ' + error.message);
    }
  }

  renderCoders(users) {
    if (!this.codersList) return;

    if (users.length === 0) {
      this.codersList.innerHTML = '<div class="no-results">No coders found nearby</div>';
      return;
    }

    this.codersList.innerHTML = users.map(user => `
      <div class="coder-card">
        <div class="coder-info">
          <div class="coder-avatar">${this.getInitials(user.fullName)}</div>
          <div class="coder-details">
            <div class="coder-name">${user.username}</div>
            <div class="coder-skills">${user.skills?.join(', ') || 'No skills listed'}</div>
          </div>
        </div>
        <div class="coder-actions">
          <button onclick="sendMessage('${user._id}')" title="Send Message">
            <i class="fas fa-comment"></i>
          </button>
          <button onclick="inviteToSquad('${user._id}')" title="Invite to Squad">
            <i class="fas fa-user-plus"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  getInitials(name) {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  }

  showError(message) {
    console.error(message);
    if (this.codersList) {
      this.codersList.innerHTML = `<div class="error-message">${message}</div>`;
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new NearbyCoders();
}); 