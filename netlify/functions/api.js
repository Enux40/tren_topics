const serverless = require('serverless-http');
const { app } = require('../../app');

// Wrap the Express app for Netlify's serverless runtime
exports.handler = serverless(app);
