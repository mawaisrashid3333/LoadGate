/**
 * Vehicle Model
 * MongoDB schema for vehicle records
 */

const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    weight: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['ALLOWED', 'BLOCKED', 'UNKNOWN'],
      default: 'UNKNOWN',
    },
    image: {
      type: String,
      default: null,
    },
    carNumber: {
      type: String,
      default: null,
    },
    // License plate detection fields
    licensePlate: {
      type: String,
      default: null,
      index: true,
    },
    detectionType: {
      type: String,
      enum: ['sonar', 'ir', 'weight', 'manual'],
      default: 'weight',
      index: true,
    },
    category: {
      type: String,
      enum: ['vehicle', 'human', 'unknown', 'other'],
      default: 'vehicle',
      index: true,
    },
    framePath: {
      type: String,
      default: null,
    },
    // Gemini AI detection results
    geminiDetection: {
      licensePlate: String,
      confidence: Number,
      vehicleType: String,
      color: String,
      make: String,
      model: String,
      detected: Boolean,
      notes: String,
      detectedAt: Date,
    },
    // Sonar detection info
    sonarDistance: {
      type: Number,
      default: null,
    },
    // Additional vehicle info
    vehicleInfo: {
      type: {
        type: String,
        enum: ['car', 'truck', 'bus', 'motorcycle', 'other'],
        default: 'other',
      },
      color: String,
      make: String,
      model: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      cameraIP: String,
      arduinoID: String,
      notes: String,
      sonarDetected: Boolean,
      irDetected: Boolean,
    },
  },
  { timestamps: true }
);

// Index for better query performance
vehicleSchema.index({ timestamp: -1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ weight: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
