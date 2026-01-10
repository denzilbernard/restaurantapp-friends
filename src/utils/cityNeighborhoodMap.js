/**
 * City to Neighborhoods mapping based on the CSV data.
 * This is a reference/documentation file showing the relationship between cities and their neighborhoods.
 * 
 * The actual filtering is done dynamically from the loaded restaurant data,
 * but this file documents the expected neighborhoods per city for reference.
 * 
 * Based on the sample-restaurants.csv:
 * 
 * San Francisco:
 *   - Russian Hill
 *   - Richmond
 *   - Inner Sunset
 *   - Near Dolores Park
 *   - Mission
 *   - Lower Haight
 *   - Marina
 *   - Castro
 *   - The Mission
 * 
 * Oakland:
 *   - Temescal
 *   - Dimond
 * 
 * Reno:
 *   - Midtown
 * 
 * New York City (NYC, New York):
 *   - Manhattan, Chinatown/SoHo
 *   - Williamsburg
 *   - Midtown
 */

/**
 * Extracts a map of cities to their neighborhoods from restaurant data.
 * 
 * @param {Array} restaurants - Array of restaurant objects
 * @returns {Object} - Map of normalized city names to arrays of neighborhoods
 */
export function buildCityNeighborhoodMap(restaurants, normalizeCity) {
  const cityMap = {}
  
  restaurants.forEach(restaurant => {
    const city = normalizeCity(restaurant.city)
    if (!city) return
    
    if (!cityMap[city]) {
      cityMap[city] = new Set()
    }
    
    if (restaurant.neighborhood) {
      // Split by comma or slash and add each neighborhood
      restaurant.neighborhood.split(/[,/]/).forEach(n => {
        const trimmed = n.trim()
        if (trimmed) {
          cityMap[city].add(trimmed)
        }
      })
    }
  })
  
  // Convert Sets to sorted arrays
  const result = {}
  Object.keys(cityMap).sort().forEach(city => {
    result[city] = Array.from(cityMap[city]).sort()
  })
  
  return result
}

/**
 * Extracts a map of cities to their cuisine types from restaurant data.
 * 
 * @param {Array} restaurants - Array of restaurant objects
 * @returns {Object} - Map of normalized city names to arrays of cuisine types
 */
export function buildCityCuisineMap(restaurants, normalizeCity) {
  const cityMap = {}
  
  restaurants.forEach(restaurant => {
    const city = normalizeCity(restaurant.city)
    if (!city) return
    
    if (!cityMap[city]) {
      cityMap[city] = new Set()
    }
    
    if (restaurant.cuisineType) {
      // Split by comma or slash and add each cuisine type
      restaurant.cuisineType.split(/[,/]/).forEach(c => {
        const trimmed = c.trim()
        if (trimmed) {
          cityMap[city].add(trimmed)
        }
      })
    }
  })
  
  // Convert Sets to sorted arrays
  const result = {}
  Object.keys(cityMap).sort().forEach(city => {
    result[city] = Array.from(cityMap[city]).sort()
  })
  
  return result
}
