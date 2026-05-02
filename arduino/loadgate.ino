/**
 * LoadGate Arduino Firmware
 * Smart Vehicle Weighing & Access Control System
 * 
 * Hardware:
 * - Arduino (Uno/Mega)
 * - 4x 50kg Load Cells with HX711 Amplifier
 * - IR Sensor for vehicle detection
 * - Servo Motor for barrier control
 * - IP Camera (separate network connection)
 */

#include <HX711.h>

// ==================== Pin Configuration ====================
// Load Cell Sensor (HX711)
const int LOADCELL_DOUT_PIN = 4;
const int LOADCELL_SCK_PIN = 5;

// IR Sensor
const int IR_SENSOR_PIN = 2;

// Servo Motor
const int SERVO_PIN = 9;

// ==================== Global Variables ====================
HX711 scale;

// Calibration values (adjust based on your load cells)
const float CALIBRATION_FACTOR = 20.0; // Adjust based on calibration
const float MAX_WEIGHT_LIMIT = 5000.0; // kg

// IR sensor state
volatile boolean vehicleDetected = false;
unsigned long lastIRTriggerTime = 0;
const unsigned long IR_DEBOUNCE_TIME = 500; // ms

// ==================== Setup ====================
void setup() {
  Serial.begin(9600);
  
  // Initialize Load Cell
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(CALIBRATION_FACTOR);
  scale.tare(); // Reset scale to 0
  
  // Initialize IR Sensor
  pinMode(IR_SENSOR_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(IR_SENSOR_PIN), onVehicleDetected, FALLING);
  
  // Initialize Servo
  pinMode(SERVO_PIN, OUTPUT);
  
  delay(1000);
  Serial.println("LoadGate Arduino Initialized");
  printSystemInfo();
}

// ==================== Main Loop ====================
void loop() {
  if (vehicleDetected) {
    handleVehicleDetection();
    vehicleDetected = false;
  }
  
  // Periodic weight monitoring (optional)
  delay(100);
}

// ==================== IR Sensor Interrupt Handler ====================
void onVehicleDetected() {
  unsigned long currentTime = millis();
  
  // Debouncing
  if (currentTime - lastIRTriggerTime < IR_DEBOUNCE_TIME) {
    return;
  }
  
  lastIRTriggerTime = currentTime;
  vehicleDetected = true;
}

// ==================== Vehicle Detection Handler ====================
void handleVehicleDetection() {
  // Wait for vehicle to stabilize on the scale
  delay(500);
  
  // Read weight
  float weight = readWeight();
  
  // Determine if vehicle is allowed
  boolean isAllowed = weight <= MAX_WEIGHT_LIMIT;
  
  // Send data to backend
  sendDataToBackend(weight, isAllowed);
  
  // Control barrier
  if (isAllowed) {
    openBarrier();
    Serial.println("BARRIER: OPEN");
  } else {
    closeBarrier();
    Serial.println("BARRIER: CLOSED");
  }
  
  // Wait before allowing next detection
  delay(3000);
}

// ==================== Weight Reading ====================
float readWeight() {
  // Average multiple readings for accuracy
  float totalWeight = 0;
  const int READINGS = 5;
  
  for (int i = 0; i < READINGS; i++) {
    totalWeight += scale.get_units();
    delay(100);
  }
  
  float averageWeight = totalWeight / READINGS;
  
  Serial.print("Weight: ");
  Serial.print(averageWeight);
  Serial.println(" kg");
  
  return averageWeight;
}

// ==================== Barrier Control ====================
void openBarrier() {
  // Servo angle for open position (adjust as needed)
  setServoAngle(180);
}

void closeBarrier() {
  // Servo angle for closed position
  setServoAngle(0);
}

void setServoAngle(int angle) {
  // PWM pulse width: 1000-2000 microseconds (0-180 degrees)
  int pulseWidth = map(angle, 0, 180, 1000, 2000);
  
  for (int i = 0; i < 15; i++) {
    digitalWrite(SERVO_PIN, HIGH);
    delayMicroseconds(pulseWidth);
    digitalWrite(SERVO_PIN, LOW);
    delayMicroseconds(20000 - pulseWidth);
  }
}

// ==================== Data Communication ====================
void sendDataToBackend(float weight, boolean isAllowed) {
  // Format: VEHICLE|weight|status|timestamp
  String status = isAllowed ? "ALLOWED" : "BLOCKED";
  String message = "VEHICLE|" + String(weight) + "|" + status + "|" + millis();
  
  Serial.println(message);
}

void printSystemInfo() {
  Serial.println("\n=== LoadGate System Info ===");
  Serial.print("Max Weight Limit: ");
  Serial.print(MAX_WEIGHT_LIMIT);
  Serial.println(" kg");
  Serial.print("Calibration Factor: ");
  Serial.println(CALIBRATION_FACTOR);
  Serial.print("IR Debounce Time: ");
  Serial.print(IR_DEBOUNCE_TIME);
  Serial.println(" ms");
  Serial.println("System ready for operation\n");
}

// ==================== Debug Commands ====================
void serialEvent() {
  while (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command == "TARE") {
      scale.tare();
      Serial.println("Scale tared");
    } else if (command == "WEIGHT") {
      Serial.println(readWeight());
    } else if (command == "OPEN") {
      openBarrier();
      Serial.println("Barrier opened");
    } else if (command == "CLOSE") {
      closeBarrier();
      Serial.println("Barrier closed");
    } else if (command == "INFO") {
      printSystemInfo();
    }
  }
}
