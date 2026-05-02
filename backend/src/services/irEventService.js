/**
 * IR Event Service
 * Listens for IR sensor events from Arduino
 * Emits events to subscribers without Socket.IO
 */

const { EventEmitter } = require('events');
const SerialPort = require('serialport').SerialPort;
const { ReadlineParser } = require('@serialport/parser-readline');

class IREventService extends EventEmitter {
  constructor() {
    super();
    this.port = null;
    this.parser = null;
    this.isConnected = false;
    this.pendingConnections = [];
  }

  /**
   * Initialize and connect to Arduino
   */
  async initialize(portPath = process.env.ARDUINO_PORT || 'COM3') {
    try {
      this.port = new SerialPort({
        path: portPath,
        baudRate: parseInt(process.env.ARDUINO_BAUDRATE) || 9600,
      });

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

      this.port.on('open', () => {
        console.log(`✓ Arduino connected on ${portPath}`);
        this.isConnected = true;
      });

      this.parser.on('data', (data) => {
        this.handleArduinoData(data);
      });

      this.port.on('error', (err) => {
        console.error('❌ Arduino connection error:', err.message);
        this.isConnected = false;
      });

      this.port.on('close', () => {
        console.log('❌ Arduino disconnected');
        this.isConnected = false;
      });
    } catch (error) {
      console.error('Failed to initialize IR Event Service:', error.message);
      throw error;
    }
  }

  /**
   * Handle data received from Arduino
   */
  handleArduinoData(data) {
    const message = data.trim();

    if (message.startsWith('VEHICLE')) {
      // Parse vehicle data: VEHICLE|weight|status|timestamp
      const parts = message.split('|');
      if (parts.length >= 3) {
        const event = {
          type: 'VEHICLE_DETECTED',
          weight: parseFloat(parts[1]),
          status: parts[2],
          timestamp: parts[3] || Date.now(),
          receivedAt: new Date().toISOString(),
        };

        console.log(`📡 IR Event: ${event.weight}kg - ${event.status}`);
        this.emit('vehicle_detected', event);
      }
    } else if (message.startsWith('WEIGHT')) {
      const weight = parseFloat(message.replace('WEIGHT:', ''));
      this.emit('weight_update', { weight, timestamp: Date.now() });
    } else if (message.startsWith('BARRIER')) {
      const status = message.replace('BARRIER: ', '');
      this.emit('barrier_status', { status, timestamp: Date.now() });
    }
  }

  /**
   * Send command to Arduino
   */
  sendCommand(command) {
    if (!this.isConnected) {
      console.error('Arduino not connected');
      return false;
    }

    this.port.write(command + '\n', (err) => {
      if (err) {
        console.error('Failed to send command:', err.message);
        return false;
      }
      console.log(`✓ Command sent: ${command}`);
      return true;
    });
  }

  /**
   * Subscribe to vehicle detection events
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

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      port: this.port?.path || 'Not connected',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Close connection
   */
  disconnect() {
    if (this.port) {
      this.port.close();
      this.isConnected = false;
      console.log('IR Event Service disconnected');
    }
  }
}

module.exports = new IREventService();
