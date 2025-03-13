// Add this at the beginning of your file
let currentUsername;

// Get the current user's information from localStorage or another source
document.addEventListener('DOMContentLoaded', () => {
  // Get user info from localStorage (adjust based on how you store user data)
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  currentUsername = userInfo.username || 'Anonymous';
  
  // Rest of your code...
});

// Initialize socket connection
const socket = io();

// Modify this line to ensure you're getting the squad ID correctly
const squadId = document.getElementById('squad-id')?.value || 
                document.querySelector('[data-squad-id]')?.dataset.squadId || 
                new URLSearchParams(window.location.search).get('squadId') || 
                window.location.pathname.split('/').pop();

// Add debugging to check if squadId is being found
console.log('Squad ID:', squadId);

// Join the squad room when the page loads
socket.on('connect', () => {
  console.log('Connected to socket server');
  socket.emit('join-squad-room', squadId);
});

// Send message function
function sendSquadMessage() {
  const messageInput = document.getElementById('message-input');
  const message = messageInput.value.trim();
  
  if (message) {
    const messageData = {
      squadId: squadId,
      message: message,
      sender: currentUsername, // Make sure this variable is defined with the current user's name
      timestamp: new Date().toISOString()
    };
    
    socket.emit('squad-message', messageData);
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

// Add event listener to send button
document.getElementById('send-button').addEventListener('click', sendSquadMessage);

// Add event listener to input for Enter key
document.getElementById('message-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendSquadMessage();
  }
});

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
