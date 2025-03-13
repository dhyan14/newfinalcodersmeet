<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Standalone Chat</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { color: #333; margin-bottom: 5px; }
    .header p { color: #666; margin-top: 0; }
    .chat-container { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .chat-header { background: #4CAF50; padding: 15px; display: flex; justify-content: space-between; align-items: center; color: white; }
    .section-title { font-weight: bold; font-size: 18px; }
    .connection-status { font-size: 12px; padding: 3px 8px; border-radius: 12px; background: rgba(255,255,255,0.3); }
    .chat-messages { height: 400px; overflow-y: auto; padding: 15px; background: #fff; }
    .message { margin-bottom: 15px; padding: 10px 15px; border-radius: 18px; max-width: 70%; position: relative; }
    .message.sent { background: #dcf8c6; margin-left: auto; border-bottom-right-radius: 5px; }
    .message.received { background: #f1f0f0; border-bottom-left-radius: 5px; }
    .message.system { background: #e3f2fd; text-align: center; max-width: 100%; font-style: italic; border-radius: 10px; }
    .message-sender { font-weight: bold; margin-bottom: 5px; color: #333; }
    .message-content { word-break: break-word; line-height: 1.4; }
    .message-time { font-size: 11px; color: #777; text-align: right; margin-top: 5px; }
    .chat-input { display: flex; padding: 15px; background: #f5f5f5; border-top: 1px solid #ddd; }
    .chat-input input { flex-grow: 1; padding: 12px; border: 1px solid #ddd; border-radius: 24px; margin-right: 10px; font-size: 14px; }
    .chat-input button { padding: 0 20px; background: #4CAF50; color: white; border: none; border-radius: 24px; cursor: pointer; font-weight: bold; }
    .chat-input button:hover { background: #45a049; }
    .controls { margin-top: 15px; display: flex; gap: 10px; justify-content: center; }
    .controls button { padding: 8px 15px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .controls button:hover { background: #0b7dda; }
    .user-info { margin-bottom: 20px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .user-info h2 { margin-top: 0; color: #333; }
    .user-info input { width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; }
    .user-info button { padding: 10px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Standalone Chat</h1>
      <p>This chat works with or without server connectivity</p>
    </div>
    
    <div class="user-info">
      <h2>Your Information</h2>
      <input type="text" id="username" placeholder="Your username" value="Guest">
      <button onclick="updateUser()">Update</button>
    </div>
    
    <div class="chat-container">
      <div class="chat-header">
        <div class="section-title">Chat Room</div>
        <div id="connectionStatus" class="connection-status">Initializing...</div>
      </div>
      <div id="chat-messages" class="chat-messages">
        <div class="message system">
          <div class="message-content">Welcome to the standalone chat! This chat will work even if the server is unavailable.</div>
        </div>
      </div>
      <div class="chat-input">
        <input type="text" id="message-input" placeholder="Type your message...">
        <button id="send-button">Send</button>
      </div>
      <input type="hidden" id="squad-id" value="standalone-room">
    </div>
    
    <div class="controls">
      <button onclick="window.FallbackChat.useLocalStorage(true)">Use Local Storage</button>
      <button onclick="window.FallbackChat.useLocalStorage(false)">Try Server Connection</button>
      <button onclick="clearLocalMessages()">Clear Messages</button>
    </div>
  </div>

  <script>
    // Create or update user
    function updateUser() {
      const username = document.getElementById('username').value.trim() || 'Guest';
      const userId = 'user-' + Math.random().toString(36).substring(2, 9);
      
      const user = {
        _id: localStorage.getItem('user_id') || userId,
        username: username,
        fullName: username,
        email: `${username.toLowerCase()}@example.com`
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('user_id', user._id);
      
      alert(`User updated: ${username}`);
      location.reload();
    }
    
    // Initialize user if not exists
    if (!localStorage.getItem('user')) {
      const defaultUser = {
        _id: 'user-' + Math.random().toString(36).substring(2, 9),
        username: 'Guest',
        fullName: 'Guest User',
        email: 'guest@example.com'
      };
      localStorage.setItem('user', JSON.stringify(defaultUser));
      localStorage.setItem('user_id', defaultUser._id);
      document.getElementById('username').value = defaultUser.username;
    } else {
      const user = JSON.parse(localStorage.getItem('user'));
      document.getElementById('username').value = user.username || 'Guest';
    }
    
    // Function to clear local messages
    function clearLocalMessages() {
      const squadId = document.getElementById('squad-id').value;
      localStorage.removeItem(`fallback_messages_${squadId}`);
      localStorage.removeItem(`last_displayed_${squadId}`);
      localStorage.removeItem(`last_timestamp_${squadId}`);
      alert('Local messages cleared');
      location.reload();
    }
  </script>
  
  <!-- Load the fallback chat script -->
  <script src="/js/fallback-chat.js"></script>
</body>
</html> 
