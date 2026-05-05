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

- **Arduino (Uno/Mega)** → Central controller with HX711 amplifier
- **Load Cells (4 × 100kg)** → Measure vehicle weight (wired in pairs: L1+L3, L2+L4)
- **HX711 Amplifier** → Serial communication to Arduino for load cell data
- **IR Sensor** → Vehicle presence detection with interrupt handling
- **Servo Motor** → Barrier control (0° closed, 180° open)
- **Buck Controller** → Power management for barrier
- **Sonar Sensor** → Distance measurement (optional)
- **IP Camera** → Vehicle image capture + live stream
- **Serial Connection** → USB/COM port communication between Arduino and backend

---

## 🔄 System Workflow

1. **IR Detection**: Vehicle approaches → IR sensor detects presence (interrupt signal)
2. **Weight Measurement**: Arduino reads 4 load cells via HX711 amplifier
3. **Decision Logic**: Arduino calculates total weight and compares against limit
4. **Barrier Control**: Arduino controls servo motor (open/allow or closed/block)
5. **Data Transmission**: Arduino sends real-time data to backend via serial port
   - Vehicle detection: `VEHICLE|weight|status|timestamp`
   - Component status: `STATUS|weight|servo:ok|ir:ok|hx711:ok|buck:ok|sonar:ok|timestamp`
6. **Backend Processing**: 
   - Receives and parses Arduino data
   - Stores in MongoDB with image reference
   - Broadcasts to frontend via REST API
7. **Frontend Display**:
   - Settings page shows live load cell readings (all 4 cells)
   - Component health status (servo, IR, HX711, buck, sonar, webcam)
   - Real-time weight and decision status
8. **Image Capture**: IP camera captures vehicle image
9. **Database Storage**: Records stored with timestamp, weight, status, image path

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
- **Serial Communication** - Arduino ↔ Backend via USB/COM port
- **EventEmitter Service** - IR event listening (NOT Socket.IO)
- **REST API** - Primary frontend-backend communication
- **Server-Sent Events (SSE)** - Live data streaming for Arduino updates
- **WebSocket (optional)** - For live dashboard updates

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
│   ├── seeds/               # Database seeding scripts
│   │   └── seedVehicles.js  # Generate 50 dummy vehicle records
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
- Loading screen during data fetches

### 8. Theme System
- **Dark/Light mode toggle** in sidebar
- **System preference detection** via matchMedia API
- **localStorage persistence** for user preference
- **Class-based theme switching** (adds 'dark' class to html element)
- **Comprehensive dark mode CSS** in globals.css

### 9. UI/UX Enhancements
- **Interactive animated loading screen** with multiple simultaneous animations
- **React Icons integration** replacing all emojis
- **Logo integration** in Layout component from public/logo.png
- **Responsive design** with conditional Tailwind classes
- **Smooth transitions** and hover effects on both themes
- **Brand color #EC6B1B** applied throughout UI

### 10. Admin Panel
- Secure login system
- System configuration management
- Log viewing and filtering
- Manual overrides

### 11. Data Export
- Export records as CSV/Excel
- Date range selection
- Useful for reporting and analysis

---

## 🎨 Theme & UI System

### Brand Color

**Primary Brand Color: #EC6B1B** (Orange)
- Applied to all primary action buttons (.btn-primary)
- Used as accent color for loading screen spinner and progress bar
- Logo text highlight color in light/dark modes
- Interactive element focus and hover states
- Status highlights and accent indicators throughout UI

### Dark/Light Mode Implementation

**ThemeContext.jsx** - Central theme management
- React Context API for global state management
- localStorage persistence (key: 'theme') - remembers user preference
- System preference detection (matchMedia for prefers-color-scheme)
- `useTheme()` hook for component access
- Returns: `{ isDark: boolean, toggleTheme: function }`
- Auto-applies 'dark' class to html element for Tailwind switching
- Mounted state check to prevent SSR hydration mismatches
- Fallback to system preference if no localStorage value exists

**tailwind.config.js** - Theme configuration
- `darkMode: 'class'` for class-based switching (adds 'dark' class)
- Custom color palette with primary (#EC6B1B), secondary, accent variants
- Both light and dark color schemes defined

**globals.css** - Comprehensive styling
- **Light Mode Base:**
  - Background: white (#FFFFFF)
  - Text: slate-900
  - Borders: gray-200
  - Scrollbars: gray-300
- **Dark Mode (activated via `html.dark` selector):**
  - Background: slate-900
  - Text: gray-100
  - Cards/Containers: slate-800
  - Borders: slate-700
  - Scrollbars: slate-600
- Component classes with `dark:` variants:
  - `.btn-primary` - Brand color (#EC6B1B) with gradient hover effects
  - `.btn-secondary` - Gray base with dark mode variants
  - `.card` - White/slate-800 with matching shadows
  - `.input` - Full width with themed borders and focus states
  - `.table-header` - Theme-aware backgrounds
- **Scrollbar styling** for both themes with proper contrast

**Layout.jsx** - Main layout wrapper
- Sidebar with navigation menu and logo (from public/logo.png)
- Theme toggle button with icons (MdSun for light / MdNightLight for dark)
- Responsive flexbox design (w-64 fixed sidebar, flex-1 main content)
- Theme-aware conditional styling throughout
- Dynamic import with ssr: false to prevent hydration issues
- Proper margin/padding for responsive layouts

### Loading Screen & Animations

**LoadingScreen.jsx** - Interactive animated component
- Fullscreen overlay (fixed inset-0, z-50)
- Logo display (from public/logo.png) with pulsing glow effect
- **Multiple simultaneous CSS animations:**
  - **Outer Ring:** `spin` animation 3s rotateZ (clockwise)
  - **Middle Ring:** `spin-reverse` animation 2s rotateZ (counter-clockwise)
  - **Center Dot:** `pulse` animation 2s opacity variation
  - **Bouncing Dots:** `bounce-dots` animation 1.4s with staggered delays (0s, 0.2s, 0.4s)
  - **Progress Bar:** Linear 300ms width animation from 0% to progress%
  - **Floating Orbs:** `float` animation 8-12s with varied timing
  - **Floating Particles:** `float-particle` animation 4s upward drift
  - **Logo Glow:** Pulsing box-shadow effect with brand color
- Custom message prop for dynamic loading text display
- Real-time progress percentage display (0-95%) with styled counter
- Theme-aware background gradients:
  - Light mode: white to gray-100
  - Dark mode: slate-900 to slate-800
- Brand color (#EC6B1B) for spinner rings and progress indicators
- Used during all async operations (API calls, data fetches)
- Minimum 1.5 second display for consistent UX
- Smooth transitions between loading states

### Icon System

**Icon.jsx** - Safe icon wrapper component
- Dynamic imports with `ssr: false` to prevent SSR hydration mismatches
- React.Suspense boundary with fallback text
- Graceful error handling (returns '?' if icon not found)
- Console warnings for missing/unavailable icons with suggestions
- Usage: `<Icon name="MdDashboard" className="h-5 w-5" />`
- Supports all Material Design icon names (MdXXX)

**react-icons 4.12.0** - Icon library
- All emojis replaced with react-icons Material Design (MdXXX) components
- Navigation icons: MdDashboard, MdDirectionsCar, MdAnalytics, MdSettings
- Status icons: MdCheckCircle (allowed, green), MdCancel (blocked, red)
- Action icons: MdSave, MdRefresh, MdBuild, MdTest, MdFileDownload, MdTrendingUp, MdSun, MdNightLight
- Signal strength: MdSignalCellularAlt
- Standard sizing: h-5 w-5 for consistency across UI
- Conditional coloring based on status/theme:
  - Green for allowed/success states
  - Red for blocked/error states
  - Gray for neutral/loading states
  - Orange (#EC6B1B) for highlights/primary actions

### Page Updates - All Theme Integrated

**Dashboard.jsx**
- `useTheme()` hook for isDark access
- Conditional dark/light CSS classes for proper contrast
- Status cards with icon indicators (MdSignalCellularAlt, MdCheckCircle, MdCancel)
- Real-time data display with LoadingScreen overlay
- react-icons for all visual elements (no emojis)
- Badge styling (green for allowed, red for blocked)
- LoadingScreen minimum 1.5 second display for UX consistency
- Responsive grid layout with Tailwind

**vehicles.jsx**
- Theme support with isDark state from useTheme()
- Icon-based status indicators (MdCheckCircle, MdCancel)
- Export CSV button with MdFileDownload icon and brand color
- Status filter dropdown (All, Allowed, Blocked)
- Loading state with LoadingScreen overlay
- Dark/light table styling with proper text contrast
- Striped rows with hover effects for better UX
- Responsive layout with Tailwind utilities
- Date and weight data display with formatting

**analytics.jsx**
- Theme-aware card styling with proper shadows and borders
- Statistics cards with themed backgrounds and text colors
- Icon indicators for metrics (MdDirectionsCar, MdTrendingUp, MdCheckCircle, MdCancel)
- Status badges with colors (green for allowed, red for blocked)
- LoadingScreen during data fetch with progress indication
- Gradient backgrounds for stat cards
- Responsive grid layout with Tailwind
- Summary statistics display

**settings.jsx**
- Theme-aware form elements with proper borders and focus states
- Action buttons with icons (MdSave, MdRefresh, MdBuild, MdTest)
- Conditional background and text colors for light/dark modes
- Dark/light mode input styling with focus indicators
- Settings sections with visual separation and headings
- Brand color (#EC6B1B) on primary Save button
- Standard gray styling for secondary buttons
- Proper padding and spacing for form readability

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

**Arduino - Load Cell Data**
- `GET /api/arduino/load-cells` - Current load cell readings (all 4 cells + total weight)
- `GET /api/arduino/components` - Component health status (servo, IR, HX711, buck, sonar, webcam)
- `GET /api/arduino/status` - Arduino connection status (hardware/simulation mode)
- `GET /api/arduino/latest` - Latest vehicle detection data
- `GET /api/arduino/stream` - Real-time data streaming (Server-Sent Events)

**Arduino - Commands**
- `POST /api/arduino/command` - Send raw command to Arduino (TARE, OPEN, CLOSE, INFO)
- `POST /api/arduino/tare` - Calibrate scale to zero
- `POST /api/arduino/barrier/open` - Open barrier via servo
- `POST /api/arduino/barrier/close` - Close barrier via servo

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
# Run setup to check and install system dependencies
node setup.js

# Start all services (PowerShell - Windows)
.\run.ps1
```

**setup.js** - System dependency checker
- `checkNodeJs()` - Verifies Node.js 16+ (required)
- `checkMongoDB()` - Detects MongoDB, warns if missing
- `checkFFmpeg()` - ⚠️ WARNS if not found (no auto-install) - user must install manually if needed
- `createEnvFile()` - Creates .env from .env.example
- `setupGitIgnore()` - Creates root .gitignore
- `installDependencies()` - Runs npm install for backend and frontend

### Database Seeding (Optional - For Demo/Testing)
```bash
# Seed database with 50 dummy vehicle records
cd backend
npm run seed
```

This command will:
- Generate 50 realistic vehicle records
- Include varied vehicle types (LTV, HTV, BIKE, OTHER)
- Mix of ALLOWED (80%) and BLOCKED (20%) statuses
- Random timestamps within last 30 days
- Display summary statistics after seeding

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
- ✅ HX711 load cell integration (4 × 100kg, wired in pairs: L1+L3, L2+L4)
- ✅ IR sensor interrupt handling with debouncing
- ✅ Servo motor barrier control (PWM control, 0-180°)
- ✅ Serial communication protocol (9600 baud)
- ✅ Periodic component status reporting (every 2 seconds)
- ✅ Component health checking (servo, IR, HX711, buck, sonar)
- ✅ Debug command interface (TARE, WEIGHT, OPEN, CLOSE, INFO)

**Project Setup**
- ✅ run.ps1 PowerShell startup script (single terminal execution)
- ✅ setup.js system dependency checker with auto-install
- ✅ Package.json with npm scripts
- ✅ context.md project documentation

### Phase 2 - UI/UX Enhancements (✅ COMPLETED)

**Theme System**
- ✅ ThemeContext.jsx with localStorage persistence and system preference detection
- ✅ Tailwind `darkMode: 'class'` configuration for class-based switching
- ✅ globals.css with comprehensive dark/light styling and component variants
- ✅ Proper SSR handling with mounted state checks
- ✅ Light mode: white backgrounds, slate-900 text, gray-200 borders
- ✅ Dark mode: slate-900 backgrounds, gray-100 text, slate-800 cards

**Brand Color System**
- ✅ Primary brand color #EC6B1B (orange) integrated throughout UI
- ✅ Applied to primary buttons, loading screen, logo, and accents
- ✅ Gradient hover effects on primary buttons
- ✅ Consistent color scheme across all pages

**Loading Screen**
- ✅ LoadingScreen.jsx component with multiple simultaneous animations
- ✅ Animated outer/middle rings with opposite rotations
- ✅ Center pulsing dot animation
- ✅ Bouncing dots animation (3 dots with staggered 0.2s delays)
- ✅ Progress bar animation with real-time percentage (0-95%)
- ✅ Floating orbs and particle effects
- ✅ Logo glow effect with pulsing box-shadow
- ✅ Logo display integration (public/logo.png)
- ✅ Theme-aware gradients (light/dark backgrounds)
- ✅ Custom message prop for dynamic loading text
- ✅ Minimum 1.5 second display for UX consistency

**Icon System**
- ✅ Icon.jsx wrapper component with dynamic imports and ssr: false
- ✅ React.Suspense boundary with fallback
- ✅ Error handling and console warnings
- ✅ react-icons 4.12.0 package added
- ✅ All emojis replaced with Material Design icons
- ✅ Icon verification and debugging utilities
- ✅ Safe icon rendering across all components

**Layout & Navigation**
- ✅ Layout.jsx with sidebar (w-64 fixed width)
- ✅ Logo integration and branding (public/logo.png)
- ✅ Theme toggle button (MdSun/MdNightLight)
- ✅ Navigation with icon links (MdDashboard, MdDirectionsCar, MdAnalytics, MdSettings)
- ✅ Responsive design with flex layout
- ✅ Dynamic import to prevent hydration issues

**Page Updates - All with Icon Integration**
- ✅ Dashboard.jsx - Theme support, status cards, metric icons, live data
- ✅ vehicles.jsx - Dark/light styling, status indicators, export button, filter dropdown
- ✅ analytics.jsx - Themed cards, metric icons, status badges, gradient backgrounds
- ✅ settings.jsx - Theme-aware forms, action buttons, proper spacing
- ✅ _app.jsx - Wrapped with ThemeProvider, 'use client' directive

**Setup & Configuration**
- ✅ setup.js updated to check FFmpeg with warning only (no auto-install)
- ✅ NodeJs and MongoDB checks with appropriate warnings
- ✅ Environment file creation
- ✅ Colored console output for better UX

### Phase 3 - Data Management & Pagination (⚠️ IN PROGRESS)

**Frontend - Vehicle Records Page**
- ✅ Format selector dropdown (CSV, Excel, Word, PDF)
- ✅ Export button (disabled by default, enabled when format selected)
- ✅ Pagination controls (First/Previous/Next/Last buttons)
- ✅ Page information display (Page X of Y)
- ✅ Results counter (showing current records / total)
- ✅ Backend-driven filtering, sorting, and searching
- ✅ handleExport() function calling backend API
- ✅ Blob download handling with correct MIME types
- ✅ File naming with date: `vehicles-YYYY-MM-DD.{format}`
- ✅ Show/Hide Filters button in search area
- ✅ Reset Filters button with pagination reset
- 🚧 Backend pagination endpoint (GET /vehicles)
- 🚧 Backend export endpoint (GET /vehicles/export)

**Frontend - Analytics Page (⚠️ COMPLETED)**
- ✅ 6 different chart types:
  - **Line Chart** - Weight trend with smooth animations
  - **Bar Chart** - Daily vehicle count with multi-color bars
  - **Pie Chart** - Allowed vs Blocked distribution
  - **Doughnut Chart** - Status breakdown with cutout center
  - **Radar Chart** - Performance metrics (throughput, accuracy, reliability, efficiency, availability)
  - **Hourly Bar Chart** - Vehicles per hour distribution
- ✅ Interactive chart features:
  - Hover tooltips with background and border styling
  - Point highlights and radius changes on hover
  - Smooth animations and transitions
  - Point styling with borders and shadows
- ✅ Dark/Light theme support:
  - Dynamic text colors based on theme
  - Border colors adapt to theme
  - Background transparency for readability
  - Grid lines themed appropriately
- ✅ Key metrics cards (4 cards at top):
  - Total Vehicles with icon and timerange info
  - Average Weight per vehicle
  - Allowed Vehicles with percentage
  - Blocked Vehicles with percentage
- ✅ Time range selector (7, 14, 30 days)
- ✅ Dynamic data generation for demo/mock data
- ✅ Responsive grid layout (1-2 columns on mobile, 2 columns on large screens)

### Phase 3C - Database Seeding & Demo Data (✅ COMPLETED)

**Seed Script**
- ✅ Created `backend/seeds/seedVehicles.js` script
- ✅ Generates 50 dummy vehicle records with:
  - Random number plates (ABC-1234 format)
  - Realistic weights by vehicle type:
    - LTV: 1500-3500 kg
    - HTV: 5000-25000 kg
    - BIKE: 100-300 kg
    - OTHER: 500-5000 kg
  - Status: 80% ALLOWED, 20% BLOCKED
  - Random timestamps in last 30 days
  - Vehicle types: LTV, HTV, BIKE, OTHER
  - Dummy image paths
- ✅ Clears existing data before seeding
- ✅ Provides summary statistics
- ✅ Shows sample records
- ✅ Added npm script: `npm run seed`

### Phase 4 - Arduino Integration (✅ COMPLETED)

**Backend - Arduino Service**
- ✅ Serial communication with Arduino (hardware + simulation modes)
- ✅ Load cell data parsing and storage
- ✅ Component status tracking (servo, IR, HX711, buck, sonar, webcam)
- ✅ Vehicle detection event handling
- ✅ Periodic status report parsing (every 2 seconds)
- ✅ Connection state management with auto-retry logic
- ✅ EventEmitter for real-time data updates
- ✅ 8 REST API endpoints for Arduino data and commands
- ✅ Server-Sent Events streaming for live updates

**Backend - Arduino Controller**
- ✅ GET /api/arduino/load-cells - Live readings (4 cells + total)
- ✅ GET /api/arduino/components - Component health status
- ✅ GET /api/arduino/status - Connection status (hardware/simulation)
- ✅ GET /api/arduino/latest - Latest vehicle data
- ✅ GET /api/arduino/stream - Real-time SSE stream
- ✅ POST /api/arduino/command - Send raw commands
- ✅ POST /api/arduino/tare - Scale calibration
- ✅ POST /api/arduino/barrier/* - Barrier control

**Arduino Firmware Updates**
- ✅ Updated MAX_WEIGHT_LIMIT to 5000 kg (4 × 100kg cells)
- ✅ Added component status struct for health monitoring
- ✅ Implemented periodic STATUS messages (2-second intervals)
- ✅ Added checkComponentStatus() function
- ✅ Implemented sendPeriodicStatus() for component health
- ✅ Added serialEvent() for command handling
- ✅ Component status parsing: servo, IR, HX711, buck, sonar

**Frontend - Settings Page**
- ✅ Live Load Cell Data section with real-time weight display
- ✅ Individual load cell readings (L1, L2, L3, L4) with connection status
- ✅ Hardware Components Status grid (7 components)
- ✅ Arduino connection mode display (hardware/simulation)
- ✅ Material Design icons for all components (no emojis)
- ✅ Color-coded status indicators (connected/warning/disconnected)
- ✅ Auto-refresh every 5 seconds for live updates
- ✅ Component icons: MdLinearScale, MdSettingsInputComponent, MdOutlinedFlag, MdSensors, MdElectricBolt, MdReplay, MdVideocam
- ✅ Disconnection logic: All components show disconnected if Arduino offline
- ✅ Timestamps for each data point

### Phase 5 - Coming Soon

**Backend Features (Remaining)**
- 🚧 JWT authentication (bcryptjs, jsonwebtoken ready)
- 🚧 Image capture and processing (multer, sharp ready)
- 🚧 Live camera streaming (FFmpeg ready)
- 🚧 Advanced logging (winston ready)
- 🚧 Analytics aggregation pipelines

**Frontend Features (Remaining)**
- 🚧 Real-time updates via WebSocket (SSE currently in place)
- 🚧 Advanced settings configuration
- 🚧 Vehicle type detection with AI
- 🚧 SMS/Email notifications

---

## 🤝 Team Collaboration

- Document changes in this file
- Keep architecture decisions documented
- Communicate breaking changes
- Use git feature branches
- Review code before merging

---

**Last Updated:** May 2025 - Arduino Integration Complete (Live Load Cell Data, Component Health Monitoring, Settings Page Display)

---

## 📝 Key Files - Arduino Integration

### Backend Files (New/Updated)
- `backend/src/services/arduinoService.js` - **NEW** - Arduino serial communication + simulation mode
- `backend/src/controllers/arduinoController.js` - **NEW** - 8 REST API endpoints
- `backend/src/routes/arduinoRoutes.js` - **UPDATED** - Arduino API route definitions
- `backend/src/index.js` - **UPDATED** - Arduino service initialization

### Frontend Files (Updated)
- `frontend/src/pages/settings.jsx` - **UPDATED** - Live load cell data display, component status grid, Arduino connection status
- Previous files: ThemeContext, Layout, LoadingScreen, Icon, Dashboard, vehicles, analytics, etc.

### Arduino Firmware (Updated)
- `arduino/loadgate.ino` - **UPDATED** - Component status tracking, periodic STATUS messages, command handling

### Documentation
- `context.md` - This file (updated with Arduino integration and Phase 4 completion)
