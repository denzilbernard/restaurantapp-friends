/**
 * Hard reset utility - clears all application data
 * Can be called from browser console: window.resetApp()
 */

export function resetApp() {
  // Clear all localStorage items
  localStorage.removeItem('restaurantData')
  localStorage.removeItem('restaurantDataUpdatedAt')
  localStorage.removeItem('restaurantDataVersion')
  localStorage.removeItem('supportMessages')
  
  // Clear all sessionStorage items
  sessionStorage.removeItem('adminAuthenticated')
  
  // Reload the page to ensure clean state
  window.location.reload()
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  window.resetApp = resetApp
}
