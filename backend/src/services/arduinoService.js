/**
 * Arduino Service
 * Manages serial communication with Arduino for load cell data and sensor monitoring
 */

const EventEmitter = require('events');

class ArduinoService extends EventEmitter {
  constructor() {
    super();
    this.serialPort = null;
    this.isConnected = false;
    
    // Load cell data storage (4 cells)
    this.loadCells = {
      L1: { value: 0, status: 'disconnected', lastUpdate: null },
      L2: { value: 0, status: 'disconnected', lastUpdate: null },
      L3: { value: 0, status: 'disconnected', lastUpdate: null },
      L4: { value: 0, status: 'disconnected', lastUpdate: null },
    };

    // Component status
    this.components = {
      loadCells: { status: 'disconnected', lastUpdate: null },
      hx711: { status: 'disconnected', lastUpdate: null },
      servo: { status: 'disconnected', lastUpdate: null },
      irSensor: { status: 'disconnected', lastUpdate: null },
      buckController: { status: 'disconnected', lastUpdate: null },
      sonar: { status: 'disconnected', lastUpdate: null },
      ipWebcam: { status: 'disconnected', lastUpdate: null },
    };

    // Latest vehicle data
    this.latestVehicleData = {
      weight: 0,
      totalWeight: 0,
      status: null,
      timestamp: null,
      allowed: null,
    };

    // Connection attempt counter
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
    this.retryDelay = 5000; // 5 seconds
    
    // Simulation mode flag (disabled by default - only enable for testing)
    this.simulationMode = false;
    this.simulationInterval = null;
  }

  /**
   * Initialize serial communication with Arduino
   * Falls back to simulation if no hardware available
   */
  initializeSerial(portPath = '/dev/ttyUSB0') {
    try {
      // Try to require serialport - if not available, use simulation
      try {
        const { SerialPort } = require('serialport');
        const { ReadlineParser } = require('@serialport/parser-readline');

        this.serialPort = new SerialPort({
          path: portPath,
          baudRate: 9600,
          autoOpen: false,
        });

        const parser = this.serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

        this.serialPort.on('open', () => {
          console.log('✓ Arduino connected on', portPath);
          this.isConnected = true;
          this.connectionAttempts = 0;
          this.components.loadCells.status = 'connected';
          this.components.hx711.status = 'connected';
          this.emit('connected');
        });

        parser.on('data', (data) => {
          this.parseArduinoData(data.trim());
        });

        this.serialPort.on('error', (err) => {
          console.error('✗ Serial port error:', err.message);
          this.isConnected = false;
          this.handleConnectionFailure();
        });

        this.serialPort.on('close', () => {
          console.log('✗ Arduino disconnected');
          this.isConnected = false;
          this.components.loadCells.status = 'disconnected';
          this.components.hx711.status = 'disconnected';
          this.emit('disconnected');
          this.handleConnectionFailure();
        });

        this.serialPort.open((err) => {
          if (err) {
            console.warn('⚠ Could not open serial port:', err.message);
            console.log('ℹ Arduino disconnected - showing disconnected status');
            // Don't simulate - show as disconnected
            this.isConnected = false;
          }
        });
      } catch (importError) {
        console.warn('⚠ serialport package not installed');
        console.log('ℹ Arduino disconnected - showing disconnected status');
        this.isConnected = false;
      }
    } catch (error) {
      console.error('✗ Serial initialization failed:', error.message);
      console.log('ℹ Arduino disconnected - showing disconnected status');
      this.isConnected = false;
    }
  }

  /**
   * Enable simulation mode for development/testing (generates realistic mock data)
   * This should only be used for testing purposes, not as a fallback
   */
  enableSimulationMode(enabled = true) {
    if (enabled) {
      console.log('ℹ SIMULATION MODE ENABLED - Generating fake data for testing');
      this.simulationMode = true;
      
      // Mark all as connected in simulation
      Object.keys(this.components).forEach(key => {
        this.components[key].status = 'connected';
      });

      // Simulate periodic weight readings
      if (!this.simulationInterval) {
        this.simulationInterval = setInterval(() => {
          this.generateSimulatedData();
        }, 2000); // Every 2 seconds
      }
    } else {
      console.log('ℹ SIMULATION MODE DISABLED - Showing real data only');
      this.simulationMode = false;
      
      // Stop simulation
      if (this.simulationInterval) {
        clearInterval(this.simulationInterval);
        this.simulationInterval = null;
      }
      
      // Reset to disconnected
      this.isConnected = false;
      Object.keys(this.components).forEach(key => {
        this.components[key].status = 'disconnected';
      });
      Object.keys(this.loadCells).forEach(key => {
        this.loadCells[key].status = 'disconnected';
        this.loadCells[key].value = 0;
      });
    }
  }

  /**
   * Generate realistic simulated Arduino data
   */
  generateSimulatedData() {
    // Simulate 4 load cells with some variance
    const baseWeight = 1000 + Math.random() * 3000; // 1000-4000 kg
    const variance = 50;

    this.loadCells.L1.value = baseWeight * 0.25 + (Math.random() - 0.5) * variance;
    this.loadCells.L2.value = baseWeight * 0.25 + (Math.random() - 0.5) * variance;
    this.loadCells.L3.value = baseWeight * 0.25 + (Math.random() - 0.5) * variance;
    this.loadCells.L4.value = baseWeight * 0.25 + (Math.random() - 0.5) * variance;

    Object.keys(this.loadCells).forEach(key => {
      this.loadCells[key].status = 'connected';
      this.loadCells[key].lastUpdate = new Date();
    });

    // Update component status
    this.components.loadCells.status = 'connected';
    this.components.hx711.status = 'connected';
    this.components.servo.status = Math.random() > 0.1 ? 'connected' : 'warning';
    this.components.irSensor.status = Math.random() > 0.05 ? 'connected' : 'warning';
    this.components.buckController.status = Math.random() > 0.05 ? 'connected' : 'warning';
    this.components.sonar.status = Math.random() > 0.1 ? 'connected' : 'warning';
    this.components.ipWebcam.status = Math.random() > 0.15 ? 'connected' : 'disconnected';

    // Update total weight
    const totalWeight = Object.values(this.loadCells).reduce((sum, cell) => sum + cell.value, 0);
    this.latestVehicleData.totalWeight = Math.round(totalWeight);
    this.latestVehicleData.timestamp = new Date();
    this.latestVehicleData.allowed = totalWeight <= 5000;

    this.emit('data-updated', {
      loadCells: this.loadCells,
      components: this.components,
      vehicleData: this.latestVehicleData,
    });
  }

  /**
   * Parse data received from Arduino
   * Expected formats: 
   * - "VEHICLE|weight|status|timestamp"
   * - "STATUS|weight|servo:ok|ir:ok|hx711:ok|buck:ok|sonar:ok|timestamp"
   */
  parseArduinoData(data) {
    try {
      if (data.includes('VEHICLE|')) {
        const parts = data.split('|');
        if (parts.length >= 3) {
          const weight = parseFloat(parts[1]);
          const status = parts[2].toUpperCase();

          this.latestVehicleData.totalWeight = weight;
          this.latestVehicleData.status = status;
          this.latestVehicleData.allowed = status === 'ALLOWED';
          this.latestVehicleData.timestamp = new Date();

          this.emit('vehicle-detected', this.latestVehicleData);
        }
      } else if (data.includes('STATUS|')) {
        // Parse component status from Arduino
        // Format: STATUS|weight|servo:ok|ir:ok|hx711:ok|buck:ok|sonar:ok|timestamp
        const parts = data.split('|');
        if (parts.length >= 7) {
          const weight = parseFloat(parts[1]);
          
          // Update load cell weight
          this.latestVehicleData.totalWeight = weight;
          this.latestVehicleData.timestamp = new Date();
          
          // Parse component statuses
          const parseComponentStatus = (statusStr) => {
            return statusStr.includes('ok') ? 'connected' : 'warning';
          };
          
          this.components.servo.status = parseComponentStatus(parts[2]); // servo:ok|fail
          this.components.irSensor.status = parseComponentStatus(parts[3]); // ir:ok|fail
          this.components.hx711.status = parseComponentStatus(parts[4]); // hx711:ok|fail
          this.components.buckController.status = parseComponentStatus(parts[5]); // buck:ok|fail
          this.components.sonar.status = parseComponentStatus(parts[6]); // sonar:ok|fail
          
          // Update load cells and all timestamps
          Object.keys(this.loadCells).forEach(key => {
            this.loadCells[key].status = 'connected';
            this.loadCells[key].lastUpdate = new Date();
          });
          
          this.components.loadCells.status = 'connected';
          this.components.hx711.lastUpdate = new Date();
          Object.keys(this.components).forEach(key => {
            this.components[key].lastUpdate = new Date();
          });
          
          this.emit('data-updated', {
            loadCells: this.loadCells,
            components: this.components,
            vehicleData: this.latestVehicleData,
          });
        }
      } else if (data.includes('Weight:')) {
        // Parse individual weight readings from Arduino
        const match = data.match(/Weight:\s*([\d.]+)/);
        if (match) {
          const weight = parseFloat(match[1]);
          this.latestVehicleData.totalWeight = weight;
          this.latestVehicleData.timestamp = new Date();
        }
      }

      // Update component status on data reception
      this.components.loadCells.status = 'connected';
      this.components.hx711.status = 'connected';
      this.components.loadCells.lastUpdate = new Date();

      console.log('ℹ Arduino data:', data);
    } catch (error) {
      console.error('✗ Error parsing Arduino data:', error.message);
    }
  }

  /**
   * Handle connection failures with retry logic
   */
  handleConnectionFailure() {
    this.connectionAttempts++;
    
    if (this.connectionAttempts < this.maxConnectionAttempts) {
      console.log(`ℹ Retry attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}`);
      setTimeout(() => {
        this.initializeSerial();
      }, this.retryDelay);
    } else {
      console.log('✗ Max connection attempts reached, falling back to simulation');
      this.initializeSimulation();
    }
  }

  /**
   * Send command to Arduino
   */
  sendCommand(command) {
    if (!this.serialPort || !this.isConnected) {
      console.warn('⚠ Arduino not connected, ignoring command:', command);
      return false;
    }

    try {
      this.serialPort.write(command + '\n', (err) => {
        if (err) {
          console.error('✗ Error sending command:', err.message);
          return false;
        }
        console.log('ℹ Command sent:', command);
      });
      return true;
    } catch (error) {
      console.error('✗ Error sending command:', error.message);
      return false;
    }
  }

  /**
   * Get current load cell data
   */
  getLoadCellData() {
    return {
      cells: this.loadCells,
      totalWeight: this.latestVehicleData.totalWeight,
      timestamp: this.latestVehicleData.timestamp,
      status: this.latestVehicleData.allowed ? 'ALLOWED' : 'BLOCKED',
    };
  }

  /**
   * Get component health status
   */
  getComponentStatus() {
    // If Arduino is not connected, mark all components as disconnected
    if (!this.isConnected) {
      return {
        loadCells: { status: 'disconnected', lastUpdate: null },
        hx711: { status: 'disconnected', lastUpdate: null },
        servo: { status: 'disconnected', lastUpdate: null },
        irSensor: { status: 'disconnected', lastUpdate: null },
        buckController: { status: 'disconnected', lastUpdate: null },
        sonar: { status: 'disconnected', lastUpdate: null },
        ipWebcam: { status: 'disconnected', lastUpdate: null },
      };
    }
    
    return this.components;
  }

  /**
   * Get latest vehicle data
   */
  getLatestVehicleData() {
    return this.latestVehicleData;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      mode: this.serialPort && this.isConnected ? 'hardware' : 'simulation',
      components: this.components,
    };
  }

  /**
   * Tare (reset) the scale
   */
  tare() {
    return this.sendCommand('TARE');
  }

  /**
   * Control barrier
   */
  openBarrier() {
    return this.sendCommand('OPEN');
  }

  closeBarrier() {
    return this.sendCommand('CLOSE');
  }

  /**
   * Get system info
   */
  getSystemInfo() {
    return this.sendCommand('INFO');
  }

  /**
   * Cleanup and disconnect
   */
  disconnect() {
    // Stop simulation if running
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    // Close serial port if connected
    if (this.serialPort && this.isConnected) {
      try {
        this.serialPort.close();
      } catch (error) {
        console.error('Error closing serial port:', error.message);
      }
    }

    this.isConnected = false;
    this.simulationMode = false;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new ArduinoService();
    }
    return instance;
  },

  createInstance: () => {
    instance = new ArduinoService();
    return instance;
  },

  ArduinoService,
};
