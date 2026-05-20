/**
 * Frame Capture Service
 * Captures frames from live FFmpeg MJPEG stream for license plate detection
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class FrameCaptureService extends EventEmitter {
  constructor() {
    super();
    this.streamUrl = process.env.API_URL || 'http://localhost:5000';
    this.captureDir = path.join(__dirname, '../../public/captures');
    this.frameBuffer = []; // Circular buffer of recent frames
    this.maxFrames = 30; // Keep last 30 frames (~5 seconds at 6fps)
    this.isStreamConnected = false;
    
    // Ensure capture directory exists
    if (!fs.existsSync(this.captureDir)) {
      fs.mkdirSync(this.captureDir, { recursive: true });
    }

    // Start frame buffering in background
    this.startFrameBuffering();
  }

  /**
   * Start continuously buffering frames from stream
   */
  startFrameBuffering() {
    console.log('[FrameCapture] Starting frame buffering service...');
    
    // Simple retry logic
    const connectToStream = () => {
      this.connectAndBuffer().catch(err => {
        console.error('[FrameCapture] Stream connection lost:', err.message);
        this.isStreamConnected = false;
        // Retry connection after 2 seconds
        setTimeout(connectToStream, 2000);
      });
    };

    connectToStream();
  }

  /**
   * Connect to stream and buffer frames
   */
  async connectAndBuffer() {
    return new Promise((resolve, reject) => {
      const streamUrl = `${this.streamUrl}/api/camera/live`;
      console.log('[FrameCapture] Connecting to stream:', streamUrl);

      const request = require('http').get(streamUrl, (res) => {
        this.isStreamConnected = true;
        console.log('[FrameCapture] ✓ Connected to MJPEG stream');

        let buffer = Buffer.alloc(0);

        res.on('data', (chunk) => {
          buffer = Buffer.concat([buffer, chunk]);

          // Look for JPEG frame boundaries
          let jpegStart = -1;
          let jpegEnd = -1;

          // Find JPEG start marker (FFD8)
          for (let i = 0; i < buffer.length - 1; i++) {
            if (buffer[i] === 0xff && buffer[i + 1] === 0xd8) {
              jpegStart = i;
              break;
            }
          }

          // If we found a start, look for end marker (FFD9)
          if (jpegStart !== -1) {
            for (let i = jpegStart + 2; i < buffer.length - 1; i++) {
              if (buffer[i] === 0xff && buffer[i + 1] === 0xd9) {
                jpegEnd = i + 2;
                break;
              }
            }
          }

          // If we have a complete frame, buffer it
          if (jpegStart !== -1 && jpegEnd !== -1) {
            const frameData = buffer.subarray(jpegStart, jpegEnd);
            
            // Add to circular buffer
            this.frameBuffer.push(frameData);
            if (this.frameBuffer.length > this.maxFrames) {
              this.frameBuffer.shift();
            }

            // Remove processed data from buffer
            buffer = buffer.subarray(jpegEnd);
          }
        });

        res.on('end', () => {
          this.isStreamConnected = false;
          reject(new Error('Stream ended'));
        });

        res.on('error', (err) => {
          this.isStreamConnected = false;
          reject(err);
        });
      });

      request.on('error', reject);
    });
  }

  /**
   * Get the Nth frame from buffer (1-indexed)
   * @param {number} frameNum - Which frame to get (1 = oldest, N = newest)
   * @returns {Buffer|null} JPEG buffer or null if not available
   */
  getBufferedFrame(frameNum = 4) {
    if (frameNum <= 0 || frameNum > this.frameBuffer.length) {
      return null;
    }
    return this.frameBuffer[frameNum - 1];
  }

  /**
   * Get most recent frame from buffer
   * @returns {Buffer|null}
   */
  getLatestFrame() {
    return this.frameBuffer.length > 0 ? this.frameBuffer[this.frameBuffer.length - 1] : null;
  }

  /**
   * Capture and save frame with timestamp
   * Grabs the 4th frame from buffer (provides ~0.7-1s delay at 6fps for stabilization)
   * @param {string} vehicleId - Vehicle ID for naming
   * @returns {Object} Capture result with file path and metadata
   */
  captureAndSaveFrame(vehicleId = null) {
    try {
      if (!this.isStreamConnected) {
        console.error('✗ Stream not connected - cannot capture frame');
        return {
          success: false,
          error: 'Stream not connected',
          timestamp: new Date(),
        };
      }

      // Get 4th frame from buffer (not awaiting, immediate grab)
      const frameBuffer = this.getBufferedFrame(4);

      if (!frameBuffer || frameBuffer.length === 0) {
        console.warn('⚠ Frame buffer insufficient - using latest available');
        const latestFrame = this.getLatestFrame();
        if (!latestFrame) {
          return {
            success: false,
            error: 'No frames available in buffer',
            timestamp: new Date(),
          };
        }
        return this._saveFrameToDisk(latestFrame, vehicleId);
      }

      return this._saveFrameToDisk(frameBuffer, vehicleId);
    } catch (error) {
      console.error('✗ Capture and save error:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Helper to save frame buffer to disk
   * @private
   */
  _saveFrameToDisk(frameBuffer, vehicleId) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${vehicleId || 'unknown'}_${timestamp}.jpg`;
    const filepath = path.join(this.captureDir, filename);

    // Save frame to disk
    fs.writeFileSync(filepath, frameBuffer);

    console.log(`[FrameCapture] ✓ Frame saved: ${filename} (${frameBuffer.length} bytes)`);

    // Construct full URL for image access from frontend
    const backendUrl = process.env.API_URL || 'http://localhost:5000';
    const baseUrl = backendUrl.replace('/api', ''); // Remove /api suffix if present
    const fullImageUrl = `${baseUrl}/public/captures/${filename}`;

    return {
      success: true,
      filename,
      filepath,
      size: frameBuffer.length,
      buffer: frameBuffer,
      timestamp: new Date(),
      url: fullImageUrl,
    };
  }

  /**
   * Get latest captured frame
   * @returns {Object} Latest frame metadata
   */
  getLatestCapture() {
    try {
      const files = fs.readdirSync(this.captureDir)
        .filter(f => f.endsWith('.jpg'))
        .map(f => ({
          filename: f,
          filepath: path.join(this.captureDir, f),
          time: fs.statSync(path.join(this.captureDir, f)).mtime,
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length === 0) {
        return null;
      }

      const latest = files[0];
      return {
        filename: latest.filename,
        filepath: latest.filepath,
        buffer: fs.readFileSync(latest.filepath),
        timestamp: latest.time,
        url: `/public/captures/${latest.filename}`,
      };
    } catch (error) {
      console.error('✗ Get latest capture error:', error.message);
      return null;
    }
  }

  /**
   * Clean up old captures (older than specified hours)
   * @param {number} hoursOld - Delete captures older than this many hours
   * @returns {Object} Cleanup statistics
   */
  cleanupOldCaptures(hoursOld = 24) {
    try {
      const cutoffTime = Date.now() - (hoursOld * 60 * 60 * 1000);
      const files = fs.readdirSync(this.captureDir);

      let deletedCount = 0;
      let freedSize = 0;

      files.forEach(file => {
        if (file.endsWith('.jpg')) {
          const filepath = path.join(this.captureDir, file);
          const stats = fs.statSync(filepath);

          if (stats.mtime.getTime() < cutoffTime) {
            fs.unlinkSync(filepath);
            deletedCount++;
            freedSize += stats.size;
          }
        }
      });

      return {
        success: true,
        deletedCount,
        freedSize,
        freedSizeMB: (freedSize / (1024 * 1024)).toFixed(2),
      };
    } catch (error) {
      console.error('✗ Cleanup error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get capture directory statistics
   * @returns {Object} Directory stats
   */
  getStats() {
    try {
      const files = fs.readdirSync(this.captureDir).filter(f => f.endsWith('.jpg'));
      let totalSize = 0;

      files.forEach(file => {
        const stats = fs.statSync(path.join(this.captureDir, file));
        totalSize += stats.size;
      });

      return {
        totalCaptures: files.length,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        captureDir: this.captureDir,
      };
    } catch (error) {
      console.error('✗ Get stats error:', error.message);
      return {
        error: error.message,
      };
    }
  }
}

module.exports = new FrameCaptureService();
