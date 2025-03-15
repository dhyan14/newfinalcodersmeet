// Simple login test endpoint
module.exports = (req, res) => {
  try {
    const { email, password } = req.body || {};
    
    // Log request details for debugging
    console.log('Login test request:', { 
      method: req.method,
      headers: req.headers,
      body: { email, password: password ? '******' : undefined }
    });
    
    // Return a success response for testing
    res.status(200).json({
      status: 'success',
      message: 'Login test endpoint working',
      timestamp: new Date().toISOString(),
      receivedData: { email }
    });
  } catch (error) {
    console.error('Login test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error in login test endpoint',
      error: error.message
    });
  }
}; 