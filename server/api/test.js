// Simple test endpoint
module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API test endpoint is working',
    timestamp: new Date().toISOString()
  });
}; 
