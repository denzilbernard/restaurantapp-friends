/**
 * Calculates the Levenshtein distance between two strings.
 * This measures how many single-character edits are needed to change one string into another.
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - The Levenshtein distance
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length
  const len2 = str2.length
  
  // Create a matrix
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0))
  
  // Initialize first row and column
  for (let i = 0; i <= len1; i++) matrix[i][0] = i
  for (let j = 0; j <= len2; j++) matrix[0][j] = j
  
  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }
  
  return matrix[len1][len2]
}

/**
 * Normalizes a string for comparison by converting to lowercase and trimming.
 * 
 * @param {string} str - String to normalize
 * @returns {string} - Normalized string
 */
function normalizeForComparison(str) {
  if (!str || typeof str !== 'string') return ''
  return str.trim().toLowerCase()
}

/**
 * Checks if two strings are similar enough to be considered duplicates.
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {boolean} - True if strings are similar enough to be considered duplicates
 */
export function areSimilar(str1, str2) {
  const normalized1 = normalizeForComparison(str1)
  const normalized2 = normalizeForComparison(str2)
  
  // Exact match after normalization
  if (normalized1 === normalized2) return true
  
  // If strings are very short (1-3 chars), require exact match
  if (normalized1.length <= 3 || normalized2.length <= 3) {
    return normalized1 === normalized2
  }
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalized1, normalized2)
  const maxLength = Math.max(normalized1.length, normalized2.length)
  
  // Consider similar if:
  // 1. Distance is 1 or 2 (one or two character differences)
  // 2. OR distance is <= 2 for short strings (<= 5 chars)
  // 3. OR similarity ratio is >= 85% for longer strings
  if (maxLength <= 5) {
    return distance <= 2
  } else {
    const similarityRatio = 1 - (distance / maxLength)
    return distance <= 2 || similarityRatio >= 0.85
  }
}

/**
 * Deduplicates an array of strings by removing duplicates and similar entries.
 * When duplicates are found, keeps the first occurrence (or the one that appears most frequently).
 * 
 * @param {string[]} items - Array of strings to deduplicate
 * @returns {string[]} - Deduplicated array, sorted
 */
export function deduplicateSimilar(items) {
  if (!items || items.length === 0) return []
  
  // First, create a map to count occurrences (case-insensitive)
  const occurrenceMap = new Map()
  const originalMap = new Map() // Maps normalized to original (first occurrence)
  
  items.forEach(item => {
    if (!item || typeof item !== 'string') return
    
    const normalized = normalizeForComparison(item)
    const trimmed = item.trim()
    
    if (!normalized) return
    
    // Track original casing of first occurrence
    if (!originalMap.has(normalized)) {
      originalMap.set(normalized, trimmed)
    }
    
    // Count occurrences
    occurrenceMap.set(normalized, (occurrenceMap.get(normalized) || 0) + 1)
  })
  
  // Get all unique normalized items
  const normalizedItems = Array.from(occurrenceMap.keys())
  
  // Group similar items together
  const groups = []
  const processed = new Set()
  
  normalizedItems.forEach(item => {
    if (processed.has(item)) return
    
    const group = [item]
    processed.add(item)
    
    // Find all similar items
    normalizedItems.forEach(otherItem => {
      if (processed.has(otherItem)) return
      
      if (areSimilar(item, otherItem)) {
        group.push(otherItem)
        processed.add(otherItem)
      }
    })
    
    groups.push(group)
  })
  
  // For each group, pick the most common variant (or first if tied)
  const result = groups.map(group => {
    // Sort by occurrence count (descending), then by original order
    group.sort((a, b) => {
      const countDiff = occurrenceMap.get(b) - occurrenceMap.get(a)
      if (countDiff !== 0) return countDiff
      // If counts are equal, prefer shorter (more likely to be canonical)
      return a.length - b.length
    })
    
    // Return the original casing of the most common variant
    const bestVariant = group[0]
    return originalMap.get(bestVariant)
  })
  
  return result.sort()
}
