// Simple serverless function for Vercel
module.exports = (req, res) => {
  res.json({
    status: 'ok',
    message: 'API test endpoint is working',
    timestamp: new Date().toISOString()
  });
}; 