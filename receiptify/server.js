const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, 'build')));

// Configuration endpoint to expose the API Gateway URL
app.get('/config', (req, res) => {
  res.json({
    imageUploadApiGateway: process.env.REACT_APP_IMAGE_UPLOAD_API_GATEWAY_URL || 'https://default-api-url',
    fetchResultsApiGateway: process.env.REACT_APP_FETCH_RESULTS_API_GATEWAY_URL || 'https://default-api-url',
    stepFunctionApiGateway: process.env.REACT_APP_STEP_FUNCTION_API_GATEWAY_URL || 'https://default-api-url'
  });
});

// Fallback to serve the React app for all other routes (SPA routing)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

app.all('/{*any}', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});