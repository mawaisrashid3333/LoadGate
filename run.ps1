# LoadGate Project Startup Script
# Run all services for the Smart Vehicle Weighing & Access Control System

$ErrorActionPreference = "Stop"

function Write-ColorOutput {
    param ([string]$message, [string]$color = "White")
    Write-Host $message -ForegroundColor $color
}

function Test-NodeModules {
    param([string]$path)
    $nodeModulesPath = Join-Path $path "node_modules"
    if (!(Test-Path $nodeModulesPath)) {
        Write-ColorOutput "[WARNING] node_modules not found in $path" "Yellow"
        return $false
    }
    return $true
}

# Header
Write-ColorOutput "`n=================================" "Cyan"
Write-ColorOutput "  LoadGate - Startup Script" "Cyan"
Write-ColorOutput "  Smart Vehicle System" "Cyan"
Write-ColorOutput "=================================`n" "Cyan"

# Get script directory
$projectRoot = $PSScriptRoot
if ([string]::IsNullOrEmpty($projectRoot)) {
    $projectRoot = Get-Location
}
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"

Write-ColorOutput "[INFO] Project Root: $projectRoot`n" "Green"

# Check Node.js installation
Write-ColorOutput "[CHECK] Node.js installation..." "Cyan"
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-ColorOutput "[OK] Node.js $nodeVersion found`n" "Green"
}
else {
    Write-ColorOutput "[ERROR] Node.js not found. Please install Node.js first.`n" "Red"
    exit 1
}

# Check MongoDB
Write-ColorOutput "[CHECK] MongoDB connection..." "Cyan"
$mongoRunning = Get-Process mongod -ErrorAction SilentlyContinue
if ($mongoRunning) {
    Write-ColorOutput "[OK] MongoDB is running`n" "Green"
}
else {
    Write-ColorOutput "[WARNING] MongoDB service not detected`n" "Yellow"
}

# Backend startup
Write-ColorOutput "[START] Backend Server..." "Cyan"

if (!(Test-NodeModules $backendPath)) {
    Write-ColorOutput "[SKIP] Backend - run npm install first" "Red"
}
else {
    Write-ColorOutput "[INFO] Backend path: $backendPath" "Green"
    
    # Check if .env exists
    $envFile = Join-Path $backendPath ".env"
    if (!(Test-Path $envFile)) {
        Write-ColorOutput "[CREATE] .env file..." "Yellow"
        $envExample = Join-Path $backendPath ".env.example"
        if (Test-Path $envExample) {
            Copy-Item $envExample $envFile
            Write-ColorOutput "[OK] .env created (update with your settings)" "Yellow"
        }
    }
    
    Write-ColorOutput "[RUN] npm start..." "Green"
    Push-Location $backendPath
    Start-Job -ScriptBlock { npm start }
    Pop-Location
    Start-Sleep -Seconds 2
}

# Frontend startup
Write-ColorOutput "`n[START] Frontend Application..." "Cyan"

if (!(Test-NodeModules $frontendPath)) {
    Write-ColorOutput "[SKIP] Frontend - run npm install first" "Red"
}
else {
    Write-ColorOutput "[INFO] Frontend path: $frontendPath" "Green"
    Write-ColorOutput "[RUN] npm run dev..." "Green"
    
    Push-Location $frontendPath
    & npm run dev
    Pop-Location
}

Write-ColorOutput "`n=================================" "Green"
Write-ColorOutput "  Services Complete" "Green"
Write-ColorOutput "=================================`n" "Green"

Read-Host "Press Enter to close"
