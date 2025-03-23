// Make sure this file is being served with the correct MIME type
// Add a comment at the top to ensure it's valid JavaScript
// JavaScript for Squad Chat functionality

// Add this at the beginning of your file
let currentUsername;

// Get the current user's information from localStorage or another source
document.addEventListener('DOMContentLoaded', () => {
  // Get user info from localStorage (adjust based on how you store user data)
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  currentUsername = userInfo.username || 'Anonymous';
  
  // Rest of your code...
});

// Squad Chat Implementation
class SquadChat {
  constructor() {
    this.socket = null;
    this.squadId = null;
    this.user = null;
    this.messageContainer = document.getElementById('chat-messages');
    this.messageInput = document.getElementById('message-input');
    this.sendButton = document.getElementById('send-button');
    this.statusElement = document.getElementById('chat-status');
    this.connected = false;
  }

  async init() {
    try {
      // Get user data
      const userData = localStorage.getItem('user');
      if (!userData) {
        this.showError('User not logged in');
        return false;
      }
      this.user = JSON.parse(userData);

      // Get squad ID
      this.squadId = this.getSquadId();
      if (!this.squadId) {
        this.showError('No squad ID found');
        return false;
      }

      // Initialize socket
      await this.initializeSocket();
      this.setupEventListeners();
      return true;
    } catch (error) {
      console.error('Chat initialization error:', error);
      this.showError('Failed to initialize chat');
      return false;
    }
  }

  // Get squad ID from various possible sources
  getSquadId() {
    // First try to get from hidden input
    const squadIdInput = document.getElementById('squad-id');
    if (squadIdInput?.value) {
      return squadIdInput.value;
    }

    // Try to get from data attribute
    const squadElement = document.querySelector('[data-squad-id]');
    if (squadElement?.dataset.squadId) {
      return squadElement.dataset.squadId;
    }

    // Try to get from URL
    const urlParams = new URLSearchParams(window.location.search);
    const squadId = urlParams.get('squadId');
    if (squadId) {
      return squadId;
    }

    // Try to get from URL path
    const pathParts = window.location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart !== 'squad.html') {
      return lastPart;
    }

    // Default squad ID for testing
    return 'test-squad-1';
  }

  // Update initializeSocket method
  async initializeSocket() {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io({
          path: '/socket.io/',
          transports: ['polling', 'websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000,
          autoConnect: true
        });

        this.socket.on('connect', () => {
          console.log('Connected to chat server');
          this.connected = true;
          this.updateStatus('Connected', 'success');
          this.socket.emit('join-squad', this.squadId);
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          this.connected = false;
          this.updateStatus('Connection error - retrying...', 'error');
        });

        // Add connection timeout
        setTimeout(() => {
          if (!this.connected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  // Set up UI event listeners
  setupEventListeners() {
    this.sendButton?.addEventListener('click', () => this.sendMessage());
    this.messageInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  // Send a message
  sendMessage() {
    if (!this.messageInput || !this.socket) return;

    const message = this.messageInput.value.trim();
    if (!message) return;

    this.socket.emit('chat-message', {
      squadId: this.squadId,
      senderId: this.user._id,
      senderName: this.user.username,
      message: message
    });

    this.messageInput.value = '';
  }

  // Display multiple messages (for history)
  displayMessages(messages) {
    if (!this.messageContainer) return;
    this.messageContainer.innerHTML = '';
    messages.forEach(msg => this.displayMessage(msg));
  }

  // Display a single message
  displayMessage(message) {
    if (!this.messageContainer) return;

    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.senderName === this.user.username ? 'sent' : 'received'}`;
    
    const time = new Date(message.timestamp).toLocaleTimeString();
    
    messageElement.innerHTML = `
      ${message.senderName !== this.user.username ? `<div class="message-sender">${message.senderName}</div>` : ''}
      <div class="message-content">${message.content || message.message}</div>
      <div class="message-time">${time}</div>
    `;

    this.messageContainer.appendChild(messageElement);
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
  }

  // Update connection status
  updateStatus(message, type) {
    if (this.statusElement) {
      this.statusElement.textContent = message;
      this.statusElement.className = `chat-status ${type}`;
    }
  }

  // Show error message
  showError(message) {
    console.error(message);
    this.updateStatus(message, 'error');
  }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const chat = new SquadChat();
  if (!chat.init()) {
    console.error('Failed to initialize chat');
  }
}); 
