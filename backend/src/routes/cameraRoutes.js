/**
 * Camera Routes
 * API endpoints for camera operations
 */

const express = require('express');
const cameraService = require('../services/cameraService');

const router = express.Router();

// Get camera status
router.get('/status', async (req, res) => {
  const status = await cameraService.checkConnection();
  res.json(status);
});

// Get live stream URL
router.get('/stream', (req, res) => {
  res.json({
    streamUrl: cameraService.getLiveStreamUrl(),
  });
});

// Capture snapshot
router.post('/snapshot', async (req, res) => {
  const snapshot = await cameraService.captureSnapshot();

  if (!snapshot) {
    return res.status(500).json({
      error: 'Failed to capture snapshot',
    });
  }

  res.json({
    success: true,
    data: snapshot,
  });
});

module.exports = router;
