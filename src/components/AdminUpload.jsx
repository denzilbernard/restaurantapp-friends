import { useState, useCallback, useEffect } from 'react'
import Papa from 'papaparse'
import { normalizeCity } from '../utils/cityNormalizer'
import { clearPriceCache, batchLookupPriceRanges } from '../services/priceRangeLookup'

// Expected CSV column mappings
const COLUMN_MAPPINGS = {
  'Restaurant Name': 'name',
  'Website Link': 'website',
  'City:': 'city',
  'City': 'city',
  'Neighborhood/Area': 'neighborhood',
  'Cuisine Type': 'cuisineType',
  'What do you love about this place?': 'whatYouLove',
  'What are your "Must Have" recommendations"?': 'mustHave',
  'What is/are your "Must Have" recommendation(s)?': 'mustHave',
  'Reservation needed/required?': 'reservationNeeded',
  'How far in advance do we need to plan?': 'planningTimeframe',
}

function normalizeRow(row) {
  const normalized = { id: Math.random().toString(36).substr(2, 9) }
  
  for (const [csvColumn, appField] of Object.entries(COLUMN_MAPPINGS)) {
    if (row[csvColumn] !== undefined && !normalized[appField]) {
      const value = row[csvColumn]?.trim() || ''
      // Normalize city field
      if (appField === 'city') {
        normalized[appField] = normalizeCity(value)
      } else {
        normalized[appField] = value
      }
    }
  }
  
  // Ensure all fields exist
  const fields = ['name', 'website', 'city', 'neighborhood', 'cuisineType', 'whatYouLove', 'mustHave', 'reservationNeeded', 'planningTimeframe']
  fields.forEach(field => {
    if (!normalized[field]) normalized[field] = ''
  })
  
  return normalized
}

export default function AdminUpload() {
  const [parsedData, setParsedData] = useState([])
  const [fileName, setFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [existingCount, setExistingCount] = useState(0)
  const [apiKey, setApiKey] = useState('')
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const [priceLookupStatus, setPriceLookupStatus] = useState('')
  const [isLookingUpPrices, setIsLookingUpPrices] = useState(false)

  // Check for existing data and API key on mount
  useEffect(() => {
    const existing = localStorage.getItem('restaurantData')
    if (existing) {
      try {
        const data = JSON.parse(existing)
        setExistingCount(data.length)
      } catch (e) {
        console.error('Error parsing existing data:', e)
      }
    }
    
    // Load API key if it exists
    const storedApiKey = localStorage.getItem('googlePlacesApiKey')
    if (storedApiKey) {
      setApiKey(storedApiKey)
      setApiKeySaved(true)
    }
  }, [])

  const handleFile = useCallback((file) => {
    if (!file) return
    
    setError(null)
    setSuccess(false)
    setFileName(file.name)

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`CSV parsing error: ${results.errors[0].message}`)
          return
        }

        const normalizedData = results.data
          .map(normalizeRow)
          .filter(row => row.name && row.name.trim() !== '')

        if (normalizedData.length === 0) {
          setError('No valid restaurant data found in CSV. Make sure your CSV has a "Restaurant Name" column.')
          return
        }

        setParsedData(normalizedData)
      },
      error: (err) => {
        setError(`Error reading file: ${err.message}`)
      }
    })
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e) => {
    const file = e.target.files[0]
    handleFile(file)
  }, [handleFile])

  const handleSaveData = async () => {
    try {
      localStorage.setItem('restaurantData', JSON.stringify(parsedData))
      localStorage.setItem('restaurantDataUpdatedAt', new Date().toISOString())
      setSuccess(true)
      setExistingCount(parsedData.length)
      
      // Automatically trigger price lookup after saving CSV data
      const storedApiKey = localStorage.getItem('googlePlacesApiKey')
      if (storedApiKey && storedApiKey.trim()) {
        setIsLookingUpPrices(true)
        setPriceLookupStatus(`Starting price lookup for ${parsedData.length} restaurants...`)
        setError(null)

        try {
          await batchLookupPriceRanges(parsedData, (current, total) => {
            setPriceLookupStatus(`Looking up prices: ${current}/${total} restaurants...`)
          })

          setPriceLookupStatus(`✅ Successfully looked up prices for all restaurants!`)
          setTimeout(() => {
            setPriceLookupStatus('')
          }, 5000)
        } catch (err) {
          setPriceLookupStatus(`⚠ Price lookup completed with some errors. Check console for details.`)
          setTimeout(() => {
            setPriceLookupStatus('')
          }, 5000)
        } finally {
          setIsLookingUpPrices(false)
        }
      } else {
        setPriceLookupStatus('⚠ Google Places API key not configured. Prices will not be fetched.')
        setTimeout(() => {
          setPriceLookupStatus('')
        }, 5000)
      }
    } catch (err) {
      setError(`Error saving data: ${err.message}`)
    }
  }

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all restaurant data?')) {
      localStorage.removeItem('restaurantData')
      localStorage.removeItem('restaurantDataUpdatedAt')
      setParsedData([])
      setFileName('')
      setExistingCount(0)
      setSuccess(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated')
    window.location.href = '/admin'
  }

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      setError('Please enter a Google Places API key')
      return
    }
    
    try {
      localStorage.setItem('googlePlacesApiKey', apiKey.trim())
      setApiKeySaved(true)
      setError(null)
    } catch (err) {
      setError(`Error saving API key: ${err.message}`)
    }
  }

  const handleClearApiKey = () => {
    if (window.confirm('Are you sure you want to clear the API key? Price lookups will stop working.')) {
      localStorage.removeItem('googlePlacesApiKey')
      setApiKey('')
      setApiKeySaved(false)
    }
  }

  const handleClearPriceCache = () => {
    if (window.confirm('Are you sure you want to clear the price cache? All price data will need to be fetched again.')) {
      clearPriceCache()
      setSuccess(true)
      setPriceLookupStatus('Price cache cleared. Prices will be fetched on next page load.')
      setTimeout(() => {
        setSuccess(false)
        setPriceLookupStatus('')
      }, 5000)
    }
  }

  const handleTriggerPriceLookup = async () => {
    const storedApiKey = localStorage.getItem('googlePlacesApiKey')
    if (!storedApiKey || !storedApiKey.trim()) {
      setError('Please save your Google Places API key first')
      return
    }

    // Get restaurants from localStorage
    const restaurantData = localStorage.getItem('restaurantData')
    if (!restaurantData) {
      setError('No restaurant data found. Please upload data first.')
      return
    }

    try {
      const restaurants = JSON.parse(restaurantData)
      if (!Array.isArray(restaurants) || restaurants.length === 0) {
        setError('No restaurants found in data')
        return
      }

      setIsLookingUpPrices(true)
      setPriceLookupStatus(`Starting price lookup for ${restaurants.length} restaurants...`)
      setError(null)

      await batchLookupPriceRanges(restaurants, (current, total) => {
        setPriceLookupStatus(`Looking up prices: ${current}/${total} restaurants...`)
      })

      setPriceLookupStatus(`✅ Successfully looked up prices for all restaurants!`)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setPriceLookupStatus('')
      }, 5000)
    } catch (err) {
      setError(`Error during price lookup: ${err.message}`)
      setPriceLookupStatus('')
    } finally {
      setIsLookingUpPrices(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Upload Restaurant Data
            </h1>
            <p className="text-slate-400">
              Upload restaurant data via CSV file
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/"
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              View App
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Google Places API Key Configuration */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Google Places API Configuration</h2>
          <p className="text-slate-400 text-sm mb-4">
            Configure your Google Places API key to enable automatic price range lookups for restaurants.
            Get your API key from{' '}
            <a 
              href="https://console.cloud.google.com/google/maps-apis/credentials" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline"
            >
              Google Cloud Console
            </a>
            . Make sure to enable the Places API (New) for your project.
          </p>
          
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  setApiKeySaved(false)
                }}
                placeholder="Enter your Google Places API key"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {apiKeySaved && (
                <p className="text-emerald-400 text-sm mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  API key saved
                </p>
              )}
            </div>
            <button
              onClick={handleSaveApiKey}
              className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
            >
              Save API Key
            </button>
            {apiKeySaved && (
              <button
                onClick={handleClearApiKey}
                className="px-4 py-2 bg-red-600/80 text-white text-sm rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
            <div>
              <button
                onClick={handleTriggerPriceLookup}
                disabled={isLookingUpPrices || !apiKeySaved}
                className={`px-4 py-2 text-white text-sm rounded-lg transition-colors ${
                  isLookingUpPrices || !apiKeySaved
                    ? 'bg-slate-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLookingUpPrices ? 'Looking up prices...' : 'Trigger Price Lookup Now'}
              </button>
              <p className="text-slate-500 text-xs mt-2">
                Manually trigger price lookups for all restaurants in your data
              </p>
            </div>
            
            <div>
              <button
                onClick={handleClearPriceCache}
                className="px-4 py-2 bg-amber-600/80 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors"
              >
                Clear Price Cache
              </button>
              <p className="text-slate-500 text-xs mt-2">
                Clear cached price data to force fresh lookups from Google Places API
              </p>
            </div>

            {priceLookupStatus && (
              <div className={`p-3 rounded-lg text-sm ${
                priceLookupStatus.includes('✅') 
                  ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700'
                  : 'bg-blue-900/50 text-blue-300 border border-blue-700'
              }`}>
                {priceLookupStatus}
              </div>
            )}
          </div>
        </div>

        {/* Status Banner */}
        {existingCount > 0 && (
          <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-4 mb-6 flex justify-between items-center">
            <div>
              <p className="text-blue-200 font-medium">
                Current Data Status
              </p>
              <p className="text-blue-300 text-sm mt-1">
                {existingCount} restaurants currently loaded
              </p>
            </div>
            <button
              onClick={handleClearData}
              className="px-4 py-2 bg-red-600/80 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Clear All Data
            </button>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-12 text-center transition-all
            ${isDragging 
              ? 'border-emerald-400 bg-emerald-900/20' 
              : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <p className="text-xl text-white mb-2">
            {isDragging ? 'Drop your CSV file here' : 'Drag and drop your CSV file here'}
          </p>
          <p className="text-slate-400 mb-4">
            or click to browse
          </p>
          
          {fileName && (
            <p className="text-emerald-400 font-medium">
              Selected: {fileName}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-900/50 border border-red-700 rounded-lg p-4">
            <p className="text-red-300 font-medium">Error</p>
            <p className="text-red-200 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mt-6 bg-emerald-900/50 border border-emerald-700 rounded-lg p-4">
            <p className="text-emerald-300 font-medium">Success!</p>
            <p className="text-emerald-200 text-sm mt-1">
              {parsedData.length} restaurants saved successfully. 
              <a href="/" className="underline ml-1 hover:text-white">View the app</a>
            </p>
          </div>
        )}

        {/* Data Preview */}
        {parsedData.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">
                Preview ({parsedData.length} restaurants)
              </h2>
              <button
                onClick={handleSaveData}
                className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Save to App
              </button>
            </div>

            <div className="bg-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="text-left p-3 text-slate-300 font-medium">Name</th>
                      <th className="text-left p-3 text-slate-300 font-medium">City</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Neighborhood</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Cuisine</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Reservation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {parsedData.slice(0, 20).map((row, index) => (
                      <tr key={row.id || index} className="hover:bg-slate-700/50">
                        <td className="p-3 text-white font-medium">{row.name}</td>
                        <td className="p-3 text-slate-300">{row.city}</td>
                        <td className="p-3 text-slate-300">{row.neighborhood}</td>
                        <td className="p-3 text-slate-300">{row.cuisineType}</td>
                        <td className="p-3 text-slate-300">{row.reservationNeeded}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {parsedData.length > 20 && (
                <div className="p-4 text-center text-slate-400 bg-slate-700/50">
                  Showing 20 of {parsedData.length} restaurants
                </div>
              )}
            </div>
          </div>
        )}

        {/* CSV Format Help */}
        <div className="mt-8 bg-slate-800/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Expected CSV Format</h3>
          <p className="text-slate-400 mb-4">
            Your CSV should include headers with these column names:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {[
              'Restaurant Name',
              'Website Link',
              'City:',
              'Neighborhood/Area',
              'Cuisine Type',
              'What do you love about this place?',
              'What are your "Must Have" recommendations"?',
              'Reservation needed/required?',
              'How far in advance do we need to plan?'
            ].map((col) => (
              <div key={col} className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <code className="text-slate-300">{col}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
