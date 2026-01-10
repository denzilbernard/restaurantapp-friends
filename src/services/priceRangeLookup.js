/**
 * Google Places API integration for fetching restaurant price ranges
 * Caches results in localStorage to avoid repeated API calls
 */

const CACHE_KEY = 'restaurantPriceCache'
const CACHE_EXPIRY_DAYS = 365 // Cache for 1 year

/**
 * Get the cache from localStorage
 */
function getCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (e) {
    console.error('Error reading price cache:', e)
  }
  return {}
}

/**
 * Save the cache to localStorage
 */
function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (e) {
    console.error('Error saving price cache:', e)
  }
}

/**
 * Generate a cache key from restaurant name and city
 */
function getCacheKey(restaurantName, city) {
  return `${restaurantName}|${city || ''}`
}

/**
 * Check if cached entry is still valid
 */
function isCacheValid(entry) {
  if (!entry || !entry.fetchedAt) return false
  const ageInDays = (Date.now() - entry.fetchedAt) / (1000 * 60 * 60 * 24)
  return ageInDays < CACHE_EXPIRY_DAYS
}

/**
 * Map Google Places price_level to our price range format
 * Google uses 0-4, where 0 is free and 4 is very expensive
 */
function mapPriceLevel(priceLevel) {
  if (priceLevel === null || priceLevel === undefined) return null
  
  // Google's price_level mapping:
  // 0 = Free
  // 1 = Inexpensive
  // 2 = Moderate
  // 3 = Expensive
  // 4 = Very Expensive
  
  // Map to our ranges:
  if (priceLevel === 0 || priceLevel === 1) return '$' // $0-$20
  if (priceLevel === 2) return '$$' // $21-$40
  if (priceLevel === 3) return '$$$' // $41-$100
  if (priceLevel === 4) return '$$$$' // $101-$1000
  
  return null
}

/**
 * Find a place using Google Places API Find Place endpoint
 */
async function findPlace(apiKey, restaurantName, city, address) {
  // Build the input text for the search
  let input = restaurantName
  if (city) {
    input += ` ${city}`
  }
  if (address && address.trim() && address.trim().toUpperCase() !== 'NA') {
    input += ` ${address}`
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
    },
    body: JSON.stringify({
      textQuery: input,
      maxResultCount: 1,
      includedType: 'restaurant',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Places API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  if (!data.places || data.places.length === 0) {
    return null
  }
  return data.places[0]
}

/**
 * Get place details including price_level
 */
async function getPlaceDetails(apiKey, placeId) {
  const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'priceLevel',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Places API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  // priceLevel is a number: 0 (free), 1 (inexpensive), 2 (moderate), 3 (expensive), 4 (very expensive)
  return data.priceLevel ?? null
}

/**
 * Lookup price range for a restaurant
 * Returns a Promise that resolves to the price range string ('$', '$$', '$$$', '$$$$') or null
 */
export async function lookupPriceRange(restaurant) {
  const { name, city, address } = restaurant
  
  if (!name) {
    return null
  }

  // Check cache first
  const cacheKey = getCacheKey(name, city)
  const cache = getCache()
  const cachedEntry = cache[cacheKey]
  
  if (cachedEntry && isCacheValid(cachedEntry)) {
    return cachedEntry.price
  }

  // Get API key from localStorage
  const apiKey = localStorage.getItem('googlePlacesApiKey')
  if (!apiKey || !apiKey.trim()) {
    console.warn('Google Places API key not configured')
    return null
  }

  try {
    // Step 1: Find the place
    const place = await findPlace(apiKey, name, city, address)
    
    if (!place || !place.id) {
      // No place found, cache null result to avoid repeated lookups
      cache[cacheKey] = {
        price: null,
        fetchedAt: Date.now(),
      }
      saveCache(cache)
      return null
    }

    // Step 2: Get place details for price_level
    // The place ID might be in different formats, try both
    const placeId = place.id
    const priceLevel = await getPlaceDetails(apiKey, placeId)
    
    // Map price level to our format
    const price = mapPriceLevel(priceLevel)
    
    // Cache the result
    cache[cacheKey] = {
      price,
      fetchedAt: Date.now(),
    }
    saveCache(cache)
    
    if (price) {
      console.log(`✓ Found price ${price} for ${name}${city ? ` in ${city}` : ''}`)
    } else {
      console.log(`⚠ No price data found for ${name}${city ? ` in ${city}` : ''}`)
    }
    
    return price
  } catch (error) {
    console.error(`✗ Error looking up price for ${name}:`, error.message)
    // Don't cache errors - allow retry on next load
    return null
  }
}

/**
 * Batch lookup price ranges for multiple restaurants with rate limiting
 * Returns a Promise that resolves when all lookups are complete
 */
export async function batchLookupPriceRanges(restaurants, onProgress) {
  const apiKey = localStorage.getItem('googlePlacesApiKey')
  if (!apiKey || !apiKey.trim()) {
    console.warn('Google Places API key not configured, skipping price lookups')
    return Promise.resolve()
  }

  // Filter restaurants that need lookup
  const cache = getCache()
  const restaurantsToLookup = restaurants.filter((restaurant) => {
    if (!restaurant.name) return false
    const cacheKey = getCacheKey(restaurant.name, restaurant.city)
    const cachedEntry = cache[cacheKey]
    return !cachedEntry || !isCacheValid(cachedEntry)
  })

  if (restaurantsToLookup.length === 0) {
    return Promise.resolve() // All prices already cached
  }

  // Rate limit: 1 request per second to avoid hitting API limits
  const delayBetweenRequests = 1000 // 1 second
  
  for (let i = 0; i < restaurantsToLookup.length; i++) {
    const restaurant = restaurantsToLookup[i]
    
    try {
      await lookupPriceRange(restaurant)
      
      // Report progress
      if (onProgress) {
        onProgress(i + 1, restaurantsToLookup.length)
      }
      
      // Wait before next request (except for the last one)
      if (i < restaurantsToLookup.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenRequests))
      }
    } catch (error) {
      console.error(`Error in batch lookup for ${restaurant.name}:`, error)
      // Continue with next restaurant even if one fails
    }
  }
}

/**
 * Get cached price range for a restaurant (synchronous)
 * Returns the price range string or null if not cached
 */
export function getCachedPriceRange(restaurant) {
  const { name, city } = restaurant
  if (!name) return null

  const cacheKey = getCacheKey(name, city)
  const cache = getCache()
  const cachedEntry = cache[cacheKey]
  
  if (cachedEntry && isCacheValid(cachedEntry)) {
    return cachedEntry.price
  }
  
  return null
}

/**
 * Clear the price cache (useful for admin)
 */
export function clearPriceCache() {
  localStorage.removeItem(CACHE_KEY)
}
