// Absolute minimal API handler for Vercel
module.exports = (req, res) => {
  // No imports, no complexity, just a simple response
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Return basic success response
  res.status(200).send(JSON.stringify({
    success: true,
    message: 'API is working',
    time: new Date().toISOString()
  }));
}; 