const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello from Vercel!');
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from API!' });
});

module.exports = app; 
