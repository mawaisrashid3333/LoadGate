# Backend Development Guide

## Project Structure

```
backend/
├── src/
│   ├── index.js              # Server entry point
│   ├── controllers/          # Route handlers & business logic
│   ├── services/             # External integrations (Arduino, Camera)
│   ├── models/               # MongoDB schemas
│   ├── routes/               # API endpoint definitions
│   └── middleware/           # Express middleware
├── package.json
├── .env.example              # Environment template
└── nodemon.json              # Auto-reload configuration
```

## Development Workflow

### Start Development Server
```bash
npm run dev
```
This uses nodemon to auto-restart on file changes.

### Start Production Server
```bash
npm start
```

### Linting
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

## Environment Variables

Copy `.env.example` to `.env` and update:
- `MONGODB_URI`: Database connection
- `PORT`: Server port
- `ARDUINO_PORT`: Serial COM port
- `MAX_WEIGHT_LIMIT`: Max vehicle weight

## Key Services

### IR Event Service
Located in `services/irEventService.js`
- Listens to Arduino serial data
- Emits vehicle detection events
- NOT using Socket.IO

**Usage:**
```javascript
const irEventService = require('./services/irEventService');

// Listen for vehicle detection
irEventService.onVehicleDetected((event) => {
  console.log('Vehicle detected:', event.weight);
});
```

### Camera Service
Located in `services/cameraService.js`
- Captures snapshots
- Gets live stream URL
- Checks camera connection

## API Endpoints

### GET `/api/health`
System health check

**Response:**
```json
{
  "status": "ok",
  "message": "LoadGate API is running",
  "timestamp": "2026-05-02T10:30:00Z"
}
```

### Vehicles CRUD
- `GET /api/vehicles` - List all
- `POST /api/vehicles` - Create
- `GET /api/vehicles/:id` - Get one
- `DELETE /api/vehicles/:id` - Delete

### Arduino Communication
- `GET /api/arduino/status` - Check connection
- `POST /api/arduino/command` - Send command
- `GET /api/arduino/events/stream` - Server-Sent Events stream

## Database Models

### Vehicle
```javascript
{
  weight: Number,
  status: String ('ALLOWED' | 'BLOCKED'),
  image: String,
  carNumber: String,
  timestamp: Date,
  metadata: Object
}
```

### Settings
```javascript
{
  maxWeightLimit: Number,
  calibrationFactor: Number,
  systemName: String,
  location: String,
  isActive: Boolean
}
```

## Testing

### Manual API Testing
Use Postman or curl:

```bash
# Create vehicle record
curl -X POST http://localhost:5000/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{"weight":3500,"status":"ALLOWED"}'

# Get all records
curl http://localhost:5000/api/vehicles

# Get analytics
curl http://localhost:5000/api/vehicles/analytics/summary
```

## Common Tasks

### Add New Endpoint
1. Create controller method in `controllers/`
2. Define route in `routes/`
3. Add route to `index.js`

### Add Database Model
1. Create schema file in `models/`
2. Export mongoose model
3. Import and use in controllers

### Debug Arduino Connection
```javascript
// In index.js or service
console.log(irEventService.getStatus());
// Output: { connected: boolean, port: string, timestamp: string }
```

## Performance Tips

- Use MongoDB indexes for frequently queried fields
- Implement pagination for large datasets
- Cache static data
- Use connection pooling for database
- Monitor serial port for data loss

## Debugging

### Enable Verbose Logging
Set `LOG_LEVEL=debug` in .env

### Check Arduino Connection
```bash
# Windows
Get-WmiObject Win32_SerialPort | Select-Object Name, Description

# Linux
ls -la /dev/ttyUSB*

# macOS
ls -la /dev/tty.usbserial*
```

---

**For more info:** See [Backend Services Documentation](./src/services/)
