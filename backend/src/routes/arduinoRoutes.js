/**
 * Arduino Routes
 * API endpoints for Arduino communication and sensor data
 */

const express = require('express');
const arduinoController = require('../controllers/arduinoController');

const router = express.Router();

// ==================== Load Cell Data ====================
// Get current load cell readings (all 4 cells + total weight)
router.get('/load-cells', arduinoController.getLoadCells);

// ==================== Component Health ====================
// Get component status (servo, IR, buck controller, sonar, webcam, etc.)
router.get('/components', arduinoController.getComponents);

// ==================== Arduino Status ====================
// Get Arduino connection status and mode (hardware/simulation)
router.get('/status', arduinoController.getStatus);

// Get latest vehicle detection data
router.get('/latest', arduinoController.getLatestData);

// ==================== Commands ====================
// Send raw command to Arduino
router.post('/command', arduinoController.sendCommand);

// Tare (calibrate zero) the scale
router.post('/tare', arduinoController.tare);

// ==================== Barrier Control ====================
// Open barrier
router.post('/barrier/open', arduinoController.openBarrier);

// Close barrier
router.post('/barrier/close', arduinoController.closeBarrier);

// ==================== Real-Time Streaming ====================
// Server-Sent Events stream for live data updates
router.get('/stream', arduinoController.streamData);

module.exports = router;
