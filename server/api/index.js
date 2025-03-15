// Minimal API endpoint
module.exports = (req, res) => {
  // Basic response
  res.status(200).json({
    success: true,
    message: 'API is working',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
}; 