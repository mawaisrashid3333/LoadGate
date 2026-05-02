#!/usr/bin/env node

/**
 * Verify and fix react-icons installation
 * Run: node frontend/verify-icons.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Checking react-icons installation...\n');

const pkgPath = path.join(__dirname, 'package.json');
const nodeModulesPath = path.join(__dirname, 'node_modules', 'react-icons');

// Check package.json
console.log('1️⃣  Checking package.json...');
try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const hasReactIcons = pkg.dependencies && pkg.dependencies['react-icons'];
  
  if (hasReactIcons) {
    console.log(`   ✅ react-icons found in dependencies: ${hasReactIcons}`);
  } else {
    console.log('   ❌ react-icons NOT found in dependencies!');
    console.log('   Run: npm install react-icons@4.12.0');
    process.exit(1);
  }
} catch (error) {
  console.error('   ❌ Error reading package.json:', error.message);
  process.exit(1);
}

// Check node_modules
console.log('\n2️⃣  Checking node_modules...');
if (fs.existsSync(nodeModulesPath)) {
  console.log('   ✅ react-icons found in node_modules');
  
  // Check specific icons
  console.log('\n3️⃣  Checking Material Design icons...');
  try {
    const mdPath = path.join(nodeModulesPath, 'md', 'index.d.ts');
    if (fs.existsSync(mdPath)) {
      console.log('   ✅ Material Design (md) icons available');
    } else {
      console.log('   ⚠️  Material Design icons may not be compiled');
    }
  } catch (error) {
    console.log('   ⚠️  Could not verify Material Design icons');
  }
} else {
  console.log('   ❌ react-icons NOT found in node_modules!');
  console.log('\n💾 Running: npm install...');
  try {
    execSync('npm install', { cwd: __dirname, stdio: 'inherit' });
    console.log('\n✅ Installation complete!');
  } catch (error) {
    console.error('\n❌ Installation failed:', error.message);
    process.exit(1);
  }
}

// Summary
console.log('\n✅ react-icons is properly installed!');
console.log('\nUsage example:');
console.log("  import { MdDashboard } from 'react-icons/md';");
console.log("  <MdDashboard className='h-5 w-5' />");
