// Simple polling-based chat system (no Socket.io)
const POLL_INTERVAL = 3000; // Poll every 3 seconds
let lastMessageTimestamp = new Date().toISOString();

// Function to fetch new messages
function fetchMessages() {
  fetch('/api/squad-messages?squadId=' + squadId + '&since=' + encodeURIComponent(lastMessageTimestamp))
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    })
    .then(messages => {
      if (messages.length > 0) {
        // Update last timestamp
        lastMessageTimestamp = messages[messages.length - 1].timestamp;
        
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
    })
    .finally(() => {
      // Schedule next poll
      setTimeout(fetchMessages, POLL_INTERVAL);
    });
}

// Start polling
setTimeout(fetchMessages, POLL_INTERVAL);

// Function to send a message
function sendMessage() {
  const messageInput = document.getElementById('message-input');
  if (!messageInput) return;
  
  const message = messageInput.value.trim();
  if (!message) return;
  
  const messageData = {
    squadId: squadId,
    message: message,
    sender: currentUsername,
    timestamp: new Date().toISOString()
  };
  
  // Send via REST API
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
  
  messageInput.value = '';
} 
