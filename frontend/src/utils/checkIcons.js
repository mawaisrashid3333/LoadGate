/**
 * Icon Checker Utility
 * Verifies react-icons installation and available icons
 */

export function checkReactIconsInstallation() {
  try {
    // Try to import a common icon
    const md = require('react-icons/md');
    console.log('✅ react-icons is installed');
    console.log('Available Material Design Icons (md) exports:', Object.keys(md).length);
    return true;
  } catch (error) {
    console.error('❌ react-icons is NOT installed:', error.message);
    return false;
  }
}

export function validateIcon(iconName, library = 'md') {
  try {
    const icons = require(`react-icons/${library}`);
    if (icons[iconName]) {
      console.log(`✅ Icon ${iconName} is available`);
      return true;
    } else {
      console.warn(`⚠️ Icon ${iconName} NOT found in react-icons/${library}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error checking icon ${iconName}:`, error.message);
    return false;
  }
}

export function listAvailableMdIcons() {
  try {
    const md = require('react-icons/md');
    const icons = Object.keys(md).filter(key => 
      typeof md[key] === 'function' && key.startsWith('Md')
    );
    console.log(`Available Material Design Icons (${icons.length}):`);
    console.log(icons.slice(0, 20).join(', '), '...');
    return icons;
  } catch (error) {
    console.error('Error listing icons:', error.message);
    return [];
  }
}

// Client-side check
export function checkIconsInBrowser() {
  if (typeof window === 'undefined') return;
  
  try {
    const script = document.createElement('script');
    script.innerHTML = `
      (function() {
        console.log('react-icons check:', {
          installed: typeof window.React !== 'undefined',
          timestamp: new Date().toISOString()
        });
      })();
    `;
    document.head.appendChild(script);
  } catch (error) {
    console.error('Browser icon check failed:', error);
  }
}
