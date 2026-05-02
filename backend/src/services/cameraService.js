/**
 * Camera Service
 * Handles camera streaming and snapshot capture
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class CameraService {
  constructor() {
    this.cameraUrl = process.env.CAMERA_URL || 'http://localhost:8080';
    this.username = process.env.CAMERA_USERNAME || 'admin';
    this.password = process.env.CAMERA_PASSWORD || 'password';
    this.storagePath = process.env.STORAGE_PATH || './public/uploads';
  }

  /**
   * Capture a snapshot from camera
   */
  async captureSnapshot() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `snapshot_${timestamp}.jpg`;
      const filepath = path.join(this.storagePath, filename);

      // Ensure storage directory exists
      if (!fs.existsSync(this.storagePath)) {
        fs.mkdirSync(this.storagePath, { recursive: true });
      }

      // Get snapshot from camera
      const response = await axios.get(`${this.cameraUrl}/snapshot.jpg`, {
        auth: {
          username: this.username,
          password: this.password,
        },
        responseType: 'stream',
        timeout: 5000,
      });

      // Save to disk
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`📸 Snapshot saved: ${filename}`);
          resolve({
            filename,
            filepath,
            url: `/public/uploads/${filename}`,
          });
        });
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Failed to capture snapshot:', error.message);
      return null;
    }
  }

  /**
   * Get live stream URL
   */
  getLiveStreamUrl() {
    return `${this.cameraUrl}/stream.mjpeg`;
  }

  /**
   * Check camera connection
   */
  async checkConnection() {
    try {
      await axios.get(`${this.cameraUrl}/api/status`, {
        auth: {
          username: this.username,
          password: this.password,
        },
        timeout: 3000,
      });
      return { connected: true, message: 'Camera is online' };
    } catch (error) {
      return { connected: false, message: 'Camera is offline', error: error.message };
    }
  }
}

module.exports = new CameraService();
