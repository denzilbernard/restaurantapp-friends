import { getCache, initCache } from '../../server/addressCache.js'

// Initialize cache on module load (for serverless)
initCache()

/**
 * Vercel Serverless Function for cache retrieval
 * GET /api/address/cache
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const cache = getCache()
    return res.status(200).json(cache)
  } catch (error) {
    console.error('Cache retrieval error:', error)
    return res.status(500).json({
      error: error.message
    })
  }
}
