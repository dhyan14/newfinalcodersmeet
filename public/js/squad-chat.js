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

// Initialize Socket.IO with better error handling and reconnection
const socket = io(window.location.origin, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000
});

// Get current user info
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
const currentUsername = currentUser.username || 'Anonymous';

// Get squad ID from various possible sources
const squadId = document.getElementById('squad-id')?.value || 
                document.querySelector('[data-squad-id]')?.dataset.squadId || 
                new URLSearchParams(window.location.search).get('squadId');

if (!squadId) {
  console.error('No squad ID found');
}

// Connection event handlers
socket.on('connect', () => {
  console.log('Connected to server');
  updateConnectionStatus('Connected', 'online');
  
  // Join squad room
  if (squadId) {
    socket.emit('join-squad-room', squadId);
  }
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  updateConnectionStatus('Connection Error', 'error');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
  updateConnectionStatus('Disconnected', 'offline');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
  updateConnectionStatus(error.message, 'error');
});

// Message handlers
socket.on('squad-message', (data) => {
  console.log('Received message:', data);
  displayMessage(data);
});

socket.on('previous-messages', (messages) => {
  console.log('Received previous messages:', messages);
  const chatMessages = document.getElementById('chat-messages');
  chatMessages.innerHTML = '';
  
  messages.forEach(msg => {
    displayMessage({
      squadId: msg.squadId,
      message: msg.content,
      sender: msg.senderName,
      timestamp: msg.timestamp
    });
  });
});

// Send message function
function sendSquadMessage() {
  const messageInput = document.getElementById('message-input');
  if (!messageInput || !squadId) return;
  
  const message = messageInput.value.trim();
  if (!message) return;
  
  const messageData = {
    squadId: squadId,
    message: message,
    sender: currentUsername,
    senderId: currentUser._id,
    timestamp: new Date().toISOString()
  };
  
  socket.emit('squad-message', messageData);
  messageInput.value = '';
}

// Update connection status UI
function updateConnectionStatus(message, status) {
  const statusElement = document.getElementById('connectionStatus');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = `connection-status ${status}`;
  }
}

// Display message in chat
function displayMessage(data) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;
  
  const messageElement = document.createElement('div');
  messageElement.className = `message ${data.sender === currentUsername ? 'sent' : 'received'}`;
  
  const time = new Date(data.timestamp).toLocaleTimeString();
  
  messageElement.innerHTML = `
    ${data.sender !== currentUsername ? `<div class="message-sender">${data.sender}</div>` : ''}
    <div class="message-content">${data.message}</div>
    <div class="message-time">${time}</div>
  `;
  
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  const sendButton = document.getElementById('send-button');
  if (sendButton) {
    sendButton.addEventListener('click', sendSquadMessage);
  }
  
  const messageInput = document.getElementById('message-input');
  if (messageInput) {
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendSquadMessage();
      }
    });
  }
}); 
