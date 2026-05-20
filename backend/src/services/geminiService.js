/**
 * Gemini AI Service
 * Handles license plate detection and vehicle categorization using Google Gemini AI
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Global cooldown flag to manage rate limits seamlessly across requests
let GLOBAL_COOLDOWN_UNTIL = 0;

class GeminiService {
  constructor() {
    this.apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      // Use 2.5-flash as requested
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.2, // Low temperature for precise detection
          topP: 0.8,
          topK: 40,
        }
      });
    } else {
      console.warn('⚠ GOOGLE_GEMINI_API_KEY not configured. License plate detection will be disabled.');
    }
  }

  /**
   * Reduce image size before sending
   */
  async _optimizeImage(imageBuffer) {
    try {
      return await sharp(imageBuffer)
        .resize({ width: 640 }) // Reduce width safely
        .jpeg({ quality: 60 }) // Good compression
        .toBuffer();
    } catch (err) {
      console.warn('[Gemini] Image optimization failed, using original', err.message);
      return imageBuffer;
    }
  }

  /**
   * Wait for global cooldown
   */
  async _waitGlobalCooldown() {
    const now = Date.now();
    if (now < GLOBAL_COOLDOWN_UNTIL) {
      const waitTime = GLOBAL_COOLDOWN_UNTIL - now;
      console.log(`[Gemini] Global cooldown active. Waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime + 100)); // buffer
    }
    // Set a tiny default anti-spam delay for concurrent calls
    GLOBAL_COOLDOWN_UNTIL = Date.now() + 1000;
  }

  /**
   * Detect license plate from image buffer using Gemini Vision API
   * @param {Buffer} imageBuffer - JPEG image data
   * @returns {Promise<Object>} Detection result with license plate and vehicle info
   */
  async detectLicensePlate(imageBuffer) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      // Optimize image first
      const optimizedBuffer = await this._optimizeImage(imageBuffer);
      const imageBase64 = optimizedBuffer.toString('base64');

      // Wait if there's a global cooldown
      await this._waitGlobalCooldown();

      const prompt = `You are an expert in object detection - identifying both vehicles and humans.
                
Analyze this image and extract the following information in JSON format:
{
  "objectDetected": true/false,
  "detectionType": "vehicle|human|both|none",
  "licensePlate": "detected license plate text or null if not visible",
  "confidence": 0-100,
  "vehicleInfo": {
    "vehicleType": "car|truck|bus|motorcycle|other|null",
    "color": "detected primary color or null",
    "make": "vehicle make if identifiable or null",
    "model": "vehicle model if identifiable or null"
  },
  "humanInfo": {
    "count": number of humans detected,
    "description": "brief description of humans (e.g., 'person in red jacket, walking')",
    "pose": "standing|walking|running|other"
  },
  "scene": "brief description of the scene",
  "confidence": 0-100 overall confidence,
  "notes": "any additional observations"
}

Focus on:
1. License plate text if any vehicle is present (be precise with characters and numbers)
2. Human presence and count
3. Vehicle type and details if present
4. Overall scene context

Return ONLY valid JSON, no markdown formatting.`;

      console.log('[Gemini] Sending detectLicensePlate request via official SDK...');
      const response = await this.model.generateContent([
        prompt,
        { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
      ]);

      let responseText = response.response.text();
      // Remove any potential markdown blocks Gemini sometimes adds
      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

      // Parse JSON response
      const detectionResult = JSON.parse(responseText);

      return {
        success: true,
        timestamp: new Date(),
        data: detectionResult,
      };
    } catch (error) {
      console.error('✗ Gemini API error:', error.message);

      if (error.status === 429 || error.message.includes('429')) {
        GLOBAL_COOLDOWN_UNTIL = Date.now() + 15000; // 15-second penalty
        return {
          success: false,
          error: 'Rate limited - too many requests',
          timestamp: new Date(),
        };
      }

      if (error.status === 403 || error.message.includes('403')) {
        return {
          success: false,
          error: 'Invalid API key or insufficient permissions',
          timestamp: new Date(),
        };
      }

      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Batch detect multiple images
   * @param {Array<Buffer>} imageBuffers - Array of JPEG image buffers
   * @returns {Promise<Array>} Array of detection results
   */
  async detectBatch(imageBuffers) {
    const results = [];

    for (const buffer of imageBuffers) {
      try {
        const result = await this.detectLicensePlate(buffer);
        results.push(result);
        // Add small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      }
    }

    return results;
  }

  /**
   * Validate license plate format
   * @param {string} licensePlate - License plate string
   * @returns {Object} Validation result
   */
  validateLicensePlate(licensePlate) {
    if (!licensePlate) {
      return { valid: false, reason: 'Empty license plate' };
    }

    // Remove spaces and convert to uppercase
    const cleaned = licensePlate.toUpperCase().replace(/\s+/g, '');

    // Basic validation - must contain alphanumeric characters
    if (!/^[A-Z0-9]{1,20}$/.test(cleaned)) {
      return { valid: false, reason: 'Invalid format' };
    }

    return { valid: true, cleaned };
  }

  /**
   * Decide whether to save detection as new entry
   * Compares with previous detection to avoid duplicates
   * @param {Object} currentDetection - Current detection result from Gemini
   * @param {Object} lastDetection - Last saved detection (null if none)
   * @returns {Promise<Object>} Decision with reason
   */
  async decideToSave(currentDetection, lastDetection) {
    try {
      // If no previous detection, always save
      if (!lastDetection) {
        return {
          shouldSave: true,
          reason: 'First detection',
          isNewObject: true,
          confidence: 1.0,
        };
      }

      // Compare detection types
      if (currentDetection.detectionType !== lastDetection.detectionType) {
        return {
          shouldSave: true,
          reason: `Detection type changed: ${lastDetection.detectionType} → ${currentDetection.detectionType}`,
          isNewObject: true,
          confidence: 0.95,
        };
      }

      // For humans - compare count and description
      if (currentDetection.detectionType === 'human') {
        const lastCount = lastDetection.humanInfo?.count || 0;
        const currentCount = currentDetection.humanInfo?.count || 0;
        
        if (currentCount !== lastCount) {
          return {
            shouldSave: true,
            reason: `Human count changed: ${lastCount} → ${currentCount}`,
            isNewObject: true,
            confidence: 0.9,
          };
        }

        // Same human count, likely same person
        return {
          shouldSave: false,
          reason: 'Same human(s) detected, no significant change',
          isNewObject: false,
          confidence: 0.8,
        };
      }

      // For vehicles - compare license plate and color
      if (currentDetection.detectionType === 'vehicle') {
        const lastPlate = lastDetection.licensePlate?.toUpperCase() || '';
        const currentPlate = currentDetection.licensePlate?.toUpperCase() || '';

        // Different license plate = definitely new vehicle
        if (currentPlate && lastPlate && currentPlate !== lastPlate) {
          return {
            shouldSave: true,
            reason: `Different vehicle: ${lastPlate} → ${currentPlate}`,
            isNewObject: true,
            confidence: 1.0,
          };
        }

        // Same license plate = same vehicle
        if (currentPlate && lastPlate && currentPlate === lastPlate) {
          return {
            shouldSave: false,
            reason: `Same vehicle detected: ${currentPlate}`,
            isNewObject: false,
            confidence: 0.95,
          };
        }

        // If no plates but different colors/make/model
        const lastColor = lastDetection.vehicleInfo?.color?.toLowerCase() || '';
        const currentColor = currentDetection.vehicleInfo?.color?.toLowerCase() || '';
        
        if (currentColor && lastColor && currentColor !== lastColor) {
          return {
            shouldSave: true,
            reason: `Different vehicle: ${lastColor} → ${currentColor}`,
            isNewObject: true,
            confidence: 0.85,
          };
        }

        // Default: same vehicle
        return {
          shouldSave: false,
          reason: 'Similar vehicle, likely same object',
          isNewObject: false,
          confidence: 0.7,
        };
      }

      // Unknown type - save to be safe
      return {
        shouldSave: true,
        reason: 'Unknown detection type, saving for review',
        isNewObject: true,
        confidence: 0.5,
      };
    } catch (error) {
      console.error('✗ Error in decideToSave:', error.message);
      return {
        shouldSave: true,
        reason: 'Decision error - defaulting to save',
        isNewObject: true,
        confidence: 0.3,
      };
    }
  }

  /**
   * Categorize vehicle/human and determine if allowed to pass
   * Categories: human, HTV (Heavy Transport Vehicle), LTV (Light Transport Vehicle), bike, other
   * Blocked only if frame is empty (no object detected)
   * @param {Buffer} imageBuffer - JPEG image data
   * @returns {Promise<Object>} Categorization result with allow/block decision
   */
  async categorizeAndDecide(imageBuffer) {
    if (!this.apiKey) {
      const error = 'Gemini API key not configured';
      console.error('[Gemini]', error);
      return {
        success: false,
        error,
        timestamp: new Date(),
      };
    }

    try {
      console.log('[Gemini] Starting categorization and allow/block decision...');

      // Optimize image first
      const optimizedBuffer = await this._optimizeImage(imageBuffer);
      const imageBase64 = optimizedBuffer.toString('base64');

      // Wait if there's a global cooldown
      await this._waitGlobalCooldown();

      const prompt = `You are an expert in vehicle and human detection for access control systems.

Analyze this image and categorize what you see. Return a JSON object with:
{
  "objectPresent": true/false (is there anything in the frame?),
  "category": "human|HTV|LTV|bike|other|none",
  "confidence": 0-100 (confidence in category),
  "description": "brief description of what's in frame",
  "allow": true/false (should this object be allowed to pass?),
  "reason": "explanation for allow/block decision",
  "details": {
    "count": "if human, how many?",
    "color": "primary color if any object",
    "make": "vehicle make if identifiable",
    "licensePlate": "license plate if visible",
    "notes": "any special observations"
  }
}

Categories:
- human: Person(s) detected
- HTV: Heavy Transport Vehicle (trucks, buses, large vehicles)
- LTV: Light Transport Vehicle (cars, vans, small vehicles)
- bike: Motorcycles, scooters, bicycles
- other: Unidentified objects
- none: Frame is empty

IMPORTANT: 
- Set allow=false ONLY if objectPresent=false (empty frame = blocked)
- All detected humans, vehicles, and bikes should have allow=true (they're allowed to pass)
- Only block if frame is completely empty/unclear

Return ONLY valid JSON, no markdown formatting.`;

      console.log('[Gemini] Sending categorizeAndDecide request via official SDK...');
      const response = await this.model.generateContent([
        prompt,
        { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
      ]);
      
      let responseText = response.response.text();
      if (!responseText) {
        throw new Error('Empty response from Gemini API');
      }

      // Clean up markdown block wrapping if present
      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      console.log('[Gemini] Raw response:', responseText.slice(0, 200));

      // Parse JSON response
      let categorization;
      try {
        categorization = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[Gemini] JSON parse error:', parseError.message);
        console.error('[Gemini] Response text:', responseText);
        throw new Error(`Failed to parse Gemini response: ${parseError.message}`);
      }

      console.log('[Gemini] ✓ Categorization successful:', {
        category: categorization.category,
        allow: categorization.allow,
        confidence: categorization.confidence,
        description: categorization.description,
      });

      return {
        success: true,
        timestamp: new Date(),
        data: categorization,
      };
    } catch (error) {
      console.error('[Gemini] ✗ Categorization error:', error.message);

      if (error.status === 429 || error.message.includes('429')) {
        GLOBAL_COOLDOWN_UNTIL = Date.now() + 15000;
        console.error('[Gemini] Rate limited - too many requests');
        return {
          success: false,
          error: 'Rate limited - too many requests',
          errorCode: 429,
          timestamp: new Date(),
        };
      }

      if (error.status === 403 || error.message.includes('403')) {
        console.error('[Gemini] Invalid API key or insufficient permissions');
        return {
          success: false,
          error: 'Invalid API key or insufficient permissions',
          errorCode: 403,
          timestamp: new Date(),
        };
      }

      if (error.status === 400 || error.message.includes('400')) {
        console.error('[Gemini] Bad request:', error.message);
        return {
          success: false,
          error: 'Bad request to Gemini API',
          errorCode: 400,
          details: error.message,
          timestamp: new Date(),
        };
      }

      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check if API is available
   * @returns {boolean}
   */
  isAvailable() {
    return !!this.apiKey;
  }

  /**
   * Get API status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      available: this.isAvailable(),
      configured: !!this.apiKey,
      service: 'Google Gemini Vision API',
      model: 'gemini-2.0-flash',
    };
  }
}

module.exports = new GeminiService();
