#include <Servo.h>
#include "HX711.h"

// ================= PIN DEFINITIONS =================
const int TRIG = 9;
const int ECHO = 10;
const int SERVO_PIN = 11;
const int LOAD_CELL_DT = 13;
const int LOAD_CELL_SCK = 12;

// ================= SERVO =================
Servo servoGate;
const int SERVO_CLOSED = 0;    // Gate closed position
const int SERVO_OPEN = 90;     // Gate open position

// ================= LOAD CELL =================
HX711 scale;
const float CALIBRATION_FACTOR = 4.58;  // Calibrated value from HX711 calibration code

// state tracking
bool objectPresent = false;
bool detectionProcessing = false;  // Prevent multiple detections
unsigned long lastSeenTime = 0;
unsigned long gateOpenedTime = 0;  // Track when gate was opened
float lastReadWeight = 0;
float lastSonarDistance = -1;  // Track last sonar distance for deduplication
const float DISTANCE_CHANGE_THRESHOLD = 10.0;  // cm - minimum change to trigger new detection

// tuning
const unsigned long RESET_TIME = 1500;     // object considered gone after 1.5s
const unsigned long GATE_AUTO_CLOSE = 40000;  // Auto-close gate after 40 seconds
const int SAMPLE_DELAY = 100;  // Reduced from 200ms for faster response

void setup() {
  Serial.begin(9600);

  // Sonar setup
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);

  // Servo setup
  servoGate.attach(SERVO_PIN);
  servoGate.write(SERVO_CLOSED);  // Start with gate closed
  delay(500);

  // Load cell setup
  scale.begin(LOAD_CELL_DT, LOAD_CELL_SCK);
  delay(500);  // Wait for HX711 to stabilize
  scale.set_scale(CALIBRATION_FACTOR);
  scale.tare();  // Reset scale to zero
  delay(500);  // Wait after tare

  Serial.println("=== LOADGATE SYSTEM INITIALIZED ===");
  Serial.println("✓ Sonar on pins TRIG=9, ECHO=10");
  Serial.println("✓ Servo on pin 11");
  Serial.println("✓ Load Cell on pins DT=13, SCK=12");
  Serial.println("✓ Calibration Factor: " + String(CALIBRATION_FACTOR, 2));
  Serial.println("✓ Gate auto-close after: " + String(GATE_AUTO_CLOSE / 1000) + " seconds");
  Serial.println("=====================================");
}

// ================= LOOP =================
void loop() {

  float distance = readSonar();
  String type = classify(distance);

  // always show live data
  Serial.print("DISTANCE: ");
  Serial.println(distance);

  Serial.print("TYPE: ");
  Serial.println(type);

  // Log live weight continuously for debugging
  float liveWeight = readWeightNonBlocking();
  Serial.print("LIVE_WEIGHT: ");
  Serial.print(liveWeight, 2);
  Serial.println(" kg");

  unsigned long now = millis();

  // Check for backend commands (allow/block decision)
  checkSerialCommands();

  // Auto-close gate after 40 seconds
  if (gateOpenedTime > 0 && (now - gateOpenedTime > GATE_AUTO_CLOSE)) {
    Serial.println(">>> AUTO-CLOSE: 40 seconds elapsed, closing gate");
    moveServo(SERVO_CLOSED);
    gateOpenedTime = 0;
    detectionProcessing = false;
    objectPresent = false;
  }

  // Only detect new objects if not already processing one
  if (!detectionProcessing && type != "CLEAR" && type != "UNKNOWN") {

    // NEW ENTRY (object not present before OR timeout passed)
    if (!objectPresent || (now - lastSeenTime > RESET_TIME)) {

      // Check if distance changed significantly from last detection (deduplication)
      bool distanceChanged = (lastSonarDistance < 0) || (abs(distance - lastSonarDistance) > DISTANCE_CHANGE_THRESHOLD);
      
      if (distanceChanged) {
        objectPresent = true;
        detectionProcessing = true;  // Lock out new detections
        lastSeenTime = now;
        lastSonarDistance = distance;  // Update tracked distance

        // Read weight at detection time (multiple samples for accuracy)
        float detectionWeight = readWeight();
        lastReadWeight = detectionWeight;

        Serial.print("NEW OBJECT DETECTED: ");
        Serial.println(type);
        Serial.print("DISTANCE: ");
        Serial.print(distance, 1);
        Serial.println(" cm");
        Serial.print("WEIGHT_AT_DETECTION: ");
        Serial.print(detectionWeight, 2);
        Serial.println(" kg");

        // Send detection with distance to backend
        String eventString = String(distance, 1) + "|" + String(detectionWeight, 2);
        Serial.print("[DEBUG] Formatted EVENT string: EVENT:");
        Serial.println(eventString);
        Serial.println("EVENT:" + eventString);
      } else {
        Serial.print("[DEDUPE] Distance unchanged (last: ");
        Serial.print(lastSonarDistance, 1);
        Serial.print(" current: ");
        Serial.print(distance, 1);
        Serial.println(" cm) - skipping frame pass");
      }
    } 
    else {
      // update time so object stays "alive"
      lastSeenTime = now;
    }
  }

  // ---------------- RESET CONDITION ----------------
  if (type == "CLEAR") {

    if (objectPresent && (now - lastSeenTime > RESET_TIME)) {
      objectPresent = false;
      lastSonarDistance = -1;  // Reset distance tracking
      Serial.println("OBJECT LEFT");
      
      // Only close gate if it wasn't auto-opened by backend
      // (Let backend control gate closure, or auto-close after 40 seconds)
      if (gateOpenedTime == 0) {
        // Gate was not opened by ALLOW command, close it
        moveServo(SERVO_CLOSED);
      }
      // If gate was opened (gateOpenedTime > 0), let auto-close timer handle it
    }
  }

  delay(SAMPLE_DELAY);
}

// ================= SONAR =================
float readSonar() {

  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  long duration = pulseIn(ECHO, HIGH, 30000);

  if (duration == 0) return -1;

  float distance = (duration * 0.0343) / 2;

  if (distance > 400) return -1;

  return distance;
}

// ================= CLASSIFICATION =================
String classify(float d) {

  if (d <= 0) return "CLEAR";

  // NEW THRESHOLDS:
  // > 800 cm: No object (clear)
  // < 200 cm: Object detected (pass to Gemini)
  if (d > 800) return "CLEAR";  // More than 8 meters = no object

  if (d >= 200 && d <= 800) return "OBJECT";  // 2-8 meters = object detected

  if (d > 0 && d < 10) return "GROUND";  // Very close - sonar facing ground
  
  if (d >= 10 && d < 200) return "OBJECT";  // Less than 2 meters = object

  return "UNKNOWN";
}

// ================= LOAD CELL =================
float readWeight() {
  if (!scale.is_ready()) {
    Serial.println("[ERROR] Load cell not ready!");
    return 0;
  }

  // Take average of 10 readings for high accuracy when detecting
  float totalWeight = 0;
  const int SAMPLES = 10;
  
  Serial.println("[WEIGHT_DEBUG] Starting 10-sample average...");
  
  for (int i = 0; i < SAMPLES; i++) {
    float reading = scale.get_units();
    totalWeight += reading;
    Serial.print("[WEIGHT_DEBUG] Sample ");
    Serial.print(i + 1);
    Serial.print("/10: ");
    Serial.print(reading, 3);
    Serial.println(" kg");
    delay(30);
  }
  
  float avgWeight = totalWeight / SAMPLES;
  
  Serial.print("[WEIGHT_DEBUG] Total: ");
  Serial.print(totalWeight, 3);
  Serial.print(" / Samples: ");
  Serial.print(SAMPLES);
  Serial.print(" = Average: ");
  Serial.print(avgWeight, 3);
  Serial.println(" kg");
  
  // Ensure weight is non-negative
  if (avgWeight < 0) avgWeight = 0;
  
  return avgWeight;
}

// Non-blocking weight read for continuous logging
float readWeightNonBlocking() {
  if (!scale.is_ready()) {
    return 0;
  }
  
  // Single fast reading for logging
  float weight = scale.get_units();
  
  if (weight < 0) weight = 0;
  
  return weight;
}

// ================= SERVO CONTROL =================
void moveServo(int angle) {
  if (angle < 0) angle = 0;
  if (angle > 180) angle = 180;
  
  servoGate.write(angle);
  delay(400);  // Reduced from 600ms to 400ms (servo movement is faster)
  
  Serial.print("SERVO_MOVED: ");
  Serial.println(angle);
}

// ================= SERIAL COMMAND HANDLER =================
void checkSerialCommands() {
  while (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    Serial.print("[DEBUG] Received serial: ");
    Serial.println(command);
    
    if (command.length() == 0) return;
    
    // Command format: CMD:ACTION or CMD:ACTION:VALUE
    if (command.startsWith("CMD:")) {
      String action = command.substring(4);
      
      Serial.print("[DEBUG] Parsed action: ");
      Serial.println(action);
      
      if (action.equals("ALLOW")) {
        // Backend says to allow - open gate
        Serial.println(">>> BACKEND_ALLOW: Opening gate to 90 degrees");
        moveServo(SERVO_OPEN);
        gateOpenedTime = millis();  // Start 40-second timer
        detectionProcessing = false;  // Allow new detections after this
        Serial.println(">>> Servo move completed");
      }
      else if (action.equals("BLOCK")) {
        // Backend says to block - close gate
        Serial.println(">>> BACKEND_BLOCK: Keeping gate closed to 0 degrees");
        moveServo(SERVO_CLOSED);
        gateOpenedTime = 0;
        detectionProcessing = false;  // Allow new detections after this
        Serial.println(">>> Servo move completed");
      }
      else if (action.startsWith("SET_LIMIT:")) {
        // Update weight limit
        float newLimit = action.substring(10).toFloat();
        Serial.print("Weight limit updated to: ");
        Serial.println(newLimit);
      }
      else {
        Serial.print("Unknown command: ");
        Serial.println(action);
      }
    }
  }
}