# LoadGate - Complete Project Setup

## 📁 Project Structure

```
LoadGate/
├── frontend/                 # Next.js web application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── pages/           # Next.js pages
│   │   ├── components/      # React components
│   │   ├── utils/           # Helper functions & API client
│   │   └── styles/          # CSS styles
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── .eslintrc.json
│   └── .prettierrc.json
│
├── backend/                  # Express.js API server
│   ├── src/
│   │   ├── index.js         # Entry point
│   │   ├── routes/          # API route handlers
│   │   ├── controllers/     # Business logic
│   │   ├── services/        # External services
│   │   │   ├── irEventService.js
│   │   │   └── cameraService.js
│   │   ├── models/          # MongoDB schemas
│   │   └── middleware/      # Express middleware
│   ├── package.json
│   ├── .env.example
│   ├── nodemon.json
│   ├── .eslintrc.json
│   └── .prettierrc.json
│
├── arduino/                  # Arduino firmware
│   ├── loadgate.ino
│   └── README.md
│
├── docs/                     # Additional documentation
│
├── context.md               # Project context (THIS FILE MAINTAINS PROJECT STATE)
├── run.ps1                  # PowerShell startup script
├── setup.js                 # System dependencies setup
└── .gitignore
```

## 🚀 Quick Start

### 1. Run Setup (One-time)
```bash
node setup.js
```

This will:
- Check Node.js, MongoDB, and FFmpeg installation
- Create environment files
- Set up .gitignore

### 2. Install Dependencies
```bash
# Frontend
cd frontend && npm install && cd ..

# Backend
cd backend && npm install && cd ..
```

### 3. Configure Environment
```bash
# Edit backend/.env with your settings
# Key variables:
# - MONGODB_URI: MongoDB connection string
# - PORT: Backend server port
# - FRONTEND_URL: Frontend URL for CORS
# - ARDUINO_PORT: COM port for Arduino (e.g., COM3)
```

### 4. Start All Services
```bash
# Windows
.\run.ps1

# Linux/Mac
./run.ps1
```

This opens separate terminal windows for:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

## 🔧 Technology Stack

### Frontend
- **Next.js 14** - React framework
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS
- **Zustand** - State management
- **Axios** - HTTP client

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Serialport** - Arduino communication
- **Multer** - File uploads

### Real-Time Communication
- **EventEmitter** - IR event service (NO Socket.IO)
- **Server-Sent Events (SSE)** - Real-time updates

### Arduino
- **C/C++** - Firmware
- **HX711** - Load cell library
- **Servo** - Barrier control

## 📡 API Endpoints

### Vehicles
- `GET /api/vehicles` - Get all records
- `POST /api/vehicles` - Create new record
- `GET /api/vehicles/:id` - Get single record
- `DELETE /api/vehicles/:id` - Delete record
- `GET /api/vehicles/analytics/summary` - Get analytics

### Arduino
- `GET /api/arduino/status` - Check connection
- `POST /api/arduino/command` - Send command
- `GET /api/arduino/events/stream` - SSE stream for IR events

### Camera
- `GET /api/camera/status` - Check connection
- `GET /api/camera/stream` - Get stream URL
- `POST /api/camera/snapshot` - Capture snapshot

## 🔄 Data Flow

```
Arduino (IR + Weight) → Serial/USB
         ↓
   IR Event Service
         ↓
   MongoDB Database
         ↓
Backend REST API
         ↓
   Frontend (Next.js)
         ↓
Dashboard Display
```

## 📝 Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/loadgate
PORT=5000
FRONTEND_URL=http://localhost:3000
ARDUINO_PORT=COM3
ARDUINO_BAUDRATE=9600
MAX_WEIGHT_LIMIT=5000
JWT_SECRET=your_secret_key
```

## 🧪 Testing

### Manual Arduino Commands
1. Connect Arduino via USB
2. Open Serial Monitor (9600 baud)
3. Send commands:
   - `TARE` - Reset scale
   - `WEIGHT` - Get current weight
   - `OPEN` - Open barrier
   - `CLOSE` - Close barrier

### Test API Health
```bash
curl http://localhost:5000/api/health
```

## 📦 Deployment

### Prerequisites
- Node.js 16+
- MongoDB Atlas or local instance
- FFmpeg installed
- Arduino connected and programmed

### Production Build
```bash
# Frontend
cd frontend && npm run build

# Backend
# Ensure .env production values are set
npm start
```

## 🐛 Troubleshooting

### Arduino not connecting
- Check COM port in .env
- Verify USB driver installation
- Test with Arduino IDE

### MongoDB connection fails
- Ensure MongoDB service is running
- Check connection string in .env
- Verify network connectivity

### Frontend can't reach backend
- Check FRONTEND_URL in backend .env
- Verify CORS settings
- Check firewall rules

## 📚 Documentation

- [Arduino Setup Guide](./arduino/README.md)
- [Project Context](./context.md)
- [Backend Services](./backend/src/services/)
- [Frontend Components](./frontend/src/components/)

## 🔐 Security Notes

- Change all default passwords in production
- Use environment variables for sensitive data
- Enable HTTPS in production
- Implement proper authentication
- Use strong MongoDB credentials

## 📋 Development Workflow

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and test
3. Commit with descriptive message
4. Push to remote
5. Create pull request

## 🤝 Contributing

- Follow ESLint rules
- Run Prettier before commit
- Test all changes
- Update documentation
- Keep commits atomic

---

**Project started:** May 2, 2026
**Last updated:** May 2, 2026
