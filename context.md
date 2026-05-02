# 🚗 LoadGate - Smart Vehicle Weighing & Access Control System

## Project Context

This document maintains the overall context and architecture of the LoadGate project.

---

## 📋 Overview

LoadGate is a **smart, automated vehicle monitoring and access control solution** that measures vehicle weight, controls barrier access, captures vehicle images, and provides a comprehensive web-based dashboard for monitoring and analysis.

### Core Purpose
- Measure vehicle weight in real time using load cells
- Allow or block vehicle entry based on weight limits
- Capture and store vehicle images
- Maintain digital records of all vehicle activity
- Provide intuitive web-based dashboard

---

## ⚙️ Hardware Components

- **Arduino** → Central controller
- **Load Cells (4 × 50kg)** → Measure vehicle weight
- **IR Sensor** → Detect vehicle presence
- **IP Camera** → Capture images + live stream
- **Servo Motor** → Controls barrier (open/close gate)

---

## 🔄 System Workflow

1. 🚘 Vehicle approaches the system
2. 📡 IR sensor detects vehicle presence (triggers IR event service)
3. ⚖️ Load cells measure total weight
4. 📤 Arduino sends weight data to backend via serial/USB
5. 🧠 Backend processes:
   - Checks weight against limit
   - If weight ≤ limit → allow
   - If weight > limit → block
6. 🚧 Servo motor responds:
   - Opens barrier (allowed)
   - Keeps barrier closed (blocked)
7. 📸 Camera captures vehicle image
8. 💾 Backend stores data + image locally
9. 🖥️ Web app displays record in real-time

---

## 🌐 Technology Stack

### Frontend
- **Next.js** - React framework with SSR
- **React** - UI library
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety (optional)

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM

### Real-Time & Communication
- **EventEmitter Service** - IR event listening (NOT Socket.IO)
- **REST API** - Primary communication
- **WebSocket (optional)** - For live dashboard updates
- **Server-Sent Events (SSE)** - Alternative for real-time

### Media & Processing
- **FFmpeg** - Video streaming & capture
- **Multer** - File upload handling
- **Sharp** - Image processing

### Additional
- **dotenv** - Environment configuration
- **cors** - Cross-origin requests
- **morgan** - Request logging
- **bcryptjs** - Password hashing
- **jsonwebtoken** - Authentication

---

## 🎯 Project Structure

```
LoadGate/
├── frontend/                 # Next.js web application
│   ├── public/              # Static assets (logo.png)
│   ├── src/
│   │   ├── pages/           # Next.js pages
│   │   │   ├── _app.jsx     # App wrapper with ThemeProvider
│   │   │   ├── index.jsx    # Dashboard
│   │   │   ├── vehicles.jsx # Vehicle records
│   │   │   ├── analytics.jsx# Analytics
│   │   │   └── settings.jsx # System settings
│   │   ├── components/      # React components
│   │   │   ├── Layout.jsx       # Main layout with sidebar, logo, theme toggle
│   │   │   ├── Dashboard.jsx    # Dashboard with real-time data and icons
│   │   │   └── LoadingScreen.jsx# Animated loading screen
│   │   ├── context/         # React Context
│   │   │   └── ThemeContext.jsx # Theme management (dark/light mode)
│   │   ├── utils/           # Helper functions
│   │   │   └── api.js       # API calls
│   │   └── styles/          # Global styles
│   │       └── globals.css  # Tailwind + theme support
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js   # darkMode: 'class' configured
│   └── tsconfig.json
│
├── backend/                  # Express.js API server
│   ├── src/
│   │   ├── index.js         # Entry point
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Route handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # MongoDB schemas
│   │   └── middleware/      # Express middleware
│   ├── package.json
│   ├── .env.example         # Environment template
│   └── .gitignore
│
├── arduino/                  # Arduino sketch
│   ├── loadgate.ino         # Main firmware
│   └── README.md
│
├── docs/                     # Additional documentation
│
├── context.md               # This file - project context
├── run.ps1                  # PowerShell startup script
├── setup.js                 # System dependencies installer
- **Dark/Light theme support**
- **Interactive animated loading screen**
- **React Icons for visual indicators**

### 2. Vehicle Records Management
- Unique ID per vehicle entry
- Weight measurement
- Date & time timestamp
- Captured image thumbnail
- Status: ✅ Allowed or ❌ Blocked
- **Theme-aware styling**
- **Icon indicators (MdCheckCircle, MdCancel)**

### 3. Image Capture & Storage
- Automatic capture on IR detection
- Stored locally in server storage
- Linked with vehicle record
- Thumbnail generation

### 4. Advanced Filtering
- Filter by date range
- Filter by weight range
- Filter by status (allowed/blocked)
- Search functionality

### 5. Analytics Dashboard
- Vehicles processed per day
- Average vehicle weight
- Overweight vehicle percentage
- Peak hours analysis
- **Dark/Light theme with conditional colors**
- **Icon-based stat cards (MdDirectionsCar, MdTrendingUp, MdCheckCircle, MdCancel)**

### 6. System Settings
- Set maximum weight limit
- Calibration value adjustment
- Manual barrier control
- Sensor threshold tuning
- **Theme-aware UI**
- **Action buttons with icons (MdSave, MdRefresh, MdBuild, MdTest)**

### 7. Real-Time Updates
- IR event service triggers updates
- Live vehicle detection alerts
- No page refresh required
- EventEmitter-based architecture
- **Loading screen during data fetches**

### 8. Theme System
- **Dark/Light mode toggle** in sidebar
- **System preference detection** via matchMedia API
- **localStorage persistence** for user preference
- **Class-based theme switching** (adds 'dark' class to html element)
- **Comprehensive dark mode CSS** in globals.css

### 9. UI/UX Enhancements
- **Interactive animated loading screen** with:
  - Spinning SVG spinner
  - Animated bouncing dots (3 dots with stagger animation)
  - Progress bar animation
  - Logo display
- **React Icons integration** replacing all emojis:
  - MdDashboard, MdDirectionsCar, MdAnalytics, MdSettings (navigation)
  - MdSun, MdNightlsLight (theme toggle)
  - MdCheckCircle, MdCancel (status indicators)
  - MdSignalCellularAlt (signal strength)
  - MdFileDownload, MdTrendingUp, MdBuild, MdTest, MdRefresh, MdSave (actions)
- **Logo integration** in Layout component from public/logo.png
- **Responsive design** with conditional Tailwind classes
- **Smooth transitions** and hover effects on both themes

### 10. Admin Panel
- Secure login system
- System configuration management
- Log viewing and filtering
- Manual overrides

### 11. Real-Time Updates
- IR event service triggers updates
- Live vehicle detection alerts
- No page refresh required
- EventEmitter-based architecture

### 8. Admin Panel
- Secure login system
- System configuration management
- Log viewing and filtering
- Manual overrides

### 9. Data Export
- Export records as CSV/Excel
- Date range selection
- Useful for reporting and analysis

---

## 🎨 Theme & UI System

### Dark/Light Mode Implementation

**ThemeContext.jsx** - Central theme management
- React Context API for global state
- localStorage persistence (key: 'theme')
- System preference detection (matchMedia)
- `useTheme()` hook for component access
- Auto-applies 'dark' class to html element

**tailwind.config.js** - Theme configuration
- `darkMode: 'class'` for class-based switching
- Custom color palette with primary, secondary, accent variants
- Both light and dark color schemes

**globals.css** - Comprehensive styling
- Light mode base styles (white bg, slate-900 text)
- Dark mode variants using `html.dark` selector
- Component classes with `dark:` variants
  - `.btn-primary`, `.btn-secondary`
  - `.card`, `.input`
  - Scrollbar styling for both themes

**Layout.jsx** - Main layout wrapper
- Sidebar with navigation and logo (from public/logo.png)
- Theme toggle button with icons (MdSun / MdNightlsLight)
- Responsive design (w-64 sidebar, flex-1 main content)
- Theme-aware conditional styling

### Loading Screen

**LoadingScreen.jsx** - Interactive animated component
- Fullscreen overlay (h-screen w-screen)
- Logo display (from public/logo.png)
- Animated spinner (SVG with CSS animation)
- Bouncing dots animation (3 dots with 1.4s delay)
- Progress bar animation (2s linear)
- Custom message prop for dynamic text
- Theme-aware colors
- Used during all async operations (API calls, data fetches)

### Icon System

**react-icons 4.12.0** - Icon library
- All emojis replaced with react-icons components
- Navigation icons: MdDashboard, MdDirectionsCar, MdAnalytics, MdSettings
- Status icons: MdCheckCircle (allowed), MdCancel (blocked)
- Action icons: MdSave, MdRefresh, MdBuild, MdTest, MdFileDownload, MdTrendingUp, MdSun, MdNightlsLight
- h-5 w-5 sizing standard for consistency
- Conditional coloring based on status/theme

### Page Updates

**Dashboard.jsx**
- useTheme() hook integrated
- Conditional dark/light CSS classes
- Status cards with icon indicators
- Real-time data display with LoadingScreen
- react-icons for all visual elements

**vehicles.jsx**
- Theme support with isDark state
- Icon-based status indicators (MdCheckCircle, MdCancel)
- Export button with MdFileDownload icon
- Loading state with LoadingScreen
- Dark/light table styling

**analytics.jsx**
- Theme-aware card styling
- Statistics cards with themed backgrounds
- Icon indicators for metrics (MdDirectionsCar, MdTrendingUp)
- Status badges with colors (green for allowed, red for blocked)
- LoadingScreen during data fetch

**settings.jsx**
- Theme-aware form elements
- Action buttons with icons
- Conditional background and text colors
- Dark/light mode input styling

---

## 📡 IR Event Service (NOT Socket.IO)

Instead of Socket.IO, LoadGate uses an **EventEmitter-based service** for IR events:

### How it works:
1. Arduino detects IR signal
2. Sends signal to backend via serial/USB
3. Backend IR Service receives signal
4. Emits event to all connected subscribers
5. Dashboard receives real-time update via polling or SSE

### Benefits:
- Lightweight
- No additional WebSocket library dependency
- Easier to maintain
- Can scale with multiple backends
- Can integrate with message queues (Redis/RabbitMQ) if needed

---

## 🔐 API Structure

### Core Endpoints

**Vehicles**
- `GET /api/vehicles` - List all records
- `GET /api/vehicles/:id` - Get specific record
- `POST /api/vehicles` - Create record
- `DELETE /api/vehicles/:id` - Delete record

**Settings**
- `GET /api/settings` - Get system settings
- `POST /api/settings` - Update settings

**IR Events**
- `GET /api/events/stream` - Server-Sent Events stream
- `GET /api/events/latest` - Get latest IR event

**Camera**
- `GET /api/camera/stream` - Live camera feed
- `GET /api/camera/snapshot` - Latest snapshot

**Analytics**
- `GET /api/analytics/daily` - Daily statistics
- `GET /api/analytics/summary` - Summary statistics

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MongoDB (local or Atlas)
- Arduino board + connected sensors
- FFmpeg installed on system

### Installation
```bash
# Run setup to install system dependencies
node setup.js

# Start all services
.\run.ps1
```

### Manual Start (if needed)
```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev

# Terminal 3 - Arduino (upload sketch via Arduino IDE)
```

---

## 🔄 Future Enhancements

### Phase 2
- Vehicle type detection using Google Gemini API
- Number plate recognition
- Multi-gate support
- Cloud image storage integration

### Phase 3
- Mobile app (React Native)
- Email/SMS notifications
- Advanced analytics
- Machine learning for pattern detection

---

## 📝 Development Guidelines

- Use TypeScript for type safety
- Follow RESTful API conventions
- Implement proper error handling
- Write unit tests for services
- Document all API endpoints
- Use environment variables for configuration
- Keep frontend and backend loosely coupled

---

## ✅ Implementation Status

### Phase 1 - Core Infrastructure (✅ COMPLETED)

**Backend**
- ✅ Express.js server setup
- ✅ MongoDB/Mongoose models (Vehicle, Settings)
- ✅ REST API routes (vehicles, arduino, camera, settings)
- ✅ IR EventEmitter service
- ✅ Arduino serial communication
- ✅ Camera service integration
- ✅ Environment configuration (.env.example)

**Frontend - Setup**
- ✅ Next.js 14 project structure
- ✅ TypeScript configuration
- ✅ Tailwind CSS integration
- ✅ PostCSS configuration
- ✅ Path aliases (@/*)

**Arduino**
- ✅ HX711 load cell integration (4 × 50kg)
- ✅ IR sensor interrupt handling
- ✅ Servo motor barrier control
- ✅ Serial communication protocol

**Project Setup**
- ✅ run.ps1 PowerShell startup script (single terminal execution)
- ✅ setup.js system dependency checker with auto-install
- ✅ Package.json with npm scripts
- ✅ context.md project documentation

### Phase 2 - UI/UX Enhancements (✅ COMPLETED)

**Theme System**
- ✅ ThemeContext.jsx with localStorage persistence
- ✅ Tailwind darkMode: 'class' configuration
- ✅ System preference detection
- ✅ globals.css with comprehensive dark/light styling

**Loading Screen**
- ✅ LoadingScreen.jsx component
- ✅ Animated SVG spinner
- ✅ Bouncing dots animation (1.4s)
- ✅ Progress bar animation (2s)
- ✅ Logo display integration
- ✅ Theme-aware colors

**Icon System**
- ✅ react-icons 4.12.0 package added
- ✅ Layout component with icon navigation
- ✅ Dashboard with status and metric icons
- ✅ Vehicles page with filtered view and export button
- ✅ Analytics page with statistic icons
- ✅ Settings page with action buttons

**Layout & Navigation**
- ✅ Layout.jsx with sidebar
- ✅ Logo integration (public/logo.png)
- ✅ Theme toggle button (MdSun/MdNightlsLight)
- ✅ Navigation with icon links
- ✅ Responsive design (w-64 sidebar)

**Page Updates**
- ✅ Dashboard.jsx with theme support and icons
- ✅ vehicles.jsx with dark/light mode and status indicators
- ✅ analytics.jsx with themed cards and metric icons
- ✅ settings.jsx with theme-aware forms and action buttons
- ✅ _app.jsx wrapped with ThemeProvider

### Phase 3 - Coming Soon

**Backend Features**
- 🚧 JWT authentication (bcryptjs, jsonwebtoken ready)
- 🚧 Image capture and processing (multer, sharp ready)
- 🚧 Live camera streaming (FFmpeg ready)
- 🚧 Advanced logging (winston ready)

**Frontend Features**
- 🚧 Integration of LoadingScreen in all pages
- 🚧 Real-time updates via SSE or WebSocket
- 🚧 Chart.js integration for analytics
- 🚧 Data export functionality
- 🚧 Admin login system

---

## 🤝 Team Collaboration

- Document changes in this file
- Keep architecture decisions documented
- Communicate breaking changes
- Use git feature branches
- Review code before merging

---

**Last Updated:** May 2, 2026
