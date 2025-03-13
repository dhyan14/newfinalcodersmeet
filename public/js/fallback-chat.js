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
    currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Get the squad ID from various possible sources
    fallbackSquadId = document.getElementById('squad-id')?.value || 
              document.querySelector('[data-squad-id]')?.dataset.squadId || 
              new URLSearchParams(window.location.search).get('squadId') || 
              window.location.pathname.split('/').pop();
    
    console.log('Fallback Chat - Squad ID:', fallbackSquadId);
    console.log('Fallback Chat - Current user:', currentUser.username || currentUser.email || 'Anonymous');
    
    // Test if API is available
    testApiAvailability();
    
    // Set up event listeners
    setupEventListeners();
  }

  // Test if the API is available
  function testApiAvailability() {
    fetch('/api/squad-messages?squadId=' + fallbackSquadId)
      .then(response => {
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        useLocalStorage = false;
        console.log('API is available, using server storage');
        startPolling();
      })
      .catch(error => {
        console.warn('API is not available, using localStorage fallback:', error);
        useLocalStorage = true;
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
    
    const senderName = currentUser.username || currentUser.fullName || currentUser.email || 'Anonymous';
    
    const messageData = {
      squadId: fallbackSquadId,
      message: message,
      sender: senderName,
      senderId: currentUser._id || 'anonymous',
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
    sendMessage: sendMessage,
    startPolling: startPolling,
    stopPolling: function() { isPolling = false; },
    useLocalStorage: function(use) { useLocalStorage = use; }
  };
})(); 
