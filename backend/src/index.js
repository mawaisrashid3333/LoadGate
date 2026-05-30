/**
 * LoadGate Backend - Main Entry Point
 * Smart Vehicle Weighing & Access Control System
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

// Services
const { getInstance: getArduinoService } = require('./services/arduinoService');

// Routes
const vehicleRoutes = require('./routes/vehicleRoutes');
const arduinoRoutes = require('./routes/arduinoRoutes');
const cameraRoutes = require('./routes/cameraRoutes');
const systemRoutes = require('./routes/systemRoutes');
const authRoutes = require('./routes/authRoutes');
const detectionRoutes = require('./routes/detectionRoutes');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// Static files
app.use('/public', express.static('public'));

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/loadgate';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Initialize Arduino/IR Event Service
const initializeServices = async () => {
  // Track last detection to determine if new object or duplicate
  let lastDetectedObject = null;
  let lastDetectionTime = 0;
  const MIN_DETECTION_GAP = 10000; // Minimum 10 seconds between detections to avoid API rate limiting

  // Initialize Arduino Service (includes IR event handling)
  try {
    const arduinoService = getArduinoService();
    
    // Try to connect to Arduino on configured port or fallback to simulation
    const arduinoPort = process.env.ARDUINO_PORT || '/dev/ttyUSB0';
    arduinoService.initializeSerial(arduinoPort);
    
    console.log('✓ Arduino Service initialized');
    
    // Listen for data updates
    arduinoService.on('data-updated', (data) => {
      console.log('📊 Load cell data updated:', data.vehicleData.totalWeight, 'kg');
    });

    arduinoService.on('vehicle-detected', (data) => {
      console.log('🚗 Vehicle weight:', data.totalWeight, 'kg -', data.status);
    });

    // Handle sonar detection events
    arduinoService.on('sonar-detected', async (event) => {
      console.log(`📡 Sonar detection triggered at ${event.distance}cm`);
      
      try {
        // Trigger automatic license plate detection
        const frameCaptureService = require('./services/frameCaptureService');
        const geminiService = require('./services/geminiService');
        const Vehicle = require('./models/Vehicle');

        if (!geminiService.isAvailable()) {
          console.warn('⚠ Gemini API not configured - skipping detection');
          return;
        }

        // Capture frame from buffer
        const captureResult = frameCaptureService.captureAndSaveFrame('sonar-auto');
        
        if (!captureResult.success) {
          console.error('✗ Failed to capture frame:', captureResult.error);
          return;
        }

        // Detect objects (humans or vehicles)
        const detectionResult = await geminiService.detectLicensePlate(captureResult.buffer);
        
        if (!detectionResult.success) {
          console.error('✗ Detection failed:', detectionResult.error);
          return;
        }

        const detectedData = detectionResult.data;

        // Get the current live weight from Arduino
        const liveWeight = arduinoService.getLiveWeight();
        const detectionWeight = liveWeight;
        console.log(`   ⚖️ Current live weight: ${liveWeight.toFixed(2)} kg`);

        // Create vehicle record
        const vehicleRecord = new Vehicle({
          weight: detectionWeight,
          status: 'ALLOWED',
          image: captureResult.url,
          licensePlate: detectedData.licensePlate,
          detectionType: 'sonar',
          category: detectedData.detectionType === 'human' ? 'human' : 'vehicle',
          framePath: captureResult.filepath,
          sonarDistance: event.distance,
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
            type: detectedData.vehicleInfo?.vehicleType || 'other',
            color: detectedData.vehicleInfo?.color,
            make: detectedData.vehicleInfo?.make,
            model: detectedData.vehicleInfo?.model,
          },
          metadata: {
            sonarDetected: true,
            notes: `Auto-detected by sonar at ${event.distance.toFixed(2)}cm - Type: ${detectedData.detectionType} - Weight: ${detectionWeight ? detectionWeight.toFixed(2) + 'kg' : 'N/A'}`,
          },
        });

        await vehicleRecord.save();

        console.log(`✓ Sonar detection saved - Type: ${detectedData.detectionType}, License Plate: ${detectedData.licensePlate || 'Not detected'}, Weight: ${detectionWeight ? detectionWeight.toFixed(2) + ' kg' : 'N/A'}`);
      } catch (error) {
        console.error('✗ Error processing sonar detection:', error.message);
      }
    });

    // Handle human detection events
    arduinoService.on('human-detected', async (event) => {
      console.log(`👤 [HUMAN DETECTION] Sonar detected human at ${event.distance?.toFixed(2)}cm`);
      
      // Check detection cooldown to avoid API rate limiting
      const timeSinceLastDetection = Date.now() - lastDetectionTime;
      if (timeSinceLastDetection < MIN_DETECTION_GAP) {
        const waitTime = MIN_DETECTION_GAP - timeSinceLastDetection;
        console.log(`   ⏱ Cooling down: ${Math.ceil(waitTime / 1000)}s before next detection (rate limit protection)`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      console.log(`   ⏱ Waiting 500ms before frame capture...`);
      
      try {
        const frameCaptureService = require('./services/frameCaptureService');
        const geminiService = require('./services/geminiService');
        const Vehicle = require('./models/Vehicle');

        if (!geminiService.isAvailable()) {
          console.error('✗ [HUMAN] Gemini API not configured - cannot process');
          return;
        }

        // Wait 500ms for stable frame
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`   📸 Capturing frame after 500ms delay...`);

        // Capture frame from buffer (synchronous - gets 4th frame from stream)
        const captureResult = frameCaptureService.captureAndSaveFrame('human-detection');
        
        if (!captureResult.success) {
          console.error('✗ [HUMAN] Failed to capture frame:', captureResult.error);
          return;
        }

        // Get the current live weight from Arduino (after 3 seconds of additional readings)
        const liveWeight = arduinoService.getLiveWeight();
        console.log(`   ⚖️ Current live weight: ${liveWeight.toFixed(2)} kg (updated from: ${event.weight?.toFixed(2)} kg)`);

        console.log(`   ✓ Frame captured: ${captureResult.filename}`);
        console.log(`   🤖 Sending to Gemini for categorization...`);

        // Send to Gemini for categorization and allow/block decision
        const categorizationResult = await geminiService.categorizeAndDecide(captureResult.buffer);
        
        let categorization;
        if (!categorizationResult.success) {
          console.error('✗ [HUMAN] Gemini categorization failed:', categorizationResult.error);
          console.log('   ⚠ Proceeding with default fallback due to API failure...');
          categorization = {
            category: 'human',
            allow: true,
            confidence: 0,
            description: 'Fallback detection (Human triggering IR or Sonar)',
            objectPresent: true,
            reason: 'Default allowed during API failure/rate limit',
            details: {}
          };
        } else {
          categorization = categorizationResult.data;
        }

        console.log(`   📊 Gemini/Fallback Response:`);
        console.log(`      - Category: ${categorization.category}`);
        console.log(`      - Description: ${categorization.description}`);
        console.log(`      - Allow: ${categorization.allow}`);
        console.log(`      - Confidence: ${categorization.confidence}%`);
        console.log(`      - Reason: ${categorization.reason}`);

        let recordStatus = 'UNKNOWN';
        if (categorization.allow === true) recordStatus = 'ALLOWED';
        else if (categorization.allow === false) recordStatus = 'BLOCKED';

        // Use the live weight captured at frame time (more accurate than initial detection)
        const detectionWeight = liveWeight;

        // Save detection record
        const detectionRecord = new Vehicle({
          weight: detectionWeight,
          status: recordStatus,
          image: captureResult.url,
          licensePlate: categorization.details?.licensePlate || null,
          detectionType: 'sonar',
          category: 'human',
          framePath: captureResult.filepath,
          sonarDistance: event.distance || 0,
          geminiDetection: {
            licensePlate: categorization.details?.licensePlate || null,
            confidence: categorization.confidence || 0,
            vehicleType: null,
            color: categorization.details?.color || null,
            make: null,
            model: null,
            detected: categorization.objectPresent,
            notes: `${categorization.reason} - ${categorization.description}`,
            detectedAt: new Date(),
          },
          vehicleInfo: {
            type: 'other',
            color: null,
            make: null,
            model: null
          },
          metadata: {
            sonarDetected: true,
            geminiCategory: categorization.category,
            geminiAllow: categorization.allow,
            geminiReason: categorization.reason,
            weight: detectionWeight,
            notes: `Human detected at ${event.distance?.toFixed(2)}cm - Weight: ${detectionWeight ? detectionWeight.toFixed(2) + 'kg' : 'N/A'} - Status: ${recordStatus} (${categorization.reason})`,
          },
        });

        await detectionRecord.save();
        lastDetectionTime = Date.now(); // Update cooldown timer
        console.log(`   ✓ [HUMAN] Detection record saved - Category: ${categorization.category}, Status: ${categorization.allow ? 'ALLOWED' : 'BLOCKED'}`);
        console.log(`      - Image URL: ${detectionRecord.image}`);
        console.log(`      - Weight: ${detectionWeight ? detectionWeight.toFixed(2) + ' kg' : '0.00 kg'}`);

        // Send allow/block command to Arduino
        if (categorization.allow) {
          arduinoService.allowDetection();
        } else {
          arduinoService.blockDetection();
        }
      } catch (error) {
        console.error('✗ [HUMAN] Fatal error processing detection:', error.message);
        console.error('   Stack:', error.stack);
      }
    });

    // Handle sonar vehicle detection events
    arduinoService.on('sonar-vehicle-detected', async (event) => {
      console.log(`🚗 [VEHICLE DETECTION] Sonar detected vehicle at ${event.distance?.toFixed(2)}cm`);
      
      // Check detection cooldown to avoid API rate limiting
      const timeSinceLastDetection = Date.now() - lastDetectionTime;
      if (timeSinceLastDetection < MIN_DETECTION_GAP) {
        const waitTime = MIN_DETECTION_GAP - timeSinceLastDetection;
        console.log(`   ⏱ Cooling down: ${Math.ceil(waitTime / 1000)}s before next detection (rate limit protection)`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      console.log(`   ⏱ Waiting 500ms before frame capture...`);
      
      try {
        const frameCaptureService = require('./services/frameCaptureService');
        const geminiService = require('./services/geminiService');
        const Vehicle = require('./models/Vehicle');

        if (!geminiService.isAvailable()) {
          console.error('✗ [VEHICLE] Gemini API not configured - cannot process');
          return;
        }

        // Wait 500ms for stable frame
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`   📸 Capturing frame after 500ms delay...`);

        // Capture frame from buffer (synchronous - gets 4th frame from stream)
        const captureResult = frameCaptureService.captureAndSaveFrame('sonar-vehicle');
        
        if (!captureResult.success) {
          console.error('✗ [VEHICLE] Failed to capture frame:', captureResult.error);
          return;
        }

        // Get the current live weight from Arduino (after 3 seconds of additional readings)
        const liveWeight = arduinoService.getLiveWeight();
        console.log(`   ⚖️ Current live weight: ${liveWeight.toFixed(2)} kg (updated from: ${event.weight?.toFixed(2)} kg)`);

        console.log(`   ✓ Frame captured: ${captureResult.filename}`);
        console.log(`   🤖 Sending to Gemini for categorization...`);

        // Send to Gemini for categorization and allow/block decision
        const categorizationResult = await geminiService.categorizeAndDecide(captureResult.buffer);
        
        let categorization;
        if (!categorizationResult.success) {
          console.error('✗ [VEHICLE] Gemini categorization failed:', categorizationResult.error);
          if (categorizationResult.errorCode === 429) {
            console.error('   ⚠ Rate limited - wait before next detection');
          } else if (categorizationResult.errorCode === 403) {
            console.error('   ⚠ API authentication issue');
          }
          
          console.log('   ⚠ Proceeding with default fallback due to API failure...');
          categorization = {
            category: 'vehicle',
            allow: true,
            confidence: 0,
            description: 'Fallback detection (Vehicle trigger)',
            objectPresent: true,
            reason: 'Default allowed during API failure/rate limit',
            details: {}
          };
        } else {
          categorization = categorizationResult.data;
        }

        console.log(`   📊 Gemini/Fallback Response:`);
        console.log(`      - Category: ${categorization.category}`);
        console.log(`      - Vehicle Type: ${categorization.category === 'HTV' ? 'Heavy Transport' : categorization.category === 'LTV' ? 'Light Transport' : categorization.category}`);
        console.log(`      - Description: ${categorization.description}`);
        console.log(`      - Allow: ${categorization.allow}`);
        console.log(`      - Confidence: ${categorization.confidence}%`);
        console.log(`      - Reason: ${categorization.reason}`);
        console.log(`      - License Plate: ${categorization.details?.licensePlate || 'Not detected'}`);

        // Map Gemini category to schema values
        const rawCat = categorization.category;
        let schemaCategory = 'unknown';
        if (['HTV', 'LTV', 'bike'].includes(rawCat)) schemaCategory = 'vehicle';
        else if (rawCat === 'human') schemaCategory = 'human';
        else if (rawCat === 'other') schemaCategory = 'other';

        let vInfoType = 'other';
        if (rawCat === 'HTV') vInfoType = 'truck';
        else if (rawCat === 'LTV') vInfoType = 'car';
        else if (rawCat === 'bike') vInfoType = 'motorcycle';

        let recordStatus = 'UNKNOWN';
        if (categorization.allow === true) recordStatus = 'ALLOWED';
        else if (categorization.allow === false) recordStatus = 'BLOCKED';

        // Use the live weight captured at frame time (more accurate than initial detection)
        const detectionWeight = liveWeight;

        // Save detection record
        const vehicleRecord = new Vehicle({
          weight: detectionWeight,
          status: recordStatus,
          image: captureResult.url,
          licensePlate: categorization.details?.licensePlate || null,
          detectionType: 'sonar',
          category: schemaCategory,
          framePath: captureResult.filepath,
          sonarDistance: event.distance || 0,
          geminiDetection: {
            licensePlate: categorization.details?.licensePlate || null,
            confidence: categorization.confidence || 0,
            vehicleType: rawCat,
            color: categorization.details?.color || null,
            make: categorization.details?.make || null,
            model: null,
            detected: categorization.objectPresent,
            notes: `${categorization.reason} - ${categorization.description}`,
            detectedAt: new Date(),
          },
          vehicleInfo: {
            type: vInfoType,
            color: categorization.details?.color || null,
            make: categorization.details?.make || null,
            model: categorization.details?.model || null,
          },
          metadata: {
            sonarDetected: true,
            geminiCategory: rawCat,
            geminiAllow: categorization.allow,
            geminiReason: categorization.reason,
            weight: detectionWeight,
            notes: `${rawCat} detected at ${event.distance?.toFixed(2)}cm - Weight: ${detectionWeight ? detectionWeight.toFixed(2) + 'kg' : 'N/A'} - Status: ${recordStatus} - Plate: ${categorization.details?.licensePlate || 'Not detected'}`,
          },
        });

        await vehicleRecord.save();
        lastDetectionTime = Date.now(); // Update cooldown timer
        console.log(`   ✓ [VEHICLE] Detection record saved - Category: ${categorization.category}, Status: ${categorization.allow ? 'ALLOWED' : 'BLOCKED'}`);
        console.log(`      - Image URL: ${vehicleRecord.image}`);
        console.log(`      - Weight: ${detectionWeight ? detectionWeight.toFixed(2) + ' kg' : 'N/A'}`);

        // Send allow/block command to Arduino
        if (categorization.allow) {
          arduinoService.allowDetection();
        } else {
          arduinoService.blockDetection();
        }
      } catch (error) {
        console.error('✗ [VEHICLE] Fatal error processing detection:', error.message);
        console.error('   Stack:', error.stack);
      }
    });

    // Handle ground detection (sonar pointing at ground)
    arduinoService.on('ground-detected', async (event) => {
      console.log(`🔍 Ground detected at ${event.distance?.toFixed(2)}cm (sonar facing down)`);
      
      try {
        const frameCaptureService = require('./services/frameCaptureService');
        const Vehicle = require('./models/Vehicle');

        // Capture frame from buffer
        const captureResult = frameCaptureService.captureAndSaveFrame('ground-detection');
        
        if (!captureResult.success) {
          console.error('✗ Failed to capture frame:', captureResult.error);
          return;
        }

        // Save ground detection record
        const detectionRecord = new Vehicle({
          weight: 0,
          status: 'ALLOWED',
          image: captureResult.url,
          licensePlate: null,
          detectionType: 'sonar',
          category: 'ground',
          framePath: captureResult.filepath,
          sonarDistance: event.distance || 0,
          metadata: {
            sonarDetected: true,
            notes: `Ground detected at ${event.distance?.toFixed(2) || '?'}cm - Sonar pointing downward`,
          },
        });

        await detectionRecord.save();
        console.log(`✓ Ground detection saved`);
      } catch (error) {
        console.error('✗ Error processing ground detection:', error.message);
      }
    });

    // Handle ceiling detection (sonar pointing at ceiling)
    arduinoService.on('ceiling-detected', async (event) => {
      console.log(`🔍 Ceiling detected at ${event.distance?.toFixed(2)}cm (sonar facing up)`);
      
      try {
        const frameCaptureService = require('./services/frameCaptureService');
        const Vehicle = require('./models/Vehicle');

        // Capture frame from buffer
        const captureResult = frameCaptureService.captureAndSaveFrame('ceiling-detection');
        
        if (!captureResult.success) {
          console.error('✗ Failed to capture frame:', captureResult.error);
          return;
        }

        // Save ceiling detection record
        const detectionRecord = new Vehicle({
          weight: 0,
          status: 'ALLOWED',
          image: captureResult.url,
          licensePlate: null,
          detectionType: 'sonar',
          category: 'ceiling',
          framePath: captureResult.filepath,
          sonarDistance: event.distance || 0,
          metadata: {
            sonarDetected: true,
            notes: `Ceiling detected at ${event.distance?.toFixed(2) || '?'}cm - Sonar pointing upward`,
          },
        });

        await detectionRecord.save();
        console.log(`✓ Ceiling detection saved`);
      } catch (error) {
        console.error('✗ Error processing ceiling detection:', error.message);
      }
    });

    // Listen for IR events (compatibility)
    arduinoService.onVehicleDetected((event) => {
      console.log('🚗 Vehicle Detected (IR):', event);
      // Broadcast to connected clients via SSE
    });

    arduinoService.onWeightUpdate((update) => {
      console.log('⚖️  Weight update:', update.weight, 'kg');
    });

    arduinoService.onBarrierStatus((status) => {
      console.log('🚧 Barrier status:', status.status);
    });
  } catch (error) {
    console.warn('⚠️  Arduino Service error:', error.message);
    console.warn('   System will continue with simulation mode');
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'LoadGate API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/arduino', arduinoRoutes);
app.use('/api/camera', cameraRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/detection', detectionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await initializeServices();
    
    app.listen(PORT, () => {
      console.log(`\n🚀 LoadGate Backend Server`);
      console.log(`📍 Running on http://localhost:${PORT}`);
      console.log(`🌐 CORS enabled for ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`📡 Arduino & IR Services ready\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n📍 Shutting down gracefully...');
  const arduinoService = getArduinoService();
  arduinoService.disconnect();
  mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
