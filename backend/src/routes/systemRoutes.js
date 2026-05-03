/**
 * System Routes
 * Handles system health, control, and configuration endpoints
 */

const express = require('express');
const SystemController = require('../controllers/systemController');

const router = express.Router();

// System Health & Info
router.get('/health', SystemController.getSystemHealth);
router.get('/components/health', SystemController.getComponentsHealth);
router.get('/info', SystemController.getSystemInfo);

// System Control
router.post('/restart', SystemController.restartSystem);
router.post('/shutdown', SystemController.shutdownSystem);
router.post('/test', SystemController.testBarrier);
router.post('/calibrate', SystemController.calibrateScale);
router.post('/clear-logs', SystemController.clearLogs);
router.post('/export-logs', SystemController.exportLogs);

// Settings
router.post('/settings', SystemController.saveSettings);
router.get('/settings', SystemController.getSettings);

module.exports = router;
