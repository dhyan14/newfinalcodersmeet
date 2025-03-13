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

// Check if socket is already defined before creating a new one
if (typeof window.socket === 'undefined') {
  window.socket = io(window.location.origin, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });
} else {
  // Use the existing socket
  const socket = window.socket;
}

// Add better error handling
socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
  const connectionStatus = document.getElementById('connectionStatus');
  if (connectionStatus) {
    connectionStatus.textContent = 'Connection Error';
    connectionStatus.className = 'connection-status error';
  }
});

// Modify this line to ensure you're getting the squad ID correctly
const squadId = document.getElementById('squad-id')?.value || 
                document.querySelector('[data-squad-id]')?.dataset.squadId || 
                new URLSearchParams(window.location.search).get('squadId') || 
                window.location.pathname.split('/').pop();

// Add debugging to check if squadId is being found
console.log('Squad ID:', squadId);

// Add a fallback mechanism for when Socket.io fails
let socketConnected = false;

// Join the squad room when the page loads
socket.on('connect', () => {
  console.log('Connected to socket server');
  socketConnected = true;
  
  // Join the squad room
  socket.emit('join-squad-room', squadId);
});

// Function to send message with fallback
function sendSquadMessage() {
  const messageInput = document.getElementById('message-input');
  if (!messageInput) return;
  
  const message = messageInput.value.trim();
  
  if (message) {
    const messageData = {
      squadId: squadId,
      message: message,
      sender: currentUsername,
      timestamp: new Date().toISOString()
    };
    
    if (socketConnected) {
      // Send via Socket.io if connected
      socket.emit('squad-message', messageData);
    } else {
      // Fallback to REST API if Socket.io is not connected
      fetch('/api/squad-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to send message');
        return response.json();
      })
      .then(data => {
        console.log('Message sent via REST API:', data);
        // Display the message locally
        displayMessage(messageData);
      })
      .catch(error => {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
      });
    }
    
    messageInput.value = '';
  }
}

// Listen for incoming messages
socket.on('squad-message', (data) => {
  console.log('Received message:', data);
  displayMessage(data);
});

// Display message in the chat area
function displayMessage(data) {
  const chatMessages = document.getElementById('chat-messages');
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  
  // Determine if this is the current user's message
  const isCurrentUser = data.sender === currentUsername;
  messageElement.classList.add(isCurrentUser ? 'my-message' : 'other-message');
  
  messageElement.innerHTML = `
    <div class="message-header">
      <span class="sender">${data.sender}</span>
      <span class="timestamp">${new Date(data.timestamp).toLocaleTimeString()}</span>
    </div>
    <div class="message-body">${data.message}</div>
  `;
  
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add event listener to send button if it exists
const sendButton = document.getElementById('send-button');
if (sendButton) {
  sendButton.addEventListener('click', sendSquadMessage);
}

// Add event listener to input for Enter key if it exists
const messageInput = document.getElementById('message-input');
if (messageInput) {
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendSquadMessage();
    }
  });
}

// Add this to your existing code
socket.on('previous-messages', (messages) => {
  console.log('Received previous messages:', messages);
  
  // Clear existing messages
  const chatMessages = document.getElementById('chat-messages');
  chatMessages.innerHTML = '';
  
  // Display each message
  messages.forEach(msg => {
    displayMessage({
      squadId: msg.squadId,
      message: msg.content,
      sender: msg.senderName,
      timestamp: msg.timestamp
    });
  });
}); 
