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

// Admin user details - CHANGE THESE!
const adminEmail = 'admin@gmail.com';
const adminPassword = 'admin1admin@gmail.com23'; // Use a strong password in production!
const adminFullName = 'ADMIN';
const adminUsername = 'Admin1'; // This is required in your schema

async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return mongoose.connection.close();
    }
    
    // Create new admin user
    const adminUser = new User({
      fullName: adminFullName,       // Changed from name to fullName
      username: adminUsername,       // Added username which is required
      email: adminEmail,
      password: adminPassword,       // In production, hash this password with bcrypt
      role: 'admin',
      isAdmin: true                  // Setting both role and isAdmin for compatibility
    });
    
    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('Please change the password after first login');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating admin user:', error);
    mongoose.connection.close();
  }
}

createAdminUser(); 