import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import { normalizeCity } from '../utils/cityNormalizer'

// Replace this URL with your published Google Sheet CSV URL
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0'

// Dummy data for development/preview (used when no uploaded data exists)
const DUMMY_DATA = [
  {
    id: 1,
    name: 'The Italian Place',
    website: 'https://example.com/italian',
    city: 'San Francisco',
    neighborhood: 'North Beach',
    cuisineType: 'Italian',
    whatYouLove: 'Authentic pasta and cozy atmosphere. The homemade tiramisu is incredible!',
    mustHave: 'Carbonara, Truffle Risotto',
    reservationNeeded: 'Yes',
    planningTimeframe: '1 week in advance',
  },
  {
    id: 2,
    name: 'Sakura Sushi',
    website: 'https://example.com/sakura',
    city: 'San Francisco',
    neighborhood: 'Japantown',
    cuisineType: 'Japanese',
    whatYouLove: 'Freshest fish in the city. The chef is a true master of his craft.',
    mustHave: 'Omakase, Salmon Belly',
    reservationNeeded: 'Yes',
    planningTimeframe: '2 weeks in advance',
  },
  {
    id: 3,
    name: 'Taco Loco',
    website: 'https://example.com/tacoloco',
    city: 'Oakland',
    neighborhood: 'Fruitvale',
    cuisineType: 'Mexican',
    whatYouLove: 'Best street tacos outside of Mexico. Amazing salsa bar!',
    mustHave: 'Al Pastor Tacos, Horchata',
    reservationNeeded: 'No',
    planningTimeframe: 'Walk-in friendly',
  },
  {
    id: 4,
    name: 'Le Petit Bistro',
    website: 'https://example.com/lepetit',
    city: 'San Francisco',
    neighborhood: 'Hayes Valley',
    cuisineType: 'French',
    whatYouLove: 'Romantic setting with classic French cuisine. Perfect for date night.',
    mustHave: 'Duck Confit, Crème Brûlée',
    reservationNeeded: 'Yes',
    planningTimeframe: '3-5 days in advance',
  },
  {
    id: 5,
    name: 'Golden Dragon',
    website: 'https://example.com/goldendragon',
    city: 'San Francisco',
    neighborhood: 'Chinatown',
    cuisineType: 'Chinese',
    whatYouLove: 'Dim sum that rivals Hong Kong. Weekend brunch is a must!',
    mustHave: 'Har Gow, Char Siu Bao',
    reservationNeeded: 'No',
    planningTimeframe: 'Walk-in (expect a wait on weekends)',
  },
  {
    id: 6,
    name: 'Mumbai Masala',
    website: 'https://example.com/mumbai',
    city: 'Oakland',
    neighborhood: 'Temescal',
    cuisineType: 'Indian',
    whatYouLove: 'Authentic flavors with the perfect level of spice. Great vegetarian options.',
    mustHave: 'Butter Chicken, Garlic Naan',
    reservationNeeded: 'No',
    planningTimeframe: 'Walk-in friendly',
  },
  {
    id: 7,
    name: 'The Smokehouse',
    website: 'https://example.com/smokehouse',
    city: 'Berkeley',
    neighborhood: 'Downtown',
    cuisineType: 'BBQ',
    whatYouLove: 'Low and slow smoked meats. The brisket melts in your mouth.',
    mustHave: 'Brisket, Mac and Cheese',
    reservationNeeded: 'No',
    planningTimeframe: 'Walk-in (get there early, they sell out!)',
  },
  {
    id: 8,
    name: 'Olive & Thyme',
    website: 'https://example.com/olivethyme',
    city: 'San Francisco',
    neighborhood: 'Mission',
    cuisineType: 'Mediterranean',
    whatYouLove: 'Fresh ingredients and beautiful presentation. Great for groups.',
    mustHave: 'Mezze Platter, Lamb Kebabs',
    reservationNeeded: 'Yes',
    planningTimeframe: '2-3 days in advance',
  },
]

// Set to true to use dummy data when no uploaded data exists
const USE_DUMMY_DATA_AS_FALLBACK = true

// Data version - increment this to force re-normalization of stored data
const DATA_VERSION = 2

// Check if there's uploaded data in localStorage
function getUploadedData() {
  try {
    const storedData = localStorage.getItem('restaurantData')
    const storedVersion = localStorage.getItem('restaurantDataVersion')
    
    if (storedData) {
      const parsed = JSON.parse(storedData)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Re-normalize city values to ensure consistency with current normalization rules
        const normalizedData = parsed.map(restaurant => ({
          ...restaurant,
          city: normalizeCity(restaurant.city)
        }))
        
        // Update stored data with normalized values if version changed
        if (storedVersion !== String(DATA_VERSION)) {
          localStorage.setItem('restaurantData', JSON.stringify(normalizedData))
          localStorage.setItem('restaurantDataVersion', String(DATA_VERSION))
          console.log('Re-normalized stored restaurant data to version', DATA_VERSION)
        }
        
        return normalizedData
      }
    }
  } catch (e) {
    console.error('Error reading uploaded data from localStorage:', e)
  }
  return null
}

// Helper to find a column value with case-insensitive matching
function findColumnValue(row, possibleNames) {
  // First try exact matches
  for (const name of possibleNames) {
    if (row[name] !== undefined) return row[name]
  }
  // Then try case-insensitive matching
  const rowKeys = Object.keys(row)
  for (const name of possibleNames) {
    const lowerName = name.toLowerCase()
    const matchingKey = rowKeys.find(key => key.toLowerCase() === lowerName)
    if (matchingKey && row[matchingKey] !== undefined) return row[matchingKey]
  }
  return ''
}

// Helper to parse a row from CSV
function parseRestaurantRow(row, index) {
  const rawCity = row['City'] || row['City:'] || ''
  return {
    id: index,
    name: row['Restaurant Name'] || row['Restaurant name'] || '',
    website: row['Website link'] || row['Website Link'] || '',
    city: normalizeCity(rawCity),
    neighborhood: row['Neighborhood/Area:'] || row['Neighborhood/Area'] || '',
    cuisineType: row['Cuisine type'] || row['Cuisine Type'] || '',
    whatYouLove: row['What do you love about this place?'] || '',
    mustHave: row['What is/are your "Must Have" recommendation(s)?'] || row['What are your "Must Have" recommendations"?'] || '',
    reservationNeeded: (row['Reservation needed/required?'] || '').trim(),
    planningTimeframe: row['How far in advance do we need to plan?'] || '',
    priceRange: row['Price Range'] || row['Pricing Range'] || '',
    // Check for address column in CSV
    address: row['Address'] || row['address'] || row['Location'] || row['location'] || '',
  }
}

export function useSheetData() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        let restaurants = []

        // First, check for uploaded data in localStorage (for immediate updates after admin upload)
        const uploadedData = getUploadedData()
        if (uploadedData) {
          // Small delay for smooth transition
          await new Promise(resolve => setTimeout(resolve, 300))
          restaurants = uploadedData
          console.log(`✅ Loaded ${restaurants.length} restaurants from localStorage`)
        } else {
          // Try fetching from server API first (production data)
          try {
            const apiResponse = await fetch('/api/restaurants')
            if (apiResponse.ok) {
              const apiData = await apiResponse.json()
              if (apiData.status === 'success' && apiData.restaurants && apiData.restaurants.length > 0) {
                restaurants = apiData.restaurants.map((r, index) => ({
                  ...r,
                  id: r.id || index,
                  city: normalizeCity(r.city || '')
                }))
                console.log(`✅ Loaded ${restaurants.length} restaurants from server API`)
              }
            }
          } catch (apiError) {
            console.log('Server API not available, trying fallback:', apiError)
          }

          // If no data from API, try loading from local CSV file
          if (restaurants.length === 0) {
            try {
              // Add cache-busting query parameter to ensure fresh data
              const cacheBuster = `?v=${Date.now()}`
              const csvResponse = await fetch(`/sample-restaurants.csv${cacheBuster}`)
              if (csvResponse.ok) {
                const csvText = await csvResponse.text()
                
                const csvData = await new Promise((resolve, reject) => {
                  Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => resolve(results),
                    error: (error) => reject(error)
                  })
                })
                
                restaurants = csvData.data
                  .map((row, index) => parseRestaurantRow(row, index))
                  .filter(restaurant => restaurant.name.trim() !== '')
                
                // Debug: Log how many restaurants were loaded from CSV
                console.log(`✅ Loaded ${restaurants.length} restaurants from CSV file`)
              }
            } catch (csvError) {
              // If local CSV fetch fails, continue to fallback options
              console.log('Local CSV not available, using fallback data', csvError)
            }
          }

          // If no restaurants loaded yet, try fallback options
          if (restaurants.length === 0) {
            if (USE_DUMMY_DATA_AS_FALLBACK) {
              // Simulate a small loading delay for realism
              await new Promise(resolve => setTimeout(resolve, 500))
              restaurants = DUMMY_DATA
              console.log(`✅ Loaded ${restaurants.length} restaurants from dummy data`)
            } else {
              // Otherwise, try fetching from Google Sheets
              const response = await fetch(GOOGLE_SHEET_CSV_URL)
              if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`)
              }
              
              const csvText = await response.text()
              
              const csvData = await new Promise((resolve, reject) => {
                Papa.parse(csvText, {
                  header: true,
                  skipEmptyLines: true,
                  complete: (results) => resolve(results),
                  error: (error) => reject(error)
                })
              })
              
              restaurants = csvData.data
                .map((row, index) => parseRestaurantRow(row, index))
                .filter(restaurant => restaurant.name.trim() !== '')
            }
          }
        }

        // Set data
        setData(restaurants)
        setLoading(false)

      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    fetchData()

    // Listen for storage changes (from other tabs/windows)
    const handleStorageChange = (e) => {
      if (e.key === 'restaurantData' || e.key === 'restaurantDataUpdatedAt') {
        fetchData()
      }
    }

    // Listen for custom event (from same tab)
    const handleDataUpdate = () => {
      fetchData()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('restaurantDataUpdated', handleDataUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('restaurantDataUpdated', handleDataUpdate)
    }
  }, [])

  return { data, loading, error }
}

