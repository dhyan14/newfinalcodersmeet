// Add these lines to your existing server.js file

// Import the routes
const locationRoutes = require('./routes/locationRoutes');
const healthRoutes = require('./routes/healthRoutes');
const friendRequestRoutes = require('./routes/friendRequestRoutes');

// Use the routes
app.use('/api', locationRoutes);
app.use('/api', healthRoutes);
app.use('/api', friendRequestRoutes);

// Make sure you have CORS enabled
app.use(cors());
app.use(express.json()); 