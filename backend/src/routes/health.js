const express = require('express');
const router = express.Router();
const { isConfigured } = require('../config/supabase');

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Coal Mine Management API is operational',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    databaseConfigured: isConfigured,
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;
