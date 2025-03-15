const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hack-a-match';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

async function updateUsersRole() {
  try {
    // Find all users without a role field
    const usersWithoutRole = await User.find({ 
      $or: [
        { role: { $exists: false } }, 
        { role: null }
      ] 
    });
    
    console.log(`Found ${usersWithoutRole.length} users without a role field`);
    
    // Update users to add default role
    if (usersWithoutRole.length > 0) {
      const updateResult = await User.updateMany(
        { 
          $or: [
            { role: { $exists: false } }, 
            { role: null }
          ] 
        },
        { $set: { role: 'user' } }
      );
      
      console.log(`Updated ${updateResult.modifiedCount} users with default 'user' role`);
    }
    
    // Check if admin user exists
    const adminExists = await User.findOne({ 
      $or: [
        { role: 'admin' },
        { isAdmin: true }
      ]
    });
    
    if (!adminExists) {
      console.log('No admin user found. Please run create-admin.js to create an admin user.');
    } else {
      console.log('Admin user exists:', adminExists.email);
      
      // Make sure admin user has both role='admin' and isAdmin=true for compatibility
      if (!adminExists.isAdmin || adminExists.role !== 'admin') {
        await User.updateOne(
          { _id: adminExists._id },
          { $set: { role: 'admin', isAdmin: true } }
        );
        console.log(`Updated admin user ${adminExists.email} to have both role='admin' and isAdmin=true`);
      }
    }
    
    console.log('Database update completed successfully');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error updating users:', error);
    mongoose.connection.close();
  }
}

updateUsersRole(); 