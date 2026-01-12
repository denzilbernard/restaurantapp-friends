import { lookupAddress, initCache } from '../../server/addressCache.js'

// Initialize cache on module load (for serverless)
initCache()

/**
 * Vercel Serverless Function for address lookup
 * POST /api/address/lookup
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, city, neighborhood } = req.body

    if (!name || !city) {
      return res.status(400).json({
        status: 'error',
        error: 'Missing required fields: name and city are required'
      })
    }

    const result = await lookupAddress(name, city, neighborhood || '')
    return res.status(200).json(result)
  } catch (error) {
    console.error('Address lookup error:', error)
    return res.status(500).json({
      status: 'error',
      error: error.message
    })
  }
}
