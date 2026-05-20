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

    // Last detected sonar distance to avoid duplicates
    this.lastSonarDistance = null;
    this.lastHumanDistance = null;
    this.DISTANCE_CHANGE_THRESHOLD = 10.0; // cm - minimum change to trigger new detection
    this.lastProcessedDistance = null;  // Track distance from last Gemini pass

    // Current sonar reading (NEW FORMAT)
    this.currentDistance = null;
    this.currentType = null;
    
    // Stability tracking for 5-second window
    this.stabilityTracking = {
      distance: null,
      type: null,
      startTime: null,
      timeout: null,
      minDistance: null,
      maxDistance: null,
    };
    this.STABILITY_WINDOW = 5000; // 5 seconds
    this.STABILITY_THRESHOLD = 10; // ±10cm

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
          baudRate: parseInt(process.env.ARDUINO_BAUDRATE) || 9600,
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
          // Defer parsing to avoid blocking event loop for HTTP requests/streaming
          setImmediate(() => {
            this.parseArduinoData(data.trim());
          });
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
   * - "HUMAN|distance|confidence|timestamp"
   * - "SONAR_VEHICLE|distance|confidence|timestamp"
   * - "WEIGHT:weight"
   * - "BARRIER: status"
   */
  parseArduinoData(data) {
    try {
      const trimmed = data.trim();

      // Log all received data (especially Arduino debug messages)
      if (trimmed.length > 0 && !trimmed.startsWith('DISTANCE:') && !trimmed.startsWith('TYPE:')) {
        console.log(`[Arduino Serial] ${trimmed}`);
      }

      // Parse DISTANCE line: "DISTANCE: 36.80"
      if (trimmed.startsWith('DISTANCE:')) {
        const distance = parseFloat(trimmed.replace('DISTANCE:', '').trim());
        this.currentDistance = distance;
        
        // ===== STABILITY TRACKING LOGIC =====
        if (this.stabilityTracking.distance === null) {
          // NEW OBJECT - start tracking
          this.stabilityTracking.distance = distance;
          this.stabilityTracking.type = this.currentType;
          this.stabilityTracking.startTime = Date.now();
          this.stabilityTracking.minDistance = distance;
          this.stabilityTracking.maxDistance = distance;
          
          console.log(`📊 Started tracking ${this.currentType} at ${distance.toFixed(2)}cm`);
          
          // Set 5-second timer
          if (this.stabilityTracking.timeout) {
            clearTimeout(this.stabilityTracking.timeout);
          }
          
          this.stabilityTracking.timeout = setTimeout(() => {
            // Check if still within range
            const range = this.stabilityTracking.maxDistance - this.stabilityTracking.minDistance;
            if (range <= this.STABILITY_THRESHOLD) {
              console.log(`✓ STABLE: ${this.stabilityTracking.type} at ${this.stabilityTracking.distance.toFixed(2)}cm (range: ${range.toFixed(2)}cm)`);
              this.emitStableDetection();
            }
          }, this.STABILITY_WINDOW);
        } else {
          // OBJECT ALREADY BEING TRACKED - check if still within range
          const distanceFromBase = Math.abs(distance - this.stabilityTracking.distance);
          
          if (distanceFromBase <= this.STABILITY_THRESHOLD) {
            // Still within range - update min/max (no logging to reduce CPU)
            this.stabilityTracking.minDistance = Math.min(this.stabilityTracking.minDistance, distance);
            this.stabilityTracking.maxDistance = Math.max(this.stabilityTracking.maxDistance, distance);
          } else {
            // MOVED OUT OF RANGE - reset tracking
            console.log(`⚠ Object moved: ${distance.toFixed(2)}cm out of range`);
            this.resetStabilityTracking();
          }
        }
      }
      // Parse EVENT line: "EVENT:DISTANCE|WEIGHT" (new format with distance and weight)
      else if (trimmed.startsWith('EVENT:')) {
        const eventData = trimmed.replace('EVENT:', '').trim();
        const parts = eventData.split('|');
        
        if (parts.length === 2) {
          const distance = parseFloat(parts[0]) || 0;
          const weight = parseFloat(parts[1]) || 0;
          
          console.log(`📦 Event received: Distance=${distance.toFixed(1)}cm, Weight=${weight.toFixed(2)}kg, Type=${this.currentType}`);
          
          // ===== DISTANCE DEDUPLICATION =====
          let shouldPassToGemini = true;
          if (this.lastProcessedDistance !== null) {
            const diff = Math.abs(distance - this.lastProcessedDistance);
            if (diff < this.DISTANCE_CHANGE_THRESHOLD) {
              console.log(`[DEDUPE] Distance unchanged - skipping Gemini`);
              shouldPassToGemini = false;
            }
          }
          if (shouldPassToGemini) {
            this.lastProcessedDistance = distance;
          }
          
          // Store latest weight and update total weight
          this.latestVehicleData.weight = weight;
          this.latestVehicleData.totalWeight = weight;  // Update total weight from current event
          this.latestVehicleData.timestamp = new Date();
          
          // Update load cells - distribute weight across 4 cells
          const perCell = weight / 4;
          Object.keys(this.loadCells).forEach(key => {
            this.loadCells[key].value = perCell;
            this.loadCells[key].status = 'connected';
            this.loadCells[key].lastUpdate = new Date();
          });
          
          // Emit sonar-detected event for Gemini processing
          if (shouldPassToGemini && this.currentType === 'OBJECT') {
            this.emit('sonar-detected', {
              distance: distance,
              weight: weight,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
      // Parse TYPE line: "TYPE: HUMAN/VEHICLE/CLEAR/UNKNOWN"
      else if (trimmed.startsWith('TYPE:')) {
        const type = trimmed.replace('TYPE:', '').trim().toUpperCase();
        this.currentType = type;
        
        if (type === 'CLEAR') {
          this.resetStabilityTracking();
        }
      }
      // Parse OBJECT LEFT line - Clear tracking
      else if (trimmed.startsWith('OBJECT LEFT')) {
        this.resetStabilityTracking();
      }

      // Mark Arduino as connected when receiving any data
      if (!this.isConnected) {
        console.log('✓ Arduino connected (data received)');
        this.isConnected = true;
      }
      
      // Update component status on data reception
      this.components.sonar.status = 'connected';
      this.components.sonar.lastUpdate = new Date();
      this.components.loadCells.status = 'connected';
      this.components.loadCells.lastUpdate = new Date();
      this.components.hx711.status = 'connected';
      this.components.hx711.lastUpdate = new Date();
    } catch (error) {
      console.error('✗ Error parsing Arduino data:', error.message);
    }
  }

  /**
   * Reset stability tracking
   */
  resetStabilityTracking() {
    if (this.stabilityTracking.timeout) {
      clearTimeout(this.stabilityTracking.timeout);
    }
    this.stabilityTracking = {
      distance: null,
      type: null,
      startTime: null,
      timeout: null,
      minDistance: null,
      maxDistance: null,
    };
  }

  /**
   * Emit stable detection after 5 seconds within ±10cm range
   */
  emitStableDetection() {
    const { distance, type } = this.stabilityTracking;
    
    if (distance === null || type === null) return;

    // Get latest weight from load cell (updated when EVENT:TYPE|WEIGHT is received)
    const weight = this.latestVehicleData.weight || 0;

    // Emit event for backend to process
    if (type === 'HUMAN') {
      this.emit('human-detected', {
        distance: distance,
        weight: weight,
        type: 'HUMAN',
        stability: 'stable-5s',
        timestamp: new Date().toISOString(),
      });
    } else if (type === 'VEHICLE') {
      this.emit('sonar-vehicle-detected', {
        distance: distance,
        weight: weight,
        type: 'VEHICLE',
        stability: 'stable-5s',
        timestamp: new Date().toISOString(),
      });
    } else if (type === 'GROUND') {
      this.emit('ground-detected', {
        distance: distance,
        weight: weight,
        type: 'GROUND',
        stability: 'stable-5s',
        timestamp: new Date().toISOString(),
      });
    } else if (type === 'CEILING') {
      this.emit('ceiling-detected', {
        distance: distance,
        weight: weight,
        type: 'CEILING',
        stability: 'stable-5s',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Reset tracking for next object
    this.resetStabilityTracking();
  }

  /**
   * Populate cell values from a single reported weight
   */
  updateLoadCellValues(weight) {
    const perCell = weight / Object.keys(this.loadCells).length;
    Object.keys(this.loadCells).forEach(key => {
      this.loadCells[key].value = Math.round(perCell * 100) / 100;
      this.loadCells[key].status = 'connected';
      this.loadCells[key].lastUpdate = new Date();
    });
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
      this.enableSimulationMode(true);
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
      L1: this.loadCells.L1,
      L2: this.loadCells.L2,
      L3: this.loadCells.L3,
      L4: this.loadCells.L4,
      totalWeight: this.latestVehicleData.totalWeight || 0,
      timestamp: this.latestVehicleData.timestamp,
      status: this.isConnected ? 'CONNECTED' : 'DISCONNECTED',
    };
  }

  /**
   * Get component health status
   */
  getComponentStatus() {
    // Check if we've received data recently
    const lastDataTime = this.latestVehicleData.timestamp ? new Date(this.latestVehicleData.timestamp).getTime() : 0;
    const now = Date.now();
    const timeSinceLastData = now - lastDataTime;
    const isConnected = this.isConnected || timeSinceLastData < 10000;
    
    // If Arduino is not connected, mark all components as disconnected
    if (!isConnected) {
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
    // Check if we've received data recently (within last 10 seconds)
    const lastDataTime = this.latestVehicleData.timestamp ? new Date(this.latestVehicleData.timestamp).getTime() : 0;
    const now = Date.now();
    const timeSinceLastData = now - lastDataTime;
    const isRecentlyConnected = timeSinceLastData < 10000;  // Connected if data received in last 10 seconds
    
    const connected = this.isConnected || isRecentlyConnected;
    
    return {
      isConnected: connected,
      connected: connected,  // For compatibility with frontend
      mode: connected && this.serialPort ? 'hardware' : 'simulation',
      components: this.components,
      lastDataReceived: this.latestVehicleData.timestamp,
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
   * Send allow command to servo (gate opens)
   */
  allowDetection() {
    console.log('✓ Sending ALLOW command to Arduino (opening gate)');
    return this.sendCommand('CMD:ALLOW');
  }

  /**
   * Send block command to servo (gate stays closed)
   */
  blockDetection() {
    console.log('✓ Sending BLOCK command to Arduino (keeping gate closed)');
    return this.sendCommand('CMD:BLOCK');
  }

  /**
   * Get current live weight (latest reading from load cell)
   */
  getLiveWeight() {
    return this.latestVehicleData.weight || 0;
  }

  /**
   * Set weight limit
   */
  setWeightLimit(limitKg) {
    return this.sendCommand(`CMD:SET_LIMIT:${limitKg}`);
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

  /**
   * Subscribe to vehicle detection events (compatibility with irEventService)
   */
  onVehicleDetected(callback) {
    this.on('vehicle_detected', callback);
  }

  /**
   * Subscribe to weight updates
   */
  onWeightUpdate(callback) {
    this.on('weight_update', callback);
  }

  /**
   * Subscribe to barrier status changes
   */
  onBarrierStatus(callback) {
    this.on('barrier_status', callback);
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

