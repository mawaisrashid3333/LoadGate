/**
 * Settings Model
 * MongoDB schema for system settings
 */

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    maxWeightLimit: {
      type: Number,
      default: 5000,
      description: 'Maximum weight limit in kg',
    },
    calibrationFactor: {
      type: Number,
      default: 20.0,
      description: 'Weight sensor calibration factor',
    },
    systemName: {
      type: String,
      default: 'LoadGate System',
    },
    location: {
      type: String,
      default: 'Main Gate',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    arduinoConfig: {
      port: {
        type: String,
        default: 'COM3',
      },
      baudRate: {
        type: Number,
        default: 9600,
      },
    },
    cameraConfig: {
      url: String,
      username: String,
      password: String,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
