import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Cache file path - stores previously looked up addresses
const CACHE_FILE_PATH = path.join(__dirname, 'address-cache.json')

// Check if we're in a serverless environment (Vercel, etc.)
const IS_SERVERLESS = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || !fs.existsSync || typeof fs.existsSync !== 'function'

// In-memory cache (works in all environments)
let addressCache = {}

/**
 * Initialize the cache by loading from file (if available)
 * In serverless environments, this will just initialize an empty cache
 */
export function initCache() {
  // In serverless environments, skip file operations
  if (IS_SERVERLESS) {
    console.log('Running in serverless environment - using in-memory cache only')
    addressCache = {}
    return
  }

  try {
    if (fs.existsSync && fs.existsSync(CACHE_FILE_PATH)) {
      const data = fs.readFileSync(CACHE_FILE_PATH, 'utf-8')
      addressCache = JSON.parse(data)
      console.log(`Loaded ${Object.keys(addressCache).length} cached addresses from file`)
    } else {
      // Create empty cache file (only if file system is available)
      try {
        fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify({}, null, 2))
        console.log('Created new address cache file')
      } catch (writeError) {
        // File system might be read-only, just use in-memory cache
        console.log('Could not create cache file, using in-memory cache only')
        addressCache = {}
      }
    }
  } catch (error) {
    console.error('Error initializing cache:', error)
    addressCache = {}
  }
}

/**
 * Save the cache to file (if file system is available)
 * In serverless environments, this is a no-op
 */
function saveCache() {
  // Skip file operations in serverless environments
  if (IS_SERVERLESS) {
    return
  }

  try {
    if (fs.writeFileSync) {
      fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(addressCache, null, 2))
    }
  } catch (error) {
    // File system might be read-only or unavailable
    console.warn('Could not save cache to file (using in-memory cache only):', error.message)
  }
}

/**
 * Get the entire cache (for debugging)
 */
export function getCache() {
  return addressCache
}

/**
 * Generate a unique cache key for a restaurant
 */
function getCacheKey(name, city, neighborhood) {
  return `${name}|${city}|${neighborhood}`.toLowerCase().trim()
}

/**
 * Get the Google Places API key from environment
 */
function getApiKey() {
  return process.env.GOOGLE_PLACES_API_KEY || null
}

/**
 * Look up a restaurant address using Google Places API
 * First checks the cache, then makes an API call if not found
 * 
 * @param {string} name - Restaurant name
 * @param {string} city - City name
 * @param {string} neighborhood - Neighborhood (optional)
 * @returns {Promise<Object>} Address lookup result
 */
export async function lookupAddress(name, city, neighborhood = '') {
  const cacheKey = getCacheKey(name, city, neighborhood)

  // Check cache first
  if (addressCache[cacheKey]) {
    console.log(`Cache hit for: ${name} in ${city}`)
    return {
      ...addressCache[cacheKey],
      fromCache: true
    }
  }

  console.log(`Cache miss for: ${name} in ${city} - looking up...`)

  const apiKey = getApiKey()
  
  if (!apiKey) {
    console.warn('No GOOGLE_PLACES_API_KEY environment variable set')
    return {
      status: 'no_api_key',
      address: null,
      locationCount: 0,
      placeId: null
    }
  }

  try {
    // Build the search query
    const searchQuery = neighborhood 
      ? `${name} ${neighborhood} ${city}`
      : `${name} ${city}`
    
    // Use Google Places Text Search API
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
    url.searchParams.append('query', searchQuery)
    url.searchParams.append('type', 'restaurant')
    url.searchParams.append('key', apiKey)

    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const data = await response.json()

    let result

    if (data.status === 'ZERO_RESULTS' || !data.results || data.results.length === 0) {
      result = {
        status: 'not_found',
        address: null,
        locationCount: 0,
        placeId: null
      }
    } else if (data.results.length === 1) {
      // Single location found
      result = {
        status: 'found',
        address: data.results[0].formatted_address,
        locationCount: 1,
        placeId: data.results[0].place_id
      }
    } else {
      // Multiple locations found - check if they're actually the same restaurant
      const exactMatches = data.results.filter(place => 
        place.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(place.name.toLowerCase())
      )

      if (exactMatches.length === 1) {
        result = {
          status: 'found',
          address: exactMatches[0].formatted_address,
          locationCount: 1,
          placeId: exactMatches[0].place_id
        }
      } else if (exactMatches.length > 1) {
        // Multiple locations for the same restaurant - use the first match
        // This is common for chain restaurants
        result = {
          status: 'found',
          address: exactMatches[0].formatted_address,
          locationCount: exactMatches.length,
          placeId: exactMatches[0].place_id,
          note: `${exactMatches.length} locations found, showing first match`
        }
      } else {
        // Use the first result if no exact match
        result = {
          status: 'found',
          address: data.results[0].formatted_address,
          locationCount: 1,
          placeId: data.results[0].place_id
        }
      }
    }

    // Add timestamp and save to cache
    result.lookedUpAt = new Date().toISOString()
    addressCache[cacheKey] = result
    saveCache()

    console.log(`Cached address for: ${name} in ${city}`)

    return {
      ...result,
      fromCache: false
    }

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
