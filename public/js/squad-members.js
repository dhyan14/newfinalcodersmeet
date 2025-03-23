class SquadMembers {
  constructor(squadId) {
    this.squadId = squadId;
    this.membersList = document.getElementById('squadMembersList');
    this.inviteButton = document.getElementById('inviteButton');
    this.inviteModal = document.getElementById('inviteModal');
    this.searchInput = document.getElementById('userSearch');
    this.searchResults = document.getElementById('searchResults');
    
    this.setupEventListeners();
    this.loadMembers();
  }

  setupEventListeners() {
    // Invite button
    this.inviteButton?.addEventListener('click', () => this.showInviteModal());

    // Close modal
    document.querySelector('.close')?.addEventListener('click', () => {
      this.inviteModal.style.display = 'none';
    });

    // Search input
    this.searchInput?.addEventListener('input', debounce(() => this.searchUsers(), 300));
  }

  async loadMembers() {
    try {
      if (!this.squadId) {
        throw new Error('No squad ID available');
      }

      const response = await fetch(`/api/squad/${this.squadId}/members`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch members');
      }
      
      this.renderMembers(data);
    } catch (error) {
      console.error('Error loading members:', error);
      this.showError('Failed to load squad members: ' + error.message);
    }
  }

  renderMembers(members) {
    if (!this.membersList) return;

    this.membersList.innerHTML = members.map(member => `
      <div class="member-card">
        <div class="member-info">
          <div class="member-avatar">${this.getInitials(member.user.fullName)}</div>
          <div>
            <div class="member-name">${member.user.username}</div>
            <div class="member-role">${member.role}</div>
          </div>
        </div>
        <div class="member-actions">
          <button onclick="sendDirectMessage('${member.user._id}')">
            <i class="fas fa-comment"></i>
          </button>
          ${member.role !== 'leader' ? `
            <button onclick="removeMember('${member.user._id}')">
              <i class="fas fa-user-minus"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  async searchUsers(query) {
    if (!query) {
      this.searchResults.innerHTML = '';
      return;
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      
      const users = await response.json();
      this.renderSearchResults(users);
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Failed to search users');
    }
  }

  renderSearchResults(users) {
    this.searchResults.innerHTML = users.map(user => `
      <div class="search-result" onclick="inviteUser('${user._id}')">
        <div class="user-avatar">${this.getInitials(user.fullName)}</div>
        <div class="user-info">
          <div class="user-name">${user.username}</div>
          <div class="user-email">${user.email}</div>
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

  showInviteModal() {
    const modal = document.getElementById('inviteModal');
    if (modal) {
      modal.style.display = 'block';
    } else {
      console.error('Invite modal not found');
    }
  }

  showError(message) {
    // Implement error display
    console.error(message);
  }
}

// Helper function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const squadId = document.getElementById('squad-id')?.value;
  if (squadId) {
    new SquadMembers(squadId);
  }
}); 