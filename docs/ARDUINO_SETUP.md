# Arduino IDE Installation & Setup

This directory contains the Arduino firmware for the LoadGate system.

## Requirements

- Arduino IDE 2.0+
- Arduino Board (Uno/Mega)
- USB Cable (Type B for Uno, Type B or USB-C depending on model)

## Installation Steps

1. **Download Arduino IDE**
   - Visit https://www.arduino.cc/en/software
   - Download version 2.0 or latest

2. **Install Required Libraries**
   - Open Arduino IDE
   - Go to: Sketch → Include Library → Manage Libraries
   - Search for "HX711" and install by Bogdan Necula
   - Search for "Servo" (usually pre-installed)

3. **Connect Arduino**
   - Connect Arduino board via USB
   - Note the COM port (shown in Device Manager on Windows)

4. **Upload Sketch**
   - Open `loadgate.ino` in Arduino IDE
   - Select Board: Tools → Board → Arduino Uno (or your model)
   - Select Port: Tools → Port → COM# (your port)
   - Click Upload button or Ctrl+U

## Serial Monitor Testing

After upload:

1. Open Serial Monitor: Tools → Serial Monitor
2. Set baud rate to 9600
3. Send commands:
   - `TARE` - Reset scale
   - `WEIGHT` - Get weight
   - `OPEN` - Open barrier
   - `CLOSE` - Close barrier

## Expected Output

```
LoadGate Arduino Initialized
=== LoadGate System Info ===
Max Weight Limit: 5000 kg
Calibration Factor: 20
IR Debounce Time: 500 ms
System ready for operation
```

## Calibration

1. Send command: `TARE`
2. Place known weight (e.g., 50kg)
3. Note the reading
4. Adjust CALIBRATION_FACTOR in code
5. Re-upload and repeat until accurate

## Troubleshooting

- **COM Port not showing**: Install CH340 drivers if needed
- **Upload fails**: Check board selection
- **Wrong readings**: Run calibration
- **No IR detection**: Verify sensor polarity
