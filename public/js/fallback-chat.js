/**
 * Fallback chat implementation that uses localStorage when API is unavailable
 * This is for testing purposes only
 */
(function() {
  // Configuration
  const POLL_INTERVAL = 3000; // Poll every 3 seconds
  let isPolling = false;
  let fallbackSquadId = null;
  let currentUser = null;
  let useLocalStorage = false;

  // Initialize the fallback chat system
  function initFallbackChat() {
    console.log('Initializing fallback chat...');
    
    // Get the current user
    currentUser = localStorage.getItem('user') 
      ? JSON.parse(localStorage.getItem('user')).username 
      : 'TESTUSER';
    
    // Get the squad ID from various possible sources
    fallbackSquadId = document.getElementById('squad-id')?.value || 'squad.html';
    
    console.log('Fallback Chat - Squad ID:', fallbackSquadId);
    console.log('Fallback Chat - Current user:', currentUser);
    
    // Test if API is available
    testApiAvailability();
    
    // Set up event listeners
    setupEventListeners();
  }

  // Test if the API is available
  function testApiAvailability() {
    updateConnectionStatus('Testing connection...', 'offline');
    
    fetch('/api/server-info')
      .then(response => {
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        return response.json();
      })
      .then(data => {
        console.log('Server info:', data);
        useLocalStorage = false;
        updateConnectionStatus('Connected to server', 'online');
        console.log('API is available, using server storage');
        startPolling();
      })
      .catch(error => {
        console.warn('API is not available, using localStorage fallback:', error);
        useLocalStorage = true;
        updateConnectionStatus('Using local storage (offline mode)', 'offline');
        startPolling();
      });
  }

  // Start polling for new messages
  function startPolling() {
    if (isPolling) return;
    isPolling = true;
    
    console.log('Starting fallback message polling...');
    pollMessages();
  }

  // Poll for new messages
  function pollMessages() {
    if (!fallbackSquadId) {
      console.error('No squad ID found for polling');
      setTimeout(pollMessages, POLL_INTERVAL);
      return;
    }
    
    if (useLocalStorage) {
      // Use localStorage as fallback
      const messages = getLocalMessages();
      displayLocalMessages(messages);
    } else {
      // Use API
      const lastMessageTimestamp = getLastMessageTimestamp();
      
      fetch(`/api/squad-messages?squadId=${fallbackSquadId}&since=${encodeURIComponent(lastMessageTimestamp)}`)
        .then(response => {
          if (!response.ok) throw new Error(`API returned ${response.status}`);
          return response.json();
        })
        .then(messages => {
          if (messages && messages.length > 0) {
            console.log(`Received ${messages.length} new messages`);
            
            // Update last timestamp to the newest message
            setLastMessageTimestamp(messages[messages.length - 1].timestamp);
            
            // Display new messages
            messages.forEach(msg => {
              displayMessage({
                squadId: msg.squadId,
                message: msg.content,
                sender: msg.senderName,
                timestamp: msg.timestamp
              });
            });
          }
        })
        .catch(error => {
          console.error('Error polling messages:', error);
          // Switch to localStorage fallback if API fails
          if (!useLocalStorage) {
            console.warn('Switching to localStorage fallback due to API error');
            useLocalStorage = true;
          }
        });
    }
    
    // Continue polling
    if (isPolling) {
      setTimeout(pollMessages, POLL_INTERVAL);
    }
  }

  // Get messages from localStorage
  function getLocalMessages() {
    const storageKey = `fallback_messages_${fallbackSquadId}`;
    const messagesJson = localStorage.getItem(storageKey) || '[]';
    return JSON.parse(messagesJson);
  }

  // Save messages to localStorage
  function saveLocalMessages(messages) {
    const storageKey = `fallback_messages_${fallbackSquadId}`;
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }

  // Display messages from localStorage
  function displayLocalMessages(messages) {
    // Get the last displayed message timestamp
    const lastDisplayed = localStorage.getItem(`last_displayed_${fallbackSquadId}`) || '0';
    
    // Filter messages that haven't been displayed yet
    const newMessages = messages.filter(msg => {
      const msgTime = new Date(msg.timestamp).getTime();
      return msgTime > parseInt(lastDisplayed);
    });
    
    if (newMessages.length > 0) {
      console.log(`Displaying ${newMessages.length} new local messages`);
      
      // Display new messages
      newMessages.forEach(msg => {
        displayMessage(msg);
      });
      
      // Update last displayed timestamp
      const lastMsg = newMessages[newMessages.length - 1];
      localStorage.setItem(`last_displayed_${fallbackSquadId}`, new Date(lastMsg.timestamp).getTime().toString());
    }
  }

  // Get the last message timestamp
  function getLastMessageTimestamp() {
    return localStorage.getItem(`last_timestamp_${fallbackSquadId}`) || new Date(0).toISOString();
  }

  // Set the last message timestamp
  function setLastMessageTimestamp(timestamp) {
    localStorage.setItem(`last_timestamp_${fallbackSquadId}`, timestamp);
  }

  // Send a message
  function sendMessage() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;
    
    const message = messageInput.value.trim();
    if (!message) return;
    
    const senderName = currentUser || 'Anonymous';
    
    const messageData = {
      squadId: fallbackSquadId,
      message: message,
      sender: senderName,
      senderId: currentUser ? currentUser._id || 'anonymous' : 'anonymous',
      timestamp: new Date().toISOString()
    };
    
    if (useLocalStorage) {
      // Save to localStorage
      const messages = getLocalMessages();
      messages.push(messageData);
      saveLocalMessages(messages);
      
      // Display the message
      displayMessage(messageData);
      
      // Clear the input
      messageInput.value = '';
    } else {
      // Send via API
      fetch('/api/squad-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      })
      .then(response => {
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        return response.json();
      })
      .then(data => {
        console.log('Message sent via API:', data);
        
        // Display the message optimistically
        displayMessage(messageData);
        
        // Clear the input
        messageInput.value = '';
      })
      .catch(error => {
        console.error('Error sending message via API:', error);
        
        // Switch to localStorage fallback
        if (!useLocalStorage) {
          console.warn('Switching to localStorage fallback due to API error');
          useLocalStorage = true;
          
          // Try again with localStorage
          sendMessage();
        }
      });
    }
  }

  // Display a message in the chat area
  function displayMessage(data) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) {
      console.error('Chat messages container not found');
      return;
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    
    // Determine if this is the current user's message
    const isCurrentUser = data.sender === (currentUser || 'Anonymous');
    messageElement.classList.add(isCurrentUser ? 'sent' : 'received');
    
    // Format the timestamp
    const time = new Date(data.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // Set message HTML
    messageElement.innerHTML = `
      ${!isCurrentUser ? `<div class="message-sender">${data.sender}</div>` : ''}
      <div class="message-content">${data.message}</div>
      <div class="message-time">${time}</div>
    `;
    
    // Add message to chat
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Set up event listeners
  function setupEventListeners() {
    // Send button
    const sendButton = document.getElementById('send-button');
    if (sendButton) {
      sendButton.addEventListener('click', sendMessage);
    }
    
    // Enter key in input
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendMessage();
          e.preventDefault();
        }
      });
    }
  }

  // Initialize when the DOM is loaded
  document.addEventListener('DOMContentLoaded', initFallbackChat);

  // Expose functions globally with a unique namespace
  window.FallbackChat = {
    useLocalStorage: false,
    pollingInterval: null,
    squadId: null,
    currentUser: null,

    init: function() {
      try {
        console.log('Initializing fallback chat...');
        
        // Get squad ID with more fallbacks
        this.squadId = document.getElementById('squad-id')?.value || 
                      document.querySelector('[data-squad-id]')?.dataset.squadId ||
                      new URLSearchParams(window.location.search).get('squadId') ||
                      'squad'; // Default fallback
        
        console.log('Fallback using squad ID:', this.squadId);
        
        // Get user info
        let userData;
        try {
          userData = JSON.parse(localStorage.getItem('user') || '{}');
        } catch (e) {
          userData = { username: 'Anonymous' };
        }
        
        this.currentUser = userData.username || 'Anonymous';
        
        this.setupEventListeners();
        return true;
      } catch (error) {
        console.error('Fallback chat initialization error:', error);
        return false;
      }
    },

    setupEventListeners: function() {
      // Set up event listeners for the chat interface
      const sendButton = document.getElementById('send-button');
      if (sendButton) {
        sendButton.addEventListener('click', () => this.sendMessage());
      }
      
      const messageInput = document.getElementById('message-input');
      if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.sendMessage();
          }
        });
      }
      
      console.log('Fallback chat event listeners set up');
    },

    setLocalStorage: function(value) {
      this.useLocalStorage = Boolean(value);
      console.log('Fallback storage mode:', this.useLocalStorage ? 'local' : 'server');
    },

    startPolling: function() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }
      
      console.log('Starting fallback message polling...');
      this.checkForNewMessages(); // Check immediately
      
      this.pollingInterval = setInterval(() => {
        this.checkForNewMessages();
      }, 3000);
    },

    checkForNewMessages: function() {
      if (this.useLocalStorage) {
        this.getLocalMessages();
      } else {
        this.getServerMessages();
      }
    },

    getLocalMessages: function() {
      const messages = JSON.parse(localStorage.getItem(`chat_${this.squadId}`) || '[]');
      this.displayMessages(messages);
    },

    getServerMessages: function() {
      fetch(`/api/squad-messages?squadId=${this.squadId}`)
        .then(response => response.json())
        .then(messages => this.displayMessages(messages))
        .catch(error => {
          console.error('Error fetching messages:', error);
          this.useLocalStorage = true;
          this.getLocalMessages();
        });
    },

    displayMessages: function(messages) {
      const container = document.getElementById('chat-messages');
      if (!container) return;

      // Sort messages by timestamp
      messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Only keep the latest 50 messages to avoid performance issues
      if (messages.length > 50) {
        messages = messages.slice(messages.length - 50);
      }

      container.innerHTML = messages.map(msg => `
        <div class="message ${msg.sender === this.currentUser ? 'sent' : 'received'}">
          ${msg.sender !== this.currentUser ? `<div class="message-sender">${msg.sender}</div>` : ''}
          <div class="message-content">${msg.content || msg.message}</div>
          <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
        </div>
      `).join('');
      
      // Scroll to bottom
      container.scrollTop = container.scrollHeight;
    },

    sendMessage: function() {
      const input = document.getElementById('message-input');
      if (!input) return;
      
      const message = input.value.trim();
      if (!message) return;
      
      // Create message object
      const messageData = {
        squadId: this.squadId,
        content: message,
        sender: this.currentUser,
        timestamp: new Date().toISOString()
      };
      
      // Save to localStorage
      this.saveMessageToLocalStorage(messageData);
      
      // Display the message
      this.displayMessage(messageData);
      
      // Clear input
      input.value = '';
    },

    saveMessageToLocalStorage: function(message) {
      // Get existing messages
      const storageKey = `chat_messages_${this.squadId}`;
      let messages = [];
      
      try {
        messages = JSON.parse(localStorage.getItem(storageKey) || '[]');
      } catch (e) {
        console.error('Error parsing stored messages:', e);
      }
      
      // Add new message
      messages.push(message);
      
      // Save back to localStorage
      localStorage.setItem(storageKey, JSON.stringify(messages));
      console.log('Message saved to localStorage');
    },

    displayMessage: function(message) {
      const container = document.getElementById('chat-messages');
      if (!container) return;
      
      const messageEl = document.createElement('div');
      messageEl.className = `message ${message.sender === this.currentUser ? 'sent' : 'received'}`;
      
      const time = new Date(message.timestamp).toLocaleTimeString();
      
      messageEl.innerHTML = `
        ${message.sender !== this.currentUser ? `<div class="message-sender">${message.sender}</div>` : ''}
        <div class="message-content">${message.content || message.message}</div>
        <div class="message-time">${time}</div>
      `;
      
      container.appendChild(messageEl);
      container.scrollTop = container.scrollHeight;
    },

    // Add a method to clear localStorage messages when needed
    clearMessages: function() {
      if (confirm('Are you sure you want to clear all chat messages? This cannot be undone.')) {
        localStorage.removeItem(`chat_messages_${this.squadId}`);
        const container = document.getElementById('chat-messages');
        if (container) container.innerHTML = '';
      }
    },

    // Add more methods as needed
  };

  // Initialize fallback chat when the page loads
  document.addEventListener('DOMContentLoaded', () => {
    window.FallbackChat.init();
  });

  // Add this function to the fallback chat implementation
  function updateConnectionStatus(message, status) {
    const connectionStatus = document.getElementById('connectionStatus');
    if (connectionStatus) {
      connectionStatus.textContent = message;
      connectionStatus.className = `connection-status ${status}`;
    }
  }
})(); 
