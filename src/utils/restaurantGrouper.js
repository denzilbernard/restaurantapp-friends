/**
 * Normalizes restaurant names for grouping duplicates.
 * 
 * Normalization rules:
 * - Trim whitespace
 * - Convert to lowercase
 * - Remove extra spaces
 * 
 * @param {string} name - The restaurant name to normalize
 * @returns {string} - The normalized restaurant name
 */
export function normalizeRestaurantName(name) {
  if (!name || typeof name !== 'string') {
    return ''
  }
  
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Groups restaurants by normalized name.
 * Each group contains all recommendations for the same restaurant.
 * 
 * @param {Array} restaurants - Array of restaurant objects
 * @returns {Array} - Array of grouped restaurant objects with structure:
 *   {
 *     id: string (normalized name),
 *     name: string (display name - first occurrence),
 *     recommendations: Array<restaurant> (all recommendations for this restaurant)
 *   }
 */
export function groupRestaurantsByName(restaurants) {
  const groups = new Map()
  
  restaurants.forEach((restaurant) => {
    const normalizedName = normalizeRestaurantName(restaurant.name)
    
    if (!normalizedName) {
      // Skip restaurants without names
      return
    }
    
    if (!groups.has(normalizedName)) {
      // First occurrence - create group
      groups.set(normalizedName, {
        id: normalizedName,
        name: restaurant.name, // Use original name for display
        recommendations: []
      })
    }
    
    // Add this recommendation to the group
    groups.get(normalizedName).recommendations.push(restaurant)
  })
  
  return Array.from(groups.values())
}
