#!/usr/bin/env node

/**
 * LoadGate Project Setup Script
 * Installs all system dependencies and sets up the development environment
 */

const { exec } = require('child_process');
const { platform } = require('os');
const path = require('path');
const fs = require('fs');

const isWindows = platform() === 'win32';
const projectRoot = __dirname;

// Color output utilities
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  ${title.padEnd(38)}║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);
}

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

async function checkNodeJs() {
  log(' Checking Node.js installation...', 'cyan');
  try {
    const version = await executeCommand('node --version');
    log(`✓ Node.js ${version.trim()} is installed\n`, 'green');
    return true;
  } catch {
    log('✗ Node.js is not installed. Please install Node.js 16+ first.', 'red');
    log('   Download from: https://nodejs.org/', 'yellow');
    return false;
  }
}

async function checkMongoDB() {
  log(' Checking MongoDB installation...', 'cyan');
  try {
    if (isWindows) {
      await executeCommand('mongod --version');
    } else {
      await executeCommand('which mongod');
    }
    log('✓ MongoDB is installed\n', 'green');
    return true;
  } catch {
    log('  MongoDB is not installed or not in PATH', 'yellow');
    if (isWindows) {
      log('   Download from: https://www.mongodb.com/try/download/community', 'yellow');
    } else {
      log('   Install with: brew install mongodb-community', 'yellow');
    }
    log('   You can still proceed with setup - MongoDB is needed later\n', 'yellow');
    return false;
  }
}

async function checkFFmpeg() {
  log(' Checking FFmpeg installation...', 'cyan');
  try {
    await executeCommand('ffmpeg -version');
    log('✓ FFmpeg is installed\n', 'green');
    return true;
  } catch {
    log('⚠ FFmpeg is not installed', 'yellow');
    log('   FFmpeg is needed for camera streaming functionality', 'yellow');
    log('   Download from: https://ffmpeg.org/download.html', 'yellow');
    log('   Or install via: choco install ffmpeg (Windows)\n', 'yellow');
    return false;
  }
}

function createEnvFile() {
  log(' Setting up environment files...', 'cyan');

  const backendEnvExample = path.join(projectRoot, 'backend', '.env.example');
  const backendEnv = path.join(projectRoot, 'backend', '.env');

  if (!fs.existsSync(backendEnv) && fs.existsSync(backendEnvExample)) {
    fs.copyFileSync(backendEnvExample, backendEnv);
    log('✓ Created backend/.env from .env.example', 'green');
    log('  Please update the values in backend/.env\n', 'yellow');
  } else if (!fs.existsSync(backendEnv)) {
    log('✓ Backend .env file ready\n', 'green');
  }
}

function setupGitIgnore() {
  log(' Setting up .gitignore...', 'cyan');

  const gitignorePath = path.join(projectRoot, '.gitignore');
  const gitignoreContent = `# Dependencies
node_modules/
*.lock
yarn.lock

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Build outputs
build/
dist/
.next/
out/

# Logs
logs/
*.log
npm-debug.log*

# Uploads & Storage
uploads/
storage/
public/uploads/

# Database
*.db
*.sqlite

# Cache
.cache/
.eslintcache
`;

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, gitignoreContent);
    log('✓ Created root .gitignore\n', 'green');
  } else {
    log('✓ .gitignore already exists\n', 'green');
  }
}

async function installDependencies() {
  log('\n Installing Dependencies...\n', 'cyan');

  const dirs = [
    { name: 'Backend', path: path.join(projectRoot, 'backend') },
    { name: 'Frontend', path: path.join(projectRoot, 'frontend') },
  ];

  for (const dir of dirs) {
    try {
      log(`\n Installing ${dir.name} dependencies...`, 'yellow');
      await executeCommand(`cd "${dir.path}" && npm install`);
      log(`✓ ${dir.name} dependencies installed successfully\n`, 'green');
    } catch (error) {
      log(`  Failed to install ${dir.name} dependencies`, 'yellow');
      log(`   Error: ${error.message}\n`, 'yellow');
    }
  }
}

function printNextSteps() {
  header(' Next Steps');
  
  log('1. Configure environment files:', 'cyan');
  log('   - Edit backend/.env with your MongoDB URI and settings\n', 'yellow');

  log('2. Start services:', 'cyan');
  log('   Windows:  .\\run.ps1', 'bright');
  log('   Linux/Mac: ./run.ps1\n', 'bright');

  log('3. Access the application:', 'cyan');
  log('   Frontend: http://localhost:3000', 'bright');
  log('   Backend:  http://localhost:5000\n', 'bright');

  header(' Setup Complete!');
}

async function main() {
  header(' LoadGate Setup Script');
  
  try {
    // Check prerequisites
    const hasNode = await checkNodeJs();
    if (!hasNode) {
      process.exit(1);
    }

    await checkMongoDB();
    await checkFFmpeg();

    // Setup configuration files
    createEnvFile();
    setupGitIgnore();

    // Install dependencies
    await installDependencies();

    // Print instructions
    printNextSteps();

  } catch (error) {
    log(`\n✗ Setup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();
