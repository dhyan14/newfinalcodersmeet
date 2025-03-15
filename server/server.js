// Add these lines to your existing server.js file

// Import the routes
const locationRoutes = require('./routes/locationRoutes');
const healthRoutes = require('./routes/healthRoutes');
const friendRequestRoutes = require('./routes/friendRequestRoutes');

// Use the routes
app.use('/api', locationRoutes);
app.use('/api', healthRoutes);
app.use('/api', friendRequestRoutes);

// Update CORS configuration
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Make sure OPTIONS requests are handled properly
app.options('*', cors());

// Add this near the top of your server.js
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
}); 