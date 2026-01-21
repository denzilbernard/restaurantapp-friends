import { put } from '@vercel/blob'

/**
 * Vercel Serverless Function to upload/update restaurant data
 * POST /api/restaurants/upload
 * 
 * This endpoint receives parsed restaurant data from the admin panel
 * and stores it in Vercel Blob Storage, making it available to all users.
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { restaurants, adminToken } = req.body

    // Basic auth check - verify admin token from environment variable
    const expectedToken = process.env.ADMIN_UPLOAD_TOKEN
    if (expectedToken && adminToken !== expectedToken) {
      return res.status(401).json({
        status: 'error',
        error: 'Unauthorized: Invalid admin token'
      })
    }

    // Validate the data
    if (!restaurants || !Array.isArray(restaurants)) {
      return res.status(400).json({
        status: 'error',
        error: 'Invalid data format: restaurants must be an array'
      })
    }

    if (restaurants.length === 0) {
      return res.status(400).json({
        status: 'error',
        error: 'No restaurant data provided'
      })
    }

    // Prepare data for storage
    const dataToStore = {
      restaurants,
      updatedAt: new Date().toISOString(),
      count: restaurants.length
    }

    // Store in Vercel Blob Storage
    // Using the same filename ensures we overwrite the previous version
    const blob = await put('restaurant-data.json', JSON.stringify(dataToStore), {
      access: 'public',
      addRandomSuffix: false, // Always overwrite with same name
      contentType: 'application/json'
    })

    console.log(`Successfully uploaded ${restaurants.length} restaurants to blob storage`)

    return res.status(200).json({
      status: 'success',
      message: `Successfully uploaded ${restaurants.length} restaurants`,
      count: restaurants.length,
      updatedAt: dataToStore.updatedAt,
      blobUrl: blob.url
    })

  } catch (error) {
    console.error('Restaurant upload error:', error)
    
    // Provide helpful error message for common issues
    if (error.message?.includes('BLOB_STORE_SUSPENDED')) {
      return res.status(503).json({
        status: 'error',
        error: 'Blob storage is not configured. Please add BLOB_READ_WRITE_TOKEN to your Vercel environment variables.'
      })
    }

    return res.status(500).json({
      status: 'error',
      error: error.message || 'Failed to upload restaurant data'
    })
  }
}
