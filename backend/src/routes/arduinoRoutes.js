/**
 * Arduino Routes
 * API endpoints for Arduino communication
 */

const express = require('express');
const irEventService = require('../services/irEventService');

const router = express.Router();

// Get Arduino status
router.get('/status', (req, res) => {
  const status = irEventService.getStatus();
  res.json(status);
});

// Send command to Arduino
router.post('/command', (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({
      error: 'Command is required',
    });
  }

  const success = irEventService.sendCommand(command);

  res.json({
    success,
    command,
    message: success ? 'Command sent' : 'Failed to send command',
  });
});

// Get latest IR event
router.get('/events/latest', (req, res) => {
  // This would be improved with actual event storage
  res.json({
    message: 'Subscribe to /events/stream for real-time events',
  });
});

// Server-Sent Events stream for real-time updates
router.get('/events/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection message
  res.write('data: {"status":"connected"}\n\n');

  // Subscribe to vehicle detected events
  const onVehicleDetected = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  irEventService.onVehicleDetected(onVehicleDetected);

  // Handle client disconnect
  req.on('close', () => {
    irEventService.removeListener('vehicle_detected', onVehicleDetected);
    res.end();
  });
});

module.exports = router;
