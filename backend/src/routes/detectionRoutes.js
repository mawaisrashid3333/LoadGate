/**
 * License Plate Detection Routes
 * Handles sonar events, frame capture, and Gemini AI processing
 */

const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const frameCaptureService = require('../services/frameCaptureService');
const geminiService = require('../services/geminiService');

/**
 * POST /api/detection/sonar
 * Handle sonar detection event from Arduino
 * Captures frame and triggers Gemini detection (vehicle or human)
 */
router.post('/sonar', async (req, res) => {
  try {
    const { distance, weight = null, sonarTimestamp = null, detectionType = null } = req.body;

    console.log(`📡 Sonar detection: ${distance}cm`);

    // Check if Gemini is available
    if (!geminiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Gemini API not configured',
        message: 'Set GOOGLE_GEMINI_API_KEY in .env to enable detection',
      });
    }

    try {
      // Capture frame from camera stream
      const captureResult = await frameCaptureService.captureAndSaveFrame('sonar-detection');

      if (!captureResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to capture frame',
          details: captureResult.error,
        });
      }

      // Send frame to Gemini for detection (vehicles, humans, or license plates)
      const detectionResult = await geminiService.detectLicensePlate(captureResult.buffer);

      if (!detectionResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Detection failed',
          details: detectionResult.error,
        });
      }

      const detectedData = detectionResult.data;

      // Create vehicle/detection record with detection data
      const vehicleRecord = new Vehicle({
        weight: weight || 0,
        status: 'ALLOWED',
        image: captureResult.url,
        licensePlate: detectedData.licensePlate || null,
        detectionType: 'sonar',
        category: detectedData.detectionType === 'human' ? 'human' : 'vehicle',
        framePath: captureResult.filepath,
        sonarDistance: distance,
        geminiDetection: {
          licensePlate: detectedData.licensePlate,
          confidence: detectedData.confidence,
          vehicleType: detectedData.vehicleInfo?.vehicleType,
          color: detectedData.vehicleInfo?.color,
          make: detectedData.vehicleInfo?.make,
          model: detectedData.vehicleInfo?.model,
          detected: detectedData.objectDetected,
          notes: detectedData.notes,
          detectedAt: new Date(),
        },
        vehicleInfo: {
          type: detectedData.detectionType === 'human' ? 'human' : detectedData.vehicleInfo?.vehicleType,
          color: detectedData.vehicleInfo?.color,
          make: detectedData.vehicleInfo?.make,
          model: detectedData.vehicleInfo?.model,
        },
        metadata: {
          sonarDetected: true,
          notes: `${detectedData.detectionType === 'human' ? 'Human' : 'Vehicle'} detected by sonar at ${distance}cm`,
        },
      });

      // Save to database
      await vehicleRecord.save();

      const responseData = {
        success: true,
        message: 'Sonar detection processed successfully',
        detectionType: detectedData.detectionType,
      };

      if (detectedData.detectionType === 'human') {
        responseData.detection = {
          type: 'HUMAN',
          count: detectedData.humanInfo?.count,
          description: detectedData.humanInfo?.description,
          pose: detectedData.humanInfo?.pose,
          confidence: detectedData.confidence,
          frameUrl: captureResult.url,
          timestamp: new Date(),
        };
        console.log(`✓ Human detection processed - Count: ${detectedData.humanInfo?.count}`);
      } else if (detectedData.detectionType === 'vehicle' || detectedData.detectionType === 'both') {
        responseData.detection = {
          licensePlate: detectedData.licensePlate,
          confidence: detectedData.confidence,
          vehicleType: detectedData.vehicleInfo?.vehicleType,
          color: detectedData.vehicleInfo?.color,
          make: detectedData.vehicleInfo?.make,
          model: detectedData.vehicleInfo?.model,
          frameUrl: captureResult.url,
          timestamp: new Date(),
        };
        console.log(`✓ Vehicle detection processed - License Plate: ${detectedData.licensePlate || 'Not detected'}`);
      }

      responseData.vehicleId = vehicleRecord._id;

      res.json(responseData);
    } catch (error) {
      console.error('✗ Sonar processing error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Processing failed',
        details: error.message,
      });
    }
  } catch (error) {
    console.error('✗ Sonar endpoint error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/detection/latest
 * Get the latest detection result
 */
router.get('/latest', async (req, res) => {
  try {
    const latest = await Vehicle.findOne({})
      .sort({ timestamp: -1 })
      .limit(1);

    if (!latest) {
      return res.json({
        success: true,
        data: null,
        message: 'No detections yet',
      });
    }

    res.json({
      success: true,
      data: latest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/detection/by-license-plate/:plate
 * Search vehicles by license plate
 */
router.get('/by-license-plate/:plate', async (req, res) => {
  try {
    const { plate } = req.params;

    const vehicles = await Vehicle.find({
      licensePlate: new RegExp(plate.toUpperCase(), 'i'),
    })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/detection/stats
 * Get detection statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const stats = await Vehicle.aggregate([
      { $match: { timestamp: { $gte: startTime } } },
      {
        $group: {
          _id: null,
          totalDetections: { $sum: 1 },
          byType: {
            $push: '$vehicleInfo.type',
          },
          byLicensePlate: {
            $addToSet: '$licensePlate',
          },
          avgConfidence: { $avg: '$geminiDetection.confidence' },
        },
      },
    ]);

    const frameStats = frameCaptureService.getStats();

    res.json({
      success: true,
      timeframe: `${hours} hours`,
      detectionStats: stats[0] || {
        totalDetections: 0,
        byType: [],
        byLicensePlate: [],
        avgConfidence: 0,
      },
      frameStats,
      geminiStatus: geminiService.getStatus(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/detection/manual-capture
 * Manually capture and process current frame
 */
router.post('/manual-capture', async (req, res) => {
  try {
    if (!geminiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Gemini API not configured',
      });
    }

    // Capture frame
    const captureResult = await frameCaptureService.captureAndSaveFrame('manual');

    if (!captureResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Frame capture failed',
        details: captureResult.error,
      });
    }

    // Detect license plate
    const detectionResult = await geminiService.detectLicensePlate(captureResult.buffer);

    if (!detectionResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Detection failed',
        details: detectionResult.error,
      });
    }

    const detectedData = detectionResult.data;

    // Create vehicle record
    const vehicleRecord = new Vehicle({
      weight: 0,
      status: 'ALLOWED',
      image: captureResult.url,
      licensePlate: detectedData.licensePlate,
      detectionType: 'manual',
      category: detectedData.detectionType === 'human' ? 'human' : 'vehicle',
      framePath: captureResult.filepath,
      geminiDetection: {
        licensePlate: detectedData.licensePlate,
        confidence: detectedData.confidence,
        vehicleType: detectedData.vehicleInfo?.vehicleType,
        color: detectedData.vehicleInfo?.color,
        make: detectedData.vehicleInfo?.make,
        model: detectedData.vehicleInfo?.model,
        detected: detectedData.objectDetected,
        notes: detectedData.notes,
        detectedAt: new Date(),
      },
      vehicleInfo: {
        type: detectedData.detectionType === 'human' ? 'human' : detectedData.vehicleInfo?.vehicleType,
        color: detectedData.vehicleInfo?.color,
        make: detectedData.vehicleInfo?.make,
        model: detectedData.vehicleInfo?.model,
      },
      metadata: {
        notes: 'Manual capture',
      },
    });

    await vehicleRecord.save();

    res.json({
      success: true,
      message: 'Manual capture processed',
      detection: {
        objectDetected: detectedData.objectDetected,
        detectionType: detectedData.detectionType,
        licensePlate: detectedData.licensePlate,
        confidence: detectedData.confidence,
        vehicleInfo: detectedData.vehicleInfo,
        humanInfo: detectedData.humanInfo,
        frameUrl: captureResult.url,
      },
      vehicleId: vehicleRecord._id,
    });
  } catch (error) {
    console.error('✗ Manual capture error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/detection/cleanup
 * Clean up old captures
 */
router.delete('/cleanup', (req, res) => {
  try {
    const { hoursOld = 24 } = req.query;
    const result = frameCaptureService.cleanupOldCaptures(parseInt(hoursOld));

    res.json({
      success: result.success,
      message: result.success 
        ? `Deleted ${result.deletedCount} captures, freed ${result.freedSizeMB} MB`
        : result.error,
      stats: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
