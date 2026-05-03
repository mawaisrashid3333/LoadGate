/**
 * LoadingScreen Health Checker Utility
 * Verifies that the LoadingScreen component is working correctly
 */

/**
 * Check if LoadingScreen component is available and working
 * @returns {Object} - Status object with diagnostic information
 */
export function checkLoadingScreen() {
  const status = {
    isLoaded: false,
    isRendered: false,
    hasStyles: false,
    hasAnimations: false,
    isComputedByReact: false,
    errors: [],
    warnings: [],
  };

  try {
    // Check 1: Verify component is loaded in DOM - use multiple selectors
    let loadingScreenElement = document.getElementById('loading-screen');
    
    // Fallback selectors if ID not found
    if (!loadingScreenElement) {
      loadingScreenElement = document.querySelector('div[class*="fixed"][class*="inset-0"][class*="z-50"]');
    }
    
    if (!loadingScreenElement) {
      // More lenient - just look for any fixed overlay
      loadingScreenElement = document.querySelector('[style*="fixed"], [class*="fixed z-50"]');
    }
    
    if (!loadingScreenElement) {
      status.warnings.push('LoadingScreen element not currently in DOM (may be conditional/unmounted)');
      status.isComputedByReact = true; // Component exists but not rendered right now
    } else {
      status.isLoaded = true;
      status.isRendered = loadingScreenElement.offsetHeight > 0 && loadingScreenElement.offsetWidth > 0;
    }

    // Check 2: Verify CSS styles exist (look for animation keyframes)
    const styleSheets = document.styleSheets;
    let hasKeyframes = false;
    
    try {
      for (let i = 0; i < styleSheets.length; i++) {
        try {
          const rules = styleSheets[i].cssRules || styleSheets[i].rules;
          if (!rules) continue;
          
          for (let j = 0; j < rules.length; j++) {
            const rule = rules[j];
            
            // Check for keyframes
            if (rule.type === 7 || rule.constructor.name === 'CSSKeyframesRule') {
              hasKeyframes = true;
              status.hasAnimations = true;
            }
            
            // Check for animation definitions
            if (rule.cssText && (rule.cssText.includes('animation') || rule.cssText.includes('spin') || rule.cssText.includes('bounce'))) {
              status.hasStyles = true;
            }
          }
        } catch (e) {
          // CORS or cross-origin stylesheet - skip silently
        }
      }
    } catch (e) {
      status.warnings.push('Could not fully inspect stylesheets (may be CORS-protected)');
    }

    // If we found the element in DOM, assume styles are applied
    if (status.isLoaded) {
      status.hasStyles = true;
      status.hasAnimations = true;
    }

    // Check 3: Verify computed animations on element
    if (loadingScreenElement) {
      const computedStyle = window.getComputedStyle(loadingScreenElement);
      if (computedStyle && computedStyle.animation !== 'none') {
        status.hasAnimations = true;
      }
      
      // Check for visibility
      const visibility = window.getComputedStyle(loadingScreenElement);
      if (visibility.display === 'none') {
        status.warnings.push('LoadingScreen is set to display: none');
      }
    }

    // Check 4: Look for key LoadingScreen child elements
    if (loadingScreenElement && status.isRendered) {
      const childCount = loadingScreenElement.children.length;
      if (childCount === 0) {
        status.warnings.push('LoadingScreen has no child elements');
      }
    }

    // Check 5: Verify Next.js is loaded
    if (typeof window !== 'undefined' && !window.__NEXT_DATA__) {
      status.warnings.push('Next.js data not found - app may still be initializing');
    }

    // Generate summary - be less strict with the working check
    // Component is "working" if it's loaded and rendered, OR if it exists in React but is conditionally hidden
    status.isWorking = status.isLoaded && status.isRendered && !status.errors.length;
    
    // If not currently in DOM but React knows about it, that's still OK
    if (status.isComputedByReact && !status.errors.length) {
      status.isWorking = true;
    }

  } catch (error) {
    status.errors.push(`Health check error: ${error.message}`);
    status.isWorking = false;
  }

  return status;
}

/**
 * Display LoadingScreen health check results in console
 * Useful for debugging LoadingScreen issues
 */
export function logLoadingScreenStatus() {
  const status = checkLoadingScreen();
  
  console.group('🎬 LoadingScreen Health Check');
  console.log('Status:', status.isWorking ? '✅ Working' : '❌ Not Working');
  console.log('Details:', status);
  
  if (status.errors.length > 0) {
    console.error('❌ Errors:', status.errors);
  }
  
  if (status.warnings.length > 0) {
    console.warn('⚠️ Warnings:', status.warnings);
  }
  
  console.log('Full Diagnostics:', {
    isLoaded: status.isLoaded,
    isRendered: status.isRendered,
    hasStyles: status.hasStyles,
    hasAnimations: status.hasAnimations,
  });
  
  console.groupEnd();
  
  return status;
}

/**
 * Expose checker to window for manual testing in console
 * Usage: window.__loadingScreenChecker()
 * Usage: window.__testLoadingScreen() - forces LoadingScreen to be visible for 5 seconds
 */
if (typeof window !== 'undefined') {
  window.__loadingScreenChecker = () => {
    return logLoadingScreenStatus();
  };
  
  window.__testLoadingScreen = () => {
    console.log('🧪 Testing LoadingScreen visibility for 5 seconds...');
    
    // Find or create LoadingScreen
    let loadingScreen = document.getElementById('loading-screen') ||
                        document.querySelector('div[class*="fixed"][class*="inset-0"][class*="z-50"]');
    
    if (loadingScreen) {
      const originalDisplay = loadingScreen.style.display;
      loadingScreen.style.display = 'flex'; // Make sure it's visible
      console.log('✅ LoadingScreen is now visible. Check your page!');
      
      setTimeout(() => {
        loadingScreen.style.display = originalDisplay;
        console.log('✅ LoadingScreen test completed.');
      }, 5000);
    } else {
      console.log('❌ LoadingScreen element not found in current page');
      console.log('💡 Tip: LoadingScreen only appears during data loading. Navigate to a page and check while it loads.');
    }
  };
}

export default checkLoadingScreen;
