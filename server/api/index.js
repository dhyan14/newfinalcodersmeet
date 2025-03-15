// Single API endpoint for all functionality
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get the path from the URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api\//, '');

  console.log(`API request: ${req.method} ${path}`);

  // Handle different endpoints
  switch (path) {
    case 'test':
      return res.status(200).json({
        success: true,
        message: 'API test endpoint is working',
        timestamp: new Date().toISOString()
      });

    case 'users/update-location':
      return res.status(200).json({
        success: true,
        message: 'Location update endpoint is working',
        receivedData: req.body || {}
      });

    case 'users/nearby':
      return res.status(200).json({
        success: true,
        message: 'Nearby users endpoint is working',
        results: [
          {
            range: 5,
            users: [
              {
                _id: '1',
                fullName: 'Test User 1',
                email: 'test1@example.com',
                bio: 'Frontend Developer',
                skills: ['JavaScript', 'React', 'CSS'],
                distance: 5
              },
              {
                _id: '2',
                fullName: 'Test User 2',
                email: 'test2@example.com',
                bio: 'Backend Developer',
                skills: ['Node.js', 'Express', 'MongoDB'],
                distance: 5
              }
            ]
          }
        ]
      });

    case 'send-friend-request':
      return res.status(200).json({
        success: true,
        message: 'Friend request sent successfully',
        receivedData: req.body || {}
      });

    default:
      return res.status(404).json({
        success: false,
        message: `Endpoint not found: ${path}`
      });
  }
}; 