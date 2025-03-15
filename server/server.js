// Add these lines to your existing server.js file

// Import the routes
const locationRoutes = require('./routes/locationRoutes');
const healthRoutes = require('./routes/healthRoutes');
const friendRequestRoutes = require('./routes/friendRequestRoutes');

// Use the routes
app.use('/api', locationRoutes);
app.use('/api', healthRoutes);
app.use('/api', friendRequestRoutes);

// Update CORS configuration for Vercel
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-frontend-domain.com', 'https://www.your-frontend-domain.com']
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Make sure OPTIONS requests are handled properly
app.options('*', cors());

// Add this near the top of your server.js
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codersmeet', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/health`);
}); 