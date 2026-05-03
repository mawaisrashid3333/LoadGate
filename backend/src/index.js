/**
 * LoadGate Backend - Main Entry Point
 * Smart Vehicle Weighing & Access Control System
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

// Services
const irEventService = require('./services/irEventService');

// Routes
const vehicleRoutes = require('./routes/vehicleRoutes');
const arduinoRoutes = require('./routes/arduinoRoutes');
const cameraRoutes = require('./routes/cameraRoutes');
const systemRoutes = require('./routes/systemRoutes');

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
const initializeIRService = async () => {
  try {
    await irEventService.initialize(process.env.ARDUINO_PORT || 'COM3');
    console.log('✓ IR Event Service initialized');

    // Listen for vehicle detection events
    irEventService.onVehicleDetected((event) => {
      console.log('🚗 Vehicle Detected:', event);
      // Broadcast to connected clients via SSE
    });
  } catch (error) {
    console.warn('⚠️  IR Event Service not available:', error.message);
    console.warn('   System will continue without Arduino connection');
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
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/arduino', arduinoRoutes);
app.use('/api/camera', cameraRoutes);
app.use('/api/system', systemRoutes);

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
    await initializeIRService();
    
    app.listen(PORT, () => {
      console.log(`\n🚀 LoadGate Backend Server`);
      console.log(`📍 Running on http://localhost:${PORT}`);
      console.log(`🌐 CORS enabled for ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`📡 IR Event Service ready\n`);
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
  irEventService.disconnect();
  mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
