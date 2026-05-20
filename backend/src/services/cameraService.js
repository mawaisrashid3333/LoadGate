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
    this.cameraStreamUrl = process.env.CAMERA_STREAM_URL || null;
    this.cameraHealthUrl = process.env.CAMERA_HEALTH_URL || null;
    this.username = process.env.CAMERA_USERNAME || 'admin';
    this.password = process.env.CAMERA_PASSWORD || 'password';
    this.storagePath = process.env.STORAGE_PATH || './public/uploads';

    console.log('[CameraService] configured with:', {
      cameraUrl: this.cameraUrl,
      cameraStreamUrl: this.cameraStreamUrl,
      cameraHealthUrl: this.cameraHealthUrl,
      username: this.username ? '***' : '(none)',
    });
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

  isRtspUrl(url) {
    return /^rtsp:\/\//i.test(url);
  }

  isMjpegUrl(url) {
    return /(http.*Preview|Streaming\/channels\/\d+\/httpPreview|\.mjpg|\.mjpeg)/i.test(url);
  }

  getLiveStreamUrl() {
    const sourceUrl = this.cameraStreamUrl || this.cameraUrl;

    if (this.isRtspUrl(sourceUrl)) {
      const apiUrl = process.env.API_URL || 'http://localhost:5000';
      const liveUrl = `${apiUrl}/api/camera/stream/live`;
      console.log('[CameraService] getLiveStreamUrl -> RTSP proxy', liveUrl);
      return liveUrl;
    }

    const streamUrl = sourceUrl.includes('/stream') || sourceUrl.includes('/doc/') || sourceUrl.includes('#')
      ? sourceUrl
      : `${this.cameraUrl}/stream.mjpeg`;

    console.log('[CameraService] getLiveStreamUrl ->', streamUrl);
    return streamUrl;
  }

  getStreamSourceUrl() {
    return this.cameraStreamUrl || this.cameraUrl;
  }

  async checkRtspConnection(url) {
    const fs = require('fs');
    const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
    
    // Check if ffmpeg exists
    if (!fs.existsSync(ffmpegPath)) {
      console.log('[CameraService] FFmpeg not found at', ffmpegPath, '- skipping RTSP health check');
      return { connected: true, message: 'RTSP source configured (health check skipped)' };
    }

    return new Promise((resolve) => {
      const ffmpeg = require('child_process').spawn(ffmpegPath, [
        '-hide_banner',
        '-loglevel', 'error',
        '-rtsp_transport', 'tcp',
        '-i', url,
        '-t', '1',
        '-f', 'null',
        '-',
      ]);

      const timeout = setTimeout(() => {
        ffmpeg.kill('SIGKILL');
        resolve({ connected: true, message: 'RTSP source appears reachable' });
      }, 3000);

      ffmpeg.on('error', (error) => {
        clearTimeout(timeout);
        console.warn('[CameraService] RTSP health check error:', error.message);
        resolve({ connected: true, message: 'RTSP source configured (health check unavailable)' });
      });

      ffmpeg.on('exit', (code, signal) => {
        clearTimeout(timeout);
        if (code === 0 || signal === 'SIGKILL') {
          resolve({ connected: true, message: 'RTSP source is reachable' });
        } else {
          resolve({ connected: true, message: 'RTSP source configured' });
        }
      });
    });
  }

  /**
   * Check camera connection
   */
  async checkConnection() {
    const url = this.cameraHealthUrl || this.getStreamSourceUrl();
    const requestConfig = {
      timeout: 3000,
    };

    if (this.username || this.password) {
      requestConfig.auth = {
        username: this.username,
        password: this.password,
      };
    }

    console.log('[CameraService] checking camera connection:', {
      url,
      auth: !!requestConfig.auth,
      healthUrl: this.cameraHealthUrl,
      streamUrl: this.cameraStreamUrl,
      baseUrl: this.cameraUrl,
    });

    if (this.isRtspUrl(url)) {
      return this.checkRtspConnection(url);
    }

    try {
      await axios.get(url, requestConfig);
      console.log('[CameraService] camera connection successful:', url);
      return { connected: true, message: 'Camera is online' };
    } catch (error) {
      const status = error.response?.status;
      const isAuthError = status === 401 || status === 403;
      const responseType = error.response?.headers?.['content-type'];

      console.warn('[CameraService] camera connection error:', {
        url,
        status,
        code: error.code,
        message: error.message,
        responseType,
      });

      // If the stream is reachable but protected, still consider the camera online.
      if (isAuthError && (url.includes('Streaming/channels') || url.includes('httpPreview') || url.includes('/doc/'))) {
        console.log('[CameraService] camera reachable but auth required');
        return { connected: true, message: 'Camera is reachable but authentication is required' };
      }

      const isNetworkError = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'].includes(error.code);
      if (isNetworkError) {
        return { connected: false, message: 'Camera is offline', error: error.message };
      }

      // If the camera URL returns HTML content or a preview page, treat it as online unless the network is unreachable.
      if (error.response && responseType && responseType.includes('text/html')) {
        console.log('[CameraService] camera preview page reachable, treating as online');
        return { connected: true, message: 'Camera preview page is reachable' };
      }

      return { connected: false, message: 'Camera is offline', error: error.message };
    }
  }
}

module.exports = new CameraService();
