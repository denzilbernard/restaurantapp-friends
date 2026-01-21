import { list } from '@vercel/blob'

/**
 * Vercel Serverless Function to fetch restaurant data
 * GET /api/restaurants
 * 
 * This endpoint retrieves the current restaurant data from Vercel Blob Storage.
 * If no data has been uploaded, it returns an empty array.
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  // Prevent caching to always get fresh data
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // List blobs to find our restaurant data file
    const { blobs } = await list({
      prefix: 'restaurant-data'
    })

    if (blobs.length === 0) {
      // No data uploaded yet - return empty response
      return res.status(200).json({
        status: 'success',
        restaurants: [],
        updatedAt: null,
        count: 0,
        source: 'none'
      })
    }

    // Get the most recent blob (should only be one with our naming)
    const latestBlob = blobs[0]

    // Fetch the actual data from the blob URL
    const response = await fetch(latestBlob.url)
    if (!response.ok) {
      throw new Error('Failed to fetch blob data')
    }

    const data = await response.json()

    return res.status(200).json({
      status: 'success',
      restaurants: data.restaurants || [],
      updatedAt: data.updatedAt || latestBlob.uploadedAt,
      count: data.count || data.restaurants?.length || 0,
      source: 'blob'
    })

  } catch (error) {
    console.error('Restaurant fetch error:', error)

    // If blob storage is not configured, return empty response
    // The frontend will fall back to the static CSV
    if (error.message?.includes('BLOB') || error.code === 'ENOTFOUND') {
      return res.status(200).json({
        status: 'success',
        restaurants: [],
        updatedAt: null,
        count: 0,
        source: 'fallback',
        note: 'Blob storage not configured, using fallback data'
      })
    }

    return res.status(500).json({
      status: 'error',
      error: error.message || 'Failed to fetch restaurant data'
    })
  }
}
