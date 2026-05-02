/**
 * Vehicle Controller
 * Handles vehicle record operations
 */

const Vehicle = require('../models/Vehicle');

class VehicleController {
  /**
   * Create new vehicle record
   */
  static async createRecord(req, res) {
    try {
      const { weight, status, image, carNumber } = req.body;

      const vehicle = new Vehicle({
        weight,
        status,
        image,
        carNumber,
        timestamp: new Date(),
      });

      await vehicle.save();

      res.status(201).json({
        success: true,
        message: 'Vehicle record created',
        data: vehicle,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get all vehicle records
   */
  static async getAllRecords(req, res) {
    try {
      const { limit = 50, skip = 0, status, startDate, endDate } = req.query;

      let query = {};

      if (status) {
        query.status = status;
      }

      if (startDate && endDate) {
        query.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const records = await Vehicle.find(query)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      const total = await Vehicle.countDocuments(query);

      res.json({
        success: true,
        data: records,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get single record by ID
   */
  static async getRecordById(req, res) {
    try {
      const { id } = req.params;
      const record = await Vehicle.findById(id);

      if (!record) {
        return res.status(404).json({
          success: false,
          error: 'Record not found',
        });
      }

      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Delete record
   */
  static async deleteRecord(req, res) {
    try {
      const { id } = req.params;
      const record = await Vehicle.findByIdAndDelete(id);

      if (!record) {
        return res.status(404).json({
          success: false,
          error: 'Record not found',
        });
      }

      res.json({
        success: true,
        message: 'Record deleted',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get analytics
   */
  static async getAnalytics(req, res) {
    try {
      const { days = 7 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const records = await Vehicle.find({
        timestamp: { $gte: startDate },
      });

      const totalVehicles = records.length;
      const allowedVehicles = records.filter((r) => r.status === 'ALLOWED').length;
      const blockedVehicles = records.filter((r) => r.status === 'BLOCKED').length;
      const avgWeight =
        records.length > 0
          ? records.reduce((sum, r) => sum + r.weight, 0) / records.length
          : 0;

      res.json({
        success: true,
        data: {
          totalVehicles,
          allowedVehicles,
          blockedVehicles,
          averageWeight: avgWeight.toFixed(2),
          period: `Last ${days} days`,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = VehicleController;
