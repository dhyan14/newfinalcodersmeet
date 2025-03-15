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

// Your preferred admin credentials
const adminEmail = 'admin@codersmeet.com';
const adminPassword = 'admin@codersmeet.com'; // Change this to your preferred password
const adminFullName = 'Coders MEET Admin';
const adminUsername = 'codersmeetadmin';

async function createCustomAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin user already exists with this email. Updating password...');
      
      // Update the existing admin user
      existingAdmin.password = adminPassword;
      existingAdmin.isAdmin = true;
      existingAdmin.role = 'admin';
      
      await existingAdmin.save();
      console.log('Admin password updated successfully!');
    } else {
      // Create new admin user
      const adminUser = new User({
        fullName: adminFullName,
        username: adminUsername,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isAdmin: true,
        createdAt: new Date()
      });
      
      await adminUser.save();
      console.log('New admin user created successfully!');
    }
    
    console.log('Admin Login Details:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating/updating admin user:', error);
    mongoose.connection.close();
  }
}

createCustomAdmin(); 