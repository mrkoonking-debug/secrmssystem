
const express = require('express');
const path = require('path');
const app = express();

// Cloud Run provides the port via environment variable
const PORT = process.env.PORT || 8080;

// Serve static files from the 'dist' directory created by Vite
app.use(express.static(path.join(__dirname, 'dist')));

// Support for Client-side routing (SPA)
// All requests that don't match a static file will serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
