/**
 * Vehicle Model
 * MongoDB schema for vehicle records
 */

const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    weight: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['ALLOWED', 'BLOCKED'],
      required: true,
    },
    image: {
      type: String,
      default: null,
    },
    carNumber: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      cameraIP: String,
      arduinoID: String,
      notes: String,
    },
  },
  { timestamps: true }
);

// Index for better query performance
vehicleSchema.index({ timestamp: -1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ weight: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
