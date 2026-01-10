/**
 * Sorts cuisine type components alphabetically while preserving the original separator.
 * For example: "Vietnamese, Taiwanese" becomes "Taiwanese, Vietnamese"
 *              "Italian/Californian" becomes "Californian/Italian"
 * 
 * @param {string} cuisineType - The cuisine type string (possibly with "/" or "," separators)
 * @returns {string} - The cuisine type with components sorted alphabetically
 */
export function sortCuisineTypeAlphabetically(cuisineType) {
  if (!cuisineType) return cuisineType
  
  // Determine which separator is used
  const hasSlash = cuisineType.includes('/')
  const hasComma = cuisineType.includes(',')
  
  // If no separator, return as-is
  if (!hasSlash && !hasComma) {
    return cuisineType
  }
  
  // Prefer comma if both are present, otherwise use the one that exists
  const separator = hasComma ? ',' : '/'
  const joinSeparator = hasComma ? ', ' : '/'
  
  // Split, trim, sort alphabetically, and rejoin
  const parts = cuisineType
    .split(separator)
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  
  return parts.join(joinSeparator)
}
