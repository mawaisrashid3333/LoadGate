/**
 * Camera Routes
 * API endpoints for camera operations
 */

const express = require('express');
const axios = require('axios');
const { spawn } = require('child_process');
const cameraService = require('../services/cameraService');

const router = express.Router();
const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';

// Get camera status
router.get('/status', async (req, res) => {
  console.log('[cameraRoutes] GET /status');
  const status = await cameraService.checkConnection();
  console.log('[cameraRoutes] camera status result:', status);
  res.json(status);
});

// Get live stream URL
router.get('/stream', (req, res) => {
  const streamUrl = cameraService.getLiveStreamUrl();
  console.log('[cameraRoutes] GET /stream ->', streamUrl);
  res.json({
    streamUrl,
  });
});

// Test RTSP connectivity
router.get('/test-rtsp', (req, res) => {
  const rtspUrl = 'rtsp://admin:Ctti%402025@192.168.15.7:554/Streaming/Channels/101';
  console.log('[cameraRoutes] Testing RTSP connection to:', rtspUrl);
  
  const ffmpeg = spawn(ffmpegPath, [
    '-rtsp_transport', 'tcp',
    '-i', rtspUrl,
    '-t', '5',  // Only 5 seconds
    '-f', 'null',
    '-',
  ]);

  let output = '';
  let errors = '';

  ffmpeg.stdout.on('data', (data) => {
    output += data.toString();
  });

  ffmpeg.stderr.on('data', (data) => {
    errors += data.toString();
    console.log('[RTSP-TEST]', data.toString().slice(0, 100));
  });

  ffmpeg.on('close', (code) => {
    console.log('[RTSP-TEST] Process ended with code:', code);
    res.json({
      success: code === 0,
      code: code,
      output: output.slice(-200),
      errors: errors.slice(-500),
    });
  });

  ffmpeg.on('error', (err) => {
    res.json({ success: false, error: err.message });
  });
});

// Live MJPEG stream proxy for RTSP or MJPEG sources
router.get('/live', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Pragma': 'no-cache',
  });

  const spawnFFmpeg = () => {
    const ffmpeg = spawn(ffmpegPath, [
      '-rtsp_transport', 'tcp',
      '-i', 'rtsp://admin:Ctti%402025@192.168.15.7:554/Streaming/Channels/101',
      '-c:v', 'mjpeg',
      '-q:v', '7',
      '-r', '6',
      '-vf', 'hflip,vflip,scale=480:270',
      '-f', 'mjpeg',
      'pipe:1',
    ]);

    ffmpeg.stdout.on('data', (chunk) => {
      res.write('--frame\r\n');
      res.write('Content-Type: image/jpeg\r\n');
      res.write(`Content-Length: ${chunk.length}\r\n\r\n`);
      res.write(chunk);
      res.write('\r\n');
    });

    ffmpeg.stderr.on('data', (data) => {
      const msg = data.toString().slice(0, 100);
      if (msg.includes('Error')) {
        console.log('[FFMPEG] Connection error detected:', msg);
        ffmpeg.kill('SIGINT');
      } else {
        console.log('[FFMPEG]', msg);
      }
    });

    ffmpeg.on('close', (code) => {
      console.log('[cameraRoutes] FFmpeg stopped with code:', code);
      if (!res.headersSent) {
        res.end();
      }
    });

    ffmpeg.on('error', (err) => {
      console.error('[FFmpeg Error]', err.message);
      if (!res.headersSent) {
        res.end();
      }
    });

    req.on('close', () => {
      ffmpeg.kill('SIGINT');
    });

    return ffmpeg;
  };

  let ffmpeg = spawnFFmpeg();
});

// Keep /stream/live as alias for backward compatibility
router.get('/stream/live', (req, res) => {
  res.redirect('/api/camera/live');
});

// Capture snapshot
router.post('/snapshot', async (req, res) => {
  const snapshot = await cameraService.captureSnapshot();

  if (!snapshot) {
    return res.status(500).json({
      error: 'Failed to capture snapshot',
    });
  }

  res.json({
    success: true,
    data: snapshot,
  });
});

module.exports = router;
