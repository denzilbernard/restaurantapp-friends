/**
 * Normalizes city names to their canonical forms.
 * 
 * Normalization rules:
 * - "NYC", "New York" → "New York City"
 * - "SF", "San Francisco" → "San Francisco"
 * - Strips state codes (e.g., "San Francisco, CA" → "San Francisco")
 * - Handles "Multiple locations" by extracting city name if present
 * 
 * @param {string} city - The city name to normalize
 * @returns {string} - The normalized city name, or the original if no normalization applies
 */
export function normalizeCity(city) {
  if (!city || typeof city !== 'string') {
    return city || ''
  }

  // Trim and normalize whitespace (replace multiple spaces with single space)
  let trimmed = city.trim().replace(/\s+/g, ' ')
  
  // Normalize to lowercase for comparison (case-insensitive)
  let lower = trimmed.toLowerCase()

  // EARLY CHECK: If it contains "san francisco" anywhere, return canonical form immediately
  // This catches ALL variations: "San Francisco", "San Francisco, CA", "San Francisco (multiple locations)", etc.
  if (lower.includes('san francisco') || lower === 'sf') {
    return 'San Francisco'
  }

  // EARLY CHECK: New York City group
  if (lower.includes('new york') || lower === 'nyc') {
    return 'New York City'
  }

  // STEP 1: Handle "Multiple locations" - extract city name if present
  if (lower.includes('multiple location')) {
    // Remove any parenthetical content
    trimmed = trimmed.replace(/\s*\([^)]*\)/gi, '').trim()
    // Remove comma-separated "multiple locations" or similar
    trimmed = trimmed.replace(/,\s*multiple\s+location[s]?.*/gi, '').trim()
    lower = trimmed.toLowerCase()
  }

  // STEP 2: Strip state codes (e.g., ", CA", ", NY", ", TX")
  trimmed = trimmed.replace(/,\s*[A-Za-z]{2}\s*$/, '').trim()

  // Return normalized city, ensuring consistent formatting
  return trimmed.trim()
}

/**
 * Checks if a city field contains "Multiple locations"
 * 
 * @param {string} city - The city name to check
 * @returns {boolean} - True if the city field contains "Multiple locations"
 */
export function hasMultipleLocations(city) {
  if (!city || typeof city !== 'string') {
    return false
  }
  return city.toLowerCase().includes('multiple locations')
}
