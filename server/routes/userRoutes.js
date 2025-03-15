// Add a test endpoint
router.get('/test', (req, res) => {
  res.status(200).json({
    message: 'User API is working',
    timestamp: new Date().toISOString()
  });
}); 