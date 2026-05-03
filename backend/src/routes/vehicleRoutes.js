/**
 * Vehicle Routes
 * API endpoints for vehicle records
 */

const express = require('express');
const VehicleController = require('../controllers/vehicleController');

const router = express.Router();

// Get all records
router.get('/', VehicleController.getAllRecords);

// Export records
router.get('/export', VehicleController.exportRecords);

// Get analytics
router.get('/analytics/summary', VehicleController.getAnalytics);

// Get single record
router.get('/:id', VehicleController.getRecordById);

// Create record
router.post('/', VehicleController.createRecord);

// Delete record
router.delete('/:id', VehicleController.deleteRecord);

module.exports = router;
