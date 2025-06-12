/**
 * Simple Express server that serves the test.html file with environment variables
 * injected from the .env file
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve the minimal test page with injected environment variables
app.get('/env-test', (req, res) => {
  // Read the minimal-test.html template
  fs.readFile(path.join(__dirname, 'minimal-test.html'), 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading template:', err);
      return res.status(500).send('Error reading template');
    }

    // Extract relevant environment variables
    const envVars = {
      AUTH_PROXY_URL: process.env.AUTH_PROXY_URL || 'https://dmp-token-proxy.azurewebsites.net',
      AUTH_PROXY_TOKEN_ENDPOINT: process.env.AUTH_PROXY_TOKEN_ENDPOINT || '/token',
      API_BASE_URL: process.env.API_BASE_URL || 'https://dmp-apim.azure-api.net'
    };

    // Replace the placeholder in the template with actual environment variables
    const injectedHtml = data.replace(
      '// Configuration - normally would be loaded from .env',
      `// Configuration loaded from .env file
      const AUTH_PROXY_URL = '${envVars.AUTH_PROXY_URL}';
      const AUTH_PROXY_TOKEN_ENDPOINT = '${envVars.AUTH_PROXY_TOKEN_ENDPOINT}';
      const API_BASE_URL = '${envVars.API_BASE_URL}';`
    );

    // Send the modified HTML
    res.send(injectedHtml);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Environment test page available at http://localhost:${PORT}/env-test`);
  console.log(`Using AUTH_PROXY_URL: ${process.env.AUTH_PROXY_URL}`);
});
