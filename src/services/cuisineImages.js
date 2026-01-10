/**
 * Cuisine Image Mapping Service
 * 
 * Maps cuisine types to royalty-free images from Unsplash Source.
 * Provides fallback images for unknown cuisine types.
 */

// Cuisine type to image mapping
const CUISINE_IMAGES = {
  // Asian cuisines
  'korean': 'https://source.unsplash.com/400x300/?korean-food',
  'chinese': 'https://source.unsplash.com/400x300/?chinese-food',
  'chinese, dumplings': 'https://source.unsplash.com/400x300/?chinese-dumplings',
  'dumplings': 'https://source.unsplash.com/400x300/?dumplings',
  'szechuan': 'https://source.unsplash.com/400x300/?szechuan-food',
  'southeast asian': 'https://source.unsplash.com/400x300/?southeast-asian-food',
  'asian fusion': 'https://source.unsplash.com/400x300/?asian-fusion-food',
  'vietnamese': 'https://source.unsplash.com/400x300/?vietnamese-food',
  'taiwanese': 'https://source.unsplash.com/400x300/?taiwanese-food',
  'vietnamese, taiwanese': 'https://source.unsplash.com/400x300/?vietnamese-food',
  'indian': 'https://source.unsplash.com/400x300/?indian-food',
  
  // European cuisines
  'italian': 'https://source.unsplash.com/400x300/?italian-food',
  'californian/italian': 'https://source.unsplash.com/400x300/?italian-food',
  'french': 'https://source.unsplash.com/400x300/?french-food',
  
  // American cuisines
  'californian': 'https://source.unsplash.com/400x300/?californian-food',
  'california': 'https://source.unsplash.com/400x300/?californian-food',
  'southern': 'https://source.unsplash.com/400x300/?southern-food',
  'pub food': 'https://source.unsplash.com/400x300/?pub-food',
  'subs': 'https://source.unsplash.com/400x300/?sandwich',
  
  // Latin American cuisines
  'mexican': 'https://source.unsplash.com/400x300/?mexican-food',
  'brazilian': 'https://source.unsplash.com/400x300/?brazilian-food',
  
  // Middle Eastern/Mediterranean
  'mediterranean': 'https://source.unsplash.com/400x300/?mediterranean-food',
  
  // Generic fallback
  'default': 'https://source.unsplash.com/400x300/?restaurant-food'
}

/**
 * Normalize cuisine type string for matching
 * @param {string} cuisineType - The cuisine type from the restaurant data
 * @returns {string} - Normalized cuisine type (lowercase, trimmed)
 */
function normalizeCuisineType(cuisineType) {
  if (!cuisineType) return 'default'
  return cuisineType.toLowerCase().trim()
}

/**
 * Get image URL for a cuisine type
 * @param {string} cuisineType - The cuisine type (e.g., "Korean", "Italian", "Mexican")
 * @returns {string} - URL to the cuisine-appropriate image
 */
export function getCuisineImage(cuisineType) {
  const normalized = normalizeCuisineType(cuisineType)
  
  // Check for exact match first
  if (CUISINE_IMAGES[normalized]) {
    return CUISINE_IMAGES[normalized]
  }
  
  // Check for partial matches (e.g., "Vietnamese, Taiwanese" should match "vietnamese")
  for (const [key, url] of Object.entries(CUISINE_IMAGES)) {
    if (key !== 'default' && normalized.includes(key)) {
      return url
    }
  }
  
  // Check if any cuisine keyword matches
  const cuisineKeywords = [
    'korean', 'chinese', 'japanese', 'thai', 'vietnamese', 'taiwanese',
    'indian', 'italian', 'french', 'spanish', 'greek', 'mediterranean',
    'mexican', 'brazilian', 'american', 'californian', 'southern',
    'pub', 'bar', 'dumpling', 'szechuan', 'asian', 'fusion'
  ]
  
  for (const keyword of cuisineKeywords) {
    if (normalized.includes(keyword)) {
      // Try to find a matching image
      for (const [key, url] of Object.entries(CUISINE_IMAGES)) {
        if (key.includes(keyword)) {
          return url
        }
      }
    }
  }
  
  // Default fallback
  return CUISINE_IMAGES.default
}
