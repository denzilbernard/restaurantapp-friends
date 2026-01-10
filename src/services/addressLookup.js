/**
 * Address Lookup Service
 * 
 * Fetches restaurant addresses from the backend API which uses
 * Google Places API with server-side caching to minimize API calls.
 */

/**
 * Address result object
 * @typedef {Object} AddressResult
 * @property {string} status - 'found' | 'not_found' | 'error' | 'no_api_key'
 * @property {string|null} address - The formatted address if found
 * @property {number} locationCount - Number of locations found
 * @property {string|null} placeId - Google Place ID if available
 * @property {boolean} fromCache - Whether the result came from cache
 */

/**
 * Look up the address for a restaurant via the backend API
 * @param {string} restaurantName - Name of the restaurant
 * @param {string} city - City where the restaurant is located
 * @param {string} neighborhood - Neighborhood (optional, helps narrow search)
 * @returns {Promise<AddressResult>}
 */
export async function lookupAddress(restaurantName, city, neighborhood = '') {
  try {
    const response = await fetch('/api/address/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: restaurantName,
        city: city,
        neighborhood: neighborhood
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error looking up address:', error)
    return {
      status: 'error',
      address: null,
      locationCount: 0,
      placeId: null,
      error: error.message
    }
  }
}

/**
 * Look up address for a single restaurant object
 * Returns the restaurant with addressInfo added
 * @param {Object} restaurant - Restaurant object with name, city, neighborhood
 * @returns {Promise<Object>} - Restaurant with addressInfo property added
 */
export async function lookupAddressForRestaurant(restaurant) {
  // Skip if restaurant already has a valid address from CSV
  if (restaurant.address && 
      restaurant.address.trim() && 
      restaurant.address.toUpperCase() !== 'NA') {
    return {
      ...restaurant,
      addressInfo: {
        status: 'from_csv',
        address: restaurant.address,
        locationCount: 1
      }
    }
  }

  const addressInfo = await lookupAddress(
    restaurant.name,
    restaurant.city,
    restaurant.neighborhood
  )

  return {
    ...restaurant,
    addressInfo
  }
}
