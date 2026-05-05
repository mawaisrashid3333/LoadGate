/**
 * Arduino Controller
 * API endpoints for Arduino data and component health
 */

const { getInstance: getArduinoService } = require('../services/arduinoService');

/**
 * Get current load cell readings
 * GET /api/arduino/load-cells
 */
exports.getLoadCells = (req, res) => {
  try {
    const arduinoService = getArduinoService();
    const loadCellData = arduinoService.getLoadCellData();
    
    res.json({
      success: true,
      data: loadCellData,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting load cell data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get component health status
 * GET /api/arduino/components
 */
exports.getComponents = (req, res) => {
  try {
    const arduinoService = getArduinoService();
    const componentStatus = arduinoService.getComponentStatus();
    
    res.json({
      success: true,
      data: componentStatus,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting component status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get Arduino connection status
 * GET /api/arduino/status
 */
exports.getStatus = (req, res) => {
  try {
    const arduinoService = getArduinoService();
    const status = arduinoService.getConnectionStatus();
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting Arduino status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get latest vehicle detection data
 * GET /api/arduino/latest
 */
exports.getLatestData = (req, res) => {
  try {
    const arduinoService = getArduinoService();
    const latestData = arduinoService.getLatestVehicleData();
    
    res.json({
      success: true,
      data: latestData,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting latest data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Send command to Arduino
 * POST /api/arduino/command
 * Body: { command: "TARE" | "OPEN" | "CLOSE" | "INFO" }
 */
exports.sendCommand = (req, res) => {
  try {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({
        success: false,
        error: 'Command is required',
      });
    }

    const arduinoService = getArduinoService();
    const success = arduinoService.sendCommand(command);

    res.json({
      success,
      command,
      message: success ? 'Command sent to Arduino' : 'Failed to send command',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error sending command:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Tare (calibrate zero) the scale
 * POST /api/arduino/tare
 */
exports.tare = (req, res) => {
  try {
    const arduinoService = getArduinoService();
    const success = arduinoService.tare();

    res.json({
      success,
      message: success ? 'Scale tared successfully' : 'Failed to tare scale',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error taring scale:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Open barrier (servo)
 * POST /api/arduino/barrier/open
 */
exports.openBarrier = (req, res) => {
  try {
    const arduinoService = getArduinoService();
    const success = arduinoService.openBarrier();

    res.json({
      success,
      message: success ? 'Barrier opened' : 'Failed to open barrier',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error opening barrier:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Close barrier (servo)
 * POST /api/arduino/barrier/close
 */
exports.closeBarrier = (req, res) => {
  try {
    const arduinoService = getArduinoService();
    const success = arduinoService.closeBarrier();

    res.json({
      success,
      message: success ? 'Barrier closed' : 'Failed to close barrier',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error closing barrier:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Stream live Arduino data (Server-Sent Events)
 * GET /api/arduino/stream
 */
exports.streamData = (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial connection message
    res.write('data: {"connected": true, "timestamp": ' + Date.now() + '}\n\n');

    const arduinoService = getArduinoService();

    // Send data updates
    const dataHandler = (data) => {
      res.write('data: ' + JSON.stringify(data) + '\n\n');
    };

    const vehicleHandler = (data) => {
      res.write('data: ' + JSON.stringify({ type: 'vehicle', data }) + '\n\n');
    };

    arduinoService.on('data-updated', dataHandler);
    arduinoService.on('vehicle-detected', vehicleHandler);

    // Handle client disconnect
    req.on('close', () => {
      arduinoService.removeListener('data-updated', dataHandler);
      arduinoService.removeListener('vehicle-detected', vehicleHandler);
      res.end();
    });
  } catch (error) {
    console.error('Error streaming Arduino data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
