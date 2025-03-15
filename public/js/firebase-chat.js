// Initialize Firebase (add to your HTML)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

class FirebaseChat {
  constructor(squadId, user) {
    this.squadId = squadId;
    this.user = user;
    this.messagesRef = firebase.database().ref(`squads/${this.squadId}/messages`);
  }

  // Send a message
  sendMessage(message) {
    this.messagesRef.push({
      content: message,
      sender: this.user.username,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
  }

  // Listen for new messages
  onNewMessage(callback) {
    this.messagesRef.on('child_added', snapshot => {
      const message = snapshot.val();
      message.id = snapshot.key;
      callback(message);
    });
  }
} 