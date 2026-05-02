# LoadGate - Arduino Setup Guide

## Hardware Requirements

- Arduino Board (Uno, Mega, or compatible)
- 4 × 50kg Load Cells
- 1 × HX711 Load Cell Amplifier
- 1 × IR Sensor (Motion/Proximity)
- 1 × Servo Motor (for barrier control)
- Connecting wires and power supply
- IP Camera (separate network connection)

## Wiring Diagram

### Load Cell (HX711):
- DT Pin → Arduino Pin 4
- SCK Pin → Arduino Pin 5
- VCC → 5V
- GND → GND

### IR Sensor:
- Signal Pin → Arduino Pin 2 (Interrupt-enabled)
- VCC → 5V
- GND → GND

### Servo Motor:
- Signal Pin → Arduino Pin 9 (PWM)
- VCC → 5V
- GND → GND

## Setup Instructions

1. Install Arduino IDE from https://www.arduino.cc/en/software
2. Install required libraries:
   - HX711 Arduino Library (by Bogdan Necula)
3. Upload `loadgate.ino` to your Arduino board
4. Connect Arduino to computer via USB
5. Upload the sketch

## Calibration

After uploading:

1. Place known weight on the scale (e.g., 10kg)
2. Note the reading in Serial Monitor
3. Adjust `CALIBRATION_FACTOR` in code
4. Re-upload and test

## Serial Commands

Send these via Serial Monitor for testing:

- `TARE` - Reset scale to zero
- `WEIGHT` - Get current weight
- `OPEN` - Open barrier
- `CLOSE` - Close barrier
- `INFO` - System information

## Output Format

Vehicle detection message format:
```
VEHICLE|{weight}|{status}|{timestamp}
```

Example:
```
VEHICLE|3500|ALLOWED|1234567890
```

## Troubleshooting

- **No data**: Check USB connection and COM port setting
- **Wrong weight**: Calibrate with known weight
- **Barrier not moving**: Check servo power and pin connection
- **IR not detecting**: Verify sensor polarity and sensitivity

**Last Updated:** May 2, 2026
