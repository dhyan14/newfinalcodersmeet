/**
 * Polling-based chat implementation for environments where Socket.io doesn't work
 * This provides a fallback for real-time communication in serverless environments
 */

// Create a self-executing function to isolate our variables
(function() {
  // Configuration
  const POLL_INTERVAL = 3000; // Poll every 3 seconds
  let lastMessageTimestamp = new Date().toISOString();
  let isPolling = false;
  let pollingSquadId = null;
  let currentUser = null;

  // Initialize the chat system
  function initPollingChat() {
    console.log('Initializing polling-based chat...');
    
    // Get the current user
    currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Get the squad ID from various possible sources
    pollingSquadId = document.getElementById('squad-id')?.value || 
              document.querySelector('[data-squad-id]')?.dataset.squadId || 
              new URLSearchParams(window.location.search).get('squadId') || 
              window.location.pathname.split('/').pop();
    
    console.log('Polling Chat - Squad ID:', pollingSquadId);
    console.log('Polling Chat - Current user:', currentUser.username || currentUser.email || 'Anonymous');
    
    // Update connection status
    updateConnectionStatus('Connected (Polling)', 'online');
    
    // Set up event listeners
    setupEventListeners();
    
    // Start polling for messages
    startPolling();
  }

  // Start polling for new messages
  function startPolling() {
    if (isPolling) return;
    isPolling = true;
    
    console.log('Starting message polling...');
    pollMessages();
  }

  // Poll for new messages
  function pollMessages() {
    if (!pollingSquadId) {
      console.error('No squad ID found for polling');
      setTimeout(pollMessages, POLL_INTERVAL);
      return;
    }
    
    fetch(`/api/squad-messages?squadId=${pollingSquadId}&since=${encodeURIComponent(lastMessageTimestamp)}`)
      .then(response => {
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        return response.json();
      })
      .then(messages => {
        if (messages && messages.length > 0) {
          console.log(`Received ${messages.length} new messages`);
          
          // Update last timestamp to the newest message
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
        updateConnectionStatus('Error: ' + error.message, 'error');
      })
      .finally(() => {
        // Continue polling
        if (isPolling) {
          setTimeout(pollMessages, POLL_INTERVAL);
        }
      });
  }

  // Send a message
  function sendMessage() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;
    
    const message = messageInput.value.trim();
    if (!message) return;
    
    // Get the current user's name
    const senderName = currentUser.username || currentUser.fullName || currentUser.email || 'Anonymous';
    
    const messageData = {
      squadId: pollingSquadId,
      message: message,
      sender: senderName,
      senderId: currentUser._id,
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
      
      // Display the message locally (optimistic UI update)
      displayMessage({
        squadId: messageData.squadId,
        message: messageData.message,
        sender: messageData.sender,
        timestamp: messageData.timestamp
      });
      
      // Clear the input
      messageInput.value = '';
    })
    .catch(error => {
      console.error('Error sending message:', error);
      updateConnectionStatus('Error sending: ' + error.message, 'error');
      setTimeout(() => {
        updateConnectionStatus('Connected (Polling)', 'online');
      }, 3000);
    });
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
    const isCurrentUser = data.sender === (currentUser.username || currentUser.fullName || currentUser.email);
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

  // Update connection status display
  function updateConnectionStatus(message, status) {
    const connectionStatus = document.getElementById('connectionStatus');
    if (connectionStatus) {
      connectionStatus.textContent = message;
      connectionStatus.className = `connection-status ${status}`;
    }
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
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Resume polling when page becomes visible
        if (!isPolling) {
          startPolling();
        }
      }
    });
  }

  // Initialize when the DOM is loaded
  document.addEventListener('DOMContentLoaded', initPollingChat);

  // Expose functions globally with a unique namespace
  window.PollingChat = {
    sendMessage: sendMessage,
    startPolling: startPolling,
    stopPolling: function() { isPolling = false; }
  };
})(); 
