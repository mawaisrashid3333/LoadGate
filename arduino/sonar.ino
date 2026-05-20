/**
 * Sonar Sensor Handler - HC-SR04
 * Detects vehicles and humans for intelligent gate control
 * 
 * Pin Configuration:
 * - TRIGGER: Pin 3 (sends pulse)
 * - ECHO: Pin 4 (receives reflection)
 * 
 * Detection Ranges:
 * - Humans: 10-100 cm (closer proximity)
 * - Vehicles: 100-300 cm (normal approach)
 * - Clear: > 300 cm
 */

#ifndef SONAR_H
#define SONAR_H

// ==================== Sonar Pin Configuration ====================
const int SONAR_TRIGGER_PIN = 3;
const int SONAR_ECHO_PIN = 4;

// ==================== Detection Parameters ====================
// Distance thresholds in centimeters
const float HUMAN_MIN_DISTANCE = 10.0;      // Minimum detection distance
const float HUMAN_MAX_DISTANCE = 100.0;     // Human range (close proximity)
const float VEHICLE_MIN_DISTANCE = 80.0;    // Vehicle range start
const float VEHICLE_MAX_DISTANCE = 300.0;   // Vehicle range end
const float CLEAR_DISTANCE = 350.0;         // No detection beyond this

// Detection state
volatile boolean humanDetected = false;
volatile boolean vehicleDetected = false;
unsigned long lastSonarTriggerTime = 0;
const unsigned long SONAR_DEBOUNCE_TIME = 500; // Debounce interval

// ==================== Sonar Distance Reading ====================
/**
 * Read distance from HC-SR04 sonar sensor
 * @return distance in centimeters (0 if error)
 */
float readSonarDistance() {
  // Send 10 microsecond pulse to trigger pin
  digitalWrite(SONAR_TRIGGER_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(SONAR_TRIGGER_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(SONAR_TRIGGER_PIN, LOW);
  
  // Measure pulse duration on echo pin (max 30ms timeout)
  long pulseDuration = pulseIn(SONAR_ECHO_PIN, HIGH, 30000);
  
  // Convert to distance
  // Speed of sound: 343 m/s at sea level
  // Distance = (time * speed) / 2
  // In cm: distance = (microseconds * 0.0343) / 2
  if (pulseDuration == 0) {
    return 0.0; // Timeout - no object detected
  }
  
  float distance = (pulseDuration * 0.0343) / 2.0;
  
  // Limit to realistic range (max ~4 meters)
  if (distance > 400) {
    return 0.0;
  }
  
  return distance;
}

// ==================== Detection Classification ====================
/**
 * Classify detected object based on distance
 * Humans are typically detected at closer range (10-100cm)
 * Vehicles approach from further away (80-300cm)
 */
String classifyDetection(float distance) {
  if (distance < HUMAN_MIN_DISTANCE) {
    return "ERROR"; // Too close - invalid reading
  }
  
  if (distance >= HUMAN_MIN_DISTANCE && distance <= HUMAN_MAX_DISTANCE) {
    return "HUMAN";
  }
  
  if (distance >= VEHICLE_MIN_DISTANCE && distance <= VEHICLE_MAX_DISTANCE) {
    return "VEHICLE";
  }
  
  if (distance > CLEAR_DISTANCE) {
    return "CLEAR";
  }
  
  // Overlap zone - decide based on movement pattern
  // For now, assume vehicle if in middle range
  if (distance > HUMAN_MAX_DISTANCE && distance < VEHICLE_MIN_DISTANCE) {
    return "VEHICLE"; // Could be slow vehicle or person with extended arm
  }
  
  return "UNKNOWN";
}

// ==================== Sonar Monitoring ====================
/**
 * Continuous sonar monitoring
 * Call this in main loop to check for objects
 */
void monitorSonar() {
  unsigned long currentTime = millis();
  
  // Debounce checks
  if (currentTime - lastSonarTriggerTime < SONAR_DEBOUNCE_TIME) {
    return;
  }
  
  // Read distance
  float distance = readSonarDistance();
  
  if (distance == 0.0) {
    // No detection - reset flags
    humanDetected = false;
    vehicleDetected = false;
    return;
  }
  
  // Classify and report
  String classification = classifyDetection(distance);
  
  if (classification == "HUMAN") {
    if (!humanDetected) {
      humanDetected = true;
      vehicleDetected = false;
      lastSonarTriggerTime = currentTime;
      sendHumanDetection(distance);
    }
  } 
  else if (classification == "VEHICLE") {
    if (!vehicleDetected) {
      vehicleDetected = true;
      humanDetected = false;
      lastSonarTriggerTime = currentTime;
      sendVehicleDetection(distance);
    }
  }
  else if (classification == "CLEAR") {
    humanDetected = false;
    vehicleDetected = false;
  }
}

// ==================== Detection Reporting ====================
/**
 * Report human detection to backend
 * Format: HUMAN|distance|confidence|timestamp
 */
void sendHumanDetection(float distance) {
  // Calculate confidence based on distance
  // Humans closer to sensor = higher confidence
  float confidence = ((HUMAN_MAX_DISTANCE - distance) / HUMAN_MAX_DISTANCE) * 100.0;
  confidence = max(0, min(100, confidence)); // Clamp 0-100
  
  String message = "HUMAN|" + String(distance, 2) + "|" + String(confidence, 1) + "|" + millis();
  Serial.println(message);
  
  Serial.print("DEBUG: Human detected at ");
  Serial.print(distance);
  Serial.println(" cm");
}

/**
 * Report vehicle detection to backend
 * Format: SONAR_VEHICLE|distance|confidence|timestamp
 */
void sendVehicleDetection(float distance) {
  // Calculate confidence based on distance from expected vehicle range
  float midRange = (VEHICLE_MIN_DISTANCE + VEHICLE_MAX_DISTANCE) / 2.0;
  float confidence = 100.0 - (abs(distance - midRange) / midRange * 100.0);
  confidence = max(0, min(100, confidence)); // Clamp 0-100
  
  String message = "SONAR_VEHICLE|" + String(distance, 2) + "|" + String(confidence, 1) + "|" + millis();
  Serial.println(message);
  
  Serial.print("DEBUG: Vehicle detected at ");
  Serial.print(distance);
  Serial.println(" cm");
}

/**
 * Get current sonar state
 * @return distance or 0 if nothing detected
 */
float getCurrentDistance() {
  return readSonarDistance();
}

/**
 * Get detection status
 */
String getSonarStatus() {
  float distance = readSonarDistance();
  
  if (humanDetected) {
    return "HUMAN_DETECTED:" + String(distance, 2);
  }
  if (vehicleDetected) {
    return "VEHICLE_DETECTED:" + String(distance, 2);
  }
  
  return "CLEAR:" + String(distance, 2);
}

#endif // SONAR_H
