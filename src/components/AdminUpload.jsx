import { useState, useCallback, useEffect } from 'react'
import Papa from 'papaparse'
import { normalizeCity } from '../utils/cityNormalizer'
import { resetApp } from '../utils/resetApp'

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
  'Price Range': 'priceRange',
  'Pricing Range': 'priceRange',
}

// Helper to find a column value with flexible matching (exact, case-insensitive, then partial)
function findColumnValue(row, possibleNames) {
  // First try exact matches
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null) {
      const value = String(row[name]).trim()
      if (value !== '') {
        return row[name] // Return original value, not trimmed
      }
    }
  }
  // Then try case-insensitive matching
  const rowKeys = Object.keys(row)
  for (const name of possibleNames) {
    const lowerName = name.toLowerCase().trim()
    const matchingKey = rowKeys.find(key => key.toLowerCase().trim() === lowerName)
    if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null) {
      const value = String(row[matchingKey]).trim()
      if (value !== '') {
        return row[matchingKey] // Return original value
      }
    }
  }
  return null // Return null instead of empty string to distinguish from empty values
}

function normalizeRow(row) {
  const normalized = { id: Math.random().toString(36).substr(2, 9) }
  
  // Handle fields with exact matching first, then fallback to case-insensitive
  for (const [csvColumn, appField] of Object.entries(COLUMN_MAPPINGS)) {
    
    let value = null
    
    // Try exact match first
    if (row[csvColumn] !== undefined && row[csvColumn] !== null && row[csvColumn] !== '') {
      value = row[csvColumn]
    } else {
      // Try case-insensitive match
      const rowKeys = Object.keys(row)
      const lowerColumn = csvColumn.toLowerCase().trim()
      const matchingKey = rowKeys.find(key => key.toLowerCase().trim() === lowerColumn)
      if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null && row[matchingKey] !== '') {
        value = row[matchingKey]
      }
    }
    
    // Only set if we found a value and the field isn't already set
    if (value !== null && !normalized[appField]) {
      const trimmedValue = String(value).trim()
      // Normalize city field
      if (appField === 'city') {
        normalized[appField] = normalizeCity(trimmedValue)
      } else {
        normalized[appField] = trimmedValue
      }
    }
  }
  
  // Ensure all fields exist
  const fields = ['name', 'website', 'city', 'neighborhood', 'cuisineType', 'whatYouLove', 'mustHave', 'reservationNeeded', 'planningTimeframe', 'priceRange']
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
  const [detectedColumns, setDetectedColumns] = useState([])

  // Check for existing data on mount
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
  }, [])

  const handleFile = useCallback((file) => {
    if (!file) return
    
    setError(null)
    setSuccess(false)
    setFileName(file.name)
    setDetectedColumns([])

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Clean up headers: remove BOM, trim whitespace
        return header.replace(/^\uFEFF/, '').trim()
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`CSV parsing error: ${results.errors[0].message}`)
          return
        }

        // Log detected columns for debugging
        if (results.data.length > 0) {
          const detectedCols = Object.keys(results.data[0])
          setDetectedColumns(detectedCols)
          console.log('Detected CSV columns:', detectedCols)
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

  const handleSaveData = () => {
    try {
      localStorage.setItem('restaurantData', JSON.stringify(parsedData))
      localStorage.setItem('restaurantDataUpdatedAt', new Date().toISOString())
      
      // Dispatch custom event to notify useSheetData hook to refresh
      window.dispatchEvent(new Event('restaurantDataUpdated'))
      
      setSuccess(true)
      setExistingCount(parsedData.length)
    } catch (err) {
      setError(`Error saving data: ${err.message}`)
    }
  }

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all restaurant data?')) {
      localStorage.removeItem('restaurantData')
      localStorage.removeItem('restaurantDataUpdatedAt')
      
      // Dispatch custom event to notify useSheetData hook to refresh
      window.dispatchEvent(new Event('restaurantDataUpdated'))
      
      setParsedData([])
      setFileName('')
      setExistingCount(0)
      setSuccess(false)
    }
  }

  const handleHardReset = () => {
    if (window.confirm('⚠️ HARD RESET: This will clear ALL application data including:\n\n- Restaurant data\n- Support messages\n- Admin authentication\n- All cached data\n\nThis action cannot be undone. Continue?')) {
      resetApp()
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated')
    window.location.href = '/admin'
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
            <div className="flex gap-2">
              <button
                onClick={handleClearData}
                className="px-4 py-2 bg-red-600/80 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                Clear All Data
              </button>
            </div>
          </div>
        )}

        {/* Hard Reset Section */}
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-red-200 font-medium mb-1">
                ⚠️ Hard Reset Application
              </p>
              <p className="text-red-300 text-sm">
                Clear all stored data including restaurant data, support messages, and admin sessions. This will reload the page.
              </p>
            </div>
            <button
              onClick={handleHardReset}
              className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
            >
              Hard Reset
            </button>
          </div>
        </div>

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

        {/* Debug Info */}
        {detectedColumns.length > 0 && (
          <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-300 font-medium mb-2">CSV Column Detection</p>
            <div className="text-sm text-slate-400 mb-2">
              <strong>Detected columns ({detectedColumns.length}):</strong> {detectedColumns.join(', ')}
            </div>
          </div>
        )}

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
                      <th className="text-left p-3 text-slate-300 font-medium">Price Range</th>
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
                        <td className="p-3 text-slate-300">{row.priceRange || '-'}</td>
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
              'How far in advance do we need to plan?',
              'Price Range'
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
