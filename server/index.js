import express from 'express'
import cors from 'cors'
import { lookupAddress, getCache, initCache } from './addressCache.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Initialize the cache on startup
initCache()

/**
 * POST /api/address/lookup
 * Look up a restaurant address using Google Places API
 * Request body: { name, city, neighborhood }
 */
app.post('/api/address/lookup', async (req, res) => {
  try {
    const { name, city, neighborhood } = req.body

    if (!name || !city) {
      return res.status(400).json({
        status: 'error',
        error: 'Missing required fields: name and city are required'
      })
    }

    const result = await lookupAddress(name, city, neighborhood || '')
    res.json(result)
  } catch (error) {
    console.error('Address lookup error:', error)
    res.status(500).json({
      status: 'error',
      error: error.message
    })
  }
})

/**
 * GET /api/address/cache
 * Get all cached addresses (for debugging)
 */
app.get('/api/address/cache', (req, res) => {
  const cache = getCache()
  res.json(cache)
})

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
