/**
 * Icon Validator Utility
 * Validates react-icons imports and logs unavailable icons to console
 */

// List of commonly available Material Design icons (MdXXX)
const AVAILABLE_MD_ICONS = [
  // Navigation & UI
  'MdDashboard',
  'MdDirectionsCar',
  'MdAnalytics',
  'MdSettings',
  'MdSun',
  'MdNightlight',
  'MdMenu',
  'MdClose',
  'MdArrowBack',
  'MdArrowForward',
  'MdRefresh',
  
  // Status & Indicators
  'MdCheckCircle',
  'MdCancel',
  'MdError',
  'MdWarning',
  'MdInfo',
  'MdSignalCellularAlt',
  'MdCircle',
  
  // Actions
  'MdSave',
  'MdDelete',
  'MdEdit',
  'MdAdd',
  'MdDownload',
  'MdUpload',
  'MdFileDownload',
  'MdBuild',
  'MdTest',
  'MdPlayArrow',
  'MdPause',
  'MdStop',
  
  // Business & Analytics
  'MdTrendingUp',
  'MdShowChart',
  'MdBarChart',
  'MdPieChart',
  'MdFilterList',
  'MdSort',
  'MdSearch',
  
  // Hardware & Media
  'MdCamera',
  'MdVideocam',
  'MdMicrophone',
  'MdVolumeUp',
  'MdVolumeMute',
  
  // Communication
  'MdEmail',
  'MdPhone',
  'MdMessage',
  'MdNotifications',
  'MdSpeaker',
  
  // File & Folder
  'MdFolder',
  'MdFolderOpen',
  'MdInsertDriveFile',
  'MdDescription',
  
  // Misc
  'MdHelp',
  'MdMore',
  'MdMoreHoriz',
  'MdMoreVert',
  'MdLock',
  'MdLockOpen',
  'MdVisibility',
  'MdVisibilityOff',
];

const unavailableIcons = [];

/**
 * Validate if an icon name is available in react-icons
 * @param {string} iconName - The icon name to validate (e.g., 'MdDashboard')
 * @param {string} context - Where the icon is being used (for logging)
 * @returns {boolean} - True if icon is available, false otherwise
 */
export function validateIcon(iconName, context = 'Unknown') {
  if (!AVAILABLE_MD_ICONS.includes(iconName)) {
    const message = `❌ Icon not found: ${iconName} (used in ${context})`;
    
    if (!unavailableIcons.includes(iconName)) {
      unavailableIcons.push(iconName);
      console.warn(message);
      console.warn(`   Available alternatives: ${getSimilarIcons(iconName).join(', ') || 'None found'}`);
    }
    
    return false;
  }
  return true;
}

/**
 * Get similar icon names based on the invalid icon name
 * @param {string} iconName - Invalid icon name
 * @returns {string[]} - Array of similar icon names
 */
function getSimilarIcons(iconName) {
  const query = iconName.toLowerCase();
  return AVAILABLE_MD_ICONS.filter(icon => 
    icon.toLowerCase().includes(query.replace('md', '')) && 
    icon !== iconName
  ).slice(0, 3);
}

/**
 * Log all unavailable icons used in the current session
 */
export function logUnavailableIcons() {
  if (unavailableIcons.length === 0) {
    console.log('✅ All icons are valid!');
    return;
  }
  
  console.group('📋 Unavailable Icons Summary');
  console.log(`Total unavailable: ${unavailableIcons.length}`);
  console.table(unavailableIcons);
  console.groupEnd();
}

/**
 * Get list of all available icons
 * @returns {string[]} - Array of available icon names
 */
export function getAvailableIcons() {
  return AVAILABLE_MD_ICONS;
}

/**
 * Log all available icons to console (for reference)
 */
export function logAvailableIcons() {
  console.group('🎨 Available Material Design Icons');
  console.log(`Total available: ${AVAILABLE_MD_ICONS.length}`);
  console.table(AVAILABLE_MD_ICONS);
  console.groupEnd();
}

// Auto-log in development mode when this module is imported
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Make functions globally available in console
  window.__iconValidator = {
    validate: validateIcon,
    logUnavailable: logUnavailableIcons,
    logAvailable: logAvailableIcons,
    getAvailable: getAvailableIcons,
  };
  
  console.log('🎨 Icon Validator loaded. Use window.__iconValidator in console to check icons.');
}

export default {
  validateIcon,
  logUnavailableIcons,
  getAvailableIcons,
  logAvailableIcons,
};
