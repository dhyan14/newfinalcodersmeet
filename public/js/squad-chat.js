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
<<<<<<< HEAD
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
=======
  }

  // Initialize chat
  init() {
    // Get user data
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        console.warn('No user data found, using default');
        this.user = { username: 'Anonymous' };
      } else {
        this.user = JSON.parse(userData);
      }
>>>>>>> f1c7a2d670be00e08c87a2175a2dbe23ef088f07

      // Get squad ID
      this.squadId = this.getSquadId();
      if (!this.squadId) {
<<<<<<< HEAD
        this.showError('No squad ID found');
        return false;
      }

      // Initialize socket
      await this.initializeSocket();
=======
        // Try to get squad ID from URL path
        const pathParts = window.location.pathname.split('/');
        this.squadId = pathParts[pathParts.length - 1].replace('.html', '');
        
        if (!this.squadId) {
          this.showError('No squad ID found');
          return false;
        }
      }

      console.log('Initializing chat with squad ID:', this.squadId);
      
      // Initialize socket
      this.initializeSocket();
>>>>>>> f1c7a2d670be00e08c87a2175a2dbe23ef088f07
      this.setupEventListeners();
      return true;
    } catch (error) {
      console.error('Chat initialization error:', error);
<<<<<<< HEAD
      this.showError('Failed to initialize chat');
      return false;
    }
=======
      this.showError(error.message);
      return false;
    }
  }

  // Get squad ID from various possible sources
  getSquadId() {
    const idFromElement = document.getElementById('squad-id')?.value;
    const idFromDataset = document.querySelector('[data-squad-id]')?.dataset.squadId;
    const idFromURL = new URLSearchParams(window.location.search).get('squadId');
    
    console.log('Squad ID sources:', {
      element: idFromElement,
      dataset: idFromDataset,
      url: idFromURL
    });
    
    return idFromElement || idFromDataset || idFromURL;
  }

  // Initialize Socket.IO connection
  initializeSocket() {
    try {
      // Check if we're in production or development
      const isProduction = window.location.hostname !== 'localhost';
      
      // Point directly to the WebSocket server with full URL
      const wsServerUrl = isProduction 
        ? 'https://chat-websocket-server-lk6w.onrender.com' 
        : window.location.origin;
      
      console.log('Using WebSocket server:', wsServerUrl);
      
      this.socket = io(wsServerUrl, {
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 20000,
        forceNew: true,
        autoConnect: true
      });

      // Socket event handlers
      console.log('Attempting to connect to:', wsServerUrl);

      this.socket.on('connect', () => {
        console.log('✅ Successfully connected to WebSocket server');
        console.log('Socket ID:', this.socket.id);
        this.updateStatus('Connected', 'success');
        
        // Create a valid MongoDB ObjectId (24 hex characters)
        const objectIdTimestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
        const objectIdRandom = [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        const mongoObjectId = objectIdTimestamp + objectIdRandom;
        
        console.log('Joining squad with valid MongoDB ObjectId:', mongoObjectId);
        this.socket.emit('join-squad', mongoObjectId);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        console.error('Transport used:', this.socket.io.engine.transport.name);
        this.updateStatus('Using local storage for chat', 'info');
        
        // Switch to fallback mode immediately
        window.FallbackChat.setLocalStorage(true);
        window.FallbackChat.startPolling();
        
        // Close socket to avoid repeated reconnection attempts
        this.socket.close();
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        this.updateStatus('Disconnected - trying to reconnect...', 'error');
      });

      this.socket.on('chat-history', (messages) => {
        this.displayMessages(messages);
      });

      this.socket.on('new-message', (message) => {
        this.displayMessage(message);
      });

      this.socket.on('chat-error', (error) => {
        this.showError(error.message);
      });
    } catch (error) {
      console.error('Socket initialization error:', error);
      this.updateStatus('Using offline mode', 'warning');
      window.FallbackChat.setLocalStorage(true);
      window.FallbackChat.startPolling();
    }
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

    this.socket.emit('squad-message', {
      squadId: this.squadId,
      message: message,
      senderId: this.user._id,
      sender: this.user.username || 'Anonymous'
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

  // Initialize Firebase connection in your SquadChat class
  initializeFirebase() {
    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_PROJECT.firebaseapp.com",
        databaseURL: "https://YOUR_PROJECT.firebaseio.com",
        projectId: "YOUR_PROJECT_ID"
      });
    }
    
    this.db = firebase.database();
    this.messagesRef = this.db.ref(`squads/${this.squadId}/messages`);
    
    // Listen for messages
    this.messagesRef.on('child_added', (snapshot) => {
      const message = snapshot.val();
      this.displayMessage(message);
    });
  }

  // Rename the Firebase version of sendMessage to avoid conflicts
  sendMessageWithFirebase() {
    if (!this.messageInput || !this.db) return;
    
    const message = this.messageInput.value.trim();
    if (!message) return;
    
    this.messagesRef.push({
      squadId: this.squadId,
      message: message,
      sender: this.user.username || 'Anonymous',
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    
    this.messageInput.value = '';
>>>>>>> f1c7a2d670be00e08c87a2175a2dbe23ef088f07
  }

<<<<<<< HEAD
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

=======
>>>>>>> f1c7a2d670be00e08c87a2175a2dbe23ef088f07
// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const chat = new SquadChat();
  if (!chat.init()) {
    console.error('Failed to initialize chat');
  }
}); 
