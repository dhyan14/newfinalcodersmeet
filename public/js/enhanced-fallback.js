// Create a more robust fallback chat system
window.EnhancedChat = {
  // Configuration
  useServer: false,
  squadId: null,
  username: 'Anonymous',
  
  // Initialize the system
  init: function() {
    // Get necessary info
    this.squadId = this.getSquadId();
    this.username = this.getUsername();
    
    // Set up UI
    this.setupUI();
    
    // Start message retrieval
    this.getMessages();
    setInterval(() => this.getMessages(), 2000);
    
    console.log("Enhanced offline chat initialized");
    return true;
  },
  
  // Get messages from localStorage
  getMessages: function() {
    const storageKey = `chat_messages_${this.squadId}`;
    let messages = [];
    
    try {
      messages = JSON.parse(localStorage.getItem(storageKey) || '[]');
      this.displayMessages(messages);
    } catch (e) {
      console.error('Error getting messages:', e);
    }
  },
  
  // Helper methods (add implementations for these)
  setupUI: function() { /* Implementation */ },
  displayMessages: function(messages) { /* Implementation */ },
  sendMessage: function() { /* Implementation */ },
  getSquadId: function() { /* Implementation */ },
  getUsername: function() { /* Implementation */ }
}; 