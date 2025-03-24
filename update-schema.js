const mongoose = require('mongoose');
const SquadChat = require('./models/SquadChat');

// Connect to your MongoDB database
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

async function updateSchema() {
  try {
    // 1. Find all documents with ObjectId squadId
    const messages = await SquadChat.find({});
    console.log(`Found ${messages.length} messages to update`);
    
    // 2. Update each document to convert squadId to String
    for (const message of messages) {
      // Convert ObjectId to String if it's an ObjectId
      if (message.squadId && typeof message.squadId !== 'string') {
        const stringId = message.squadId.toString();
        
        // Update the document
        await SquadChat.updateOne(
          { _id: message._id },
          { $set: { squadId: stringId } }
        );
        
        console.log(`Updated message ${message._id}, squadId: ${stringId}`);
      }
    }
    
    console.log('Schema update completed');
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the update function
updateSchema(); 