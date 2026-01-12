import { useState, useEffect } from 'react'
import { sortCuisineTypeAlphabetically } from '../utils/cuisineSorter'
import { lookupAddress } from '../services/addressLookup'

// Helper function to check if website is valid (not "NA" and not empty)
function hasValidWebsite(website) {
  return website && website.trim().toUpperCase() !== 'NA'
}

// Helper function to normalize URLs by adding protocol if missing
function normalizeUrl(url) {
  if (!url) return url
  
  // Remove any whitespace
  url = url.trim()
  
  // If URL already has a protocol, return as is
  if (/^https?:\/\//i.test(url)) {
    return url
  }
  
  // If URL starts with //, add https:
  if (url.startsWith('//')) {
    return `https:${url}`
  }
  
  // Otherwise, add https://
  return `https://${url}`
}

// Helper function to check if address is valid (not "NA" and not empty)
function hasValidAddress(address) {
  return address && address.trim() && address.trim().toUpperCase() !== 'NA'
}


// Helper function to build a Google search URL for a restaurant
function buildGoogleSearchUrl(name, city, neighborhood) {
  const searchTerms = [name]
  if (neighborhood) searchTerms.push(neighborhood)
  if (city) searchTerms.push(city)
  searchTerms.push('restaurant address')
  
  return `https://www.google.com/search?q=${encodeURIComponent(searchTerms.join(' '))}`
}

// Helper component to render address with Maps link
function AddressWithMapsLink({ address }) {
  return (
    <div className="flex items-start gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
      <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <div>
        <p className="text-gray-700 font-medium">{address}</p>
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-600 hover:text-amber-700 text-sm font-medium inline-flex items-center gap-1 mt-2"
          onClick={(e) => e.stopPropagation()}
        >
          View on Google Maps
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  )
}

// Helper component to render Google Search fallback
function GoogleSearchFallback({ name, city, neighborhood }) {
  const searchUrl = buildGoogleSearchUrl(name, city, neighborhood)

  return (
    <div className="flex items-start gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
      <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <div>
        <a 
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-600 hover:text-amber-700 text-sm font-medium inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Search on Google
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  )
}

// Helper component to render loading state
function AddressLoading() {
  return (
    <div className="flex items-start gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
      <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-500 text-sm">Looking up address...</span>
      </div>
    </div>
  )
}

// Helper function to render address/location info in the modal
function AddressDisplayModal({ restaurant }) {
  const [lookupState, setLookupState] = useState({
    loading: false,
    address: null,
    attempted: false
  })

  const csvAddress = restaurant?.address
  const hasCSVAddress = hasValidAddress(csvAddress)

  // Look up address when modal opens if no CSV address exists
  useEffect(() => {
    // Reset state when restaurant changes
    setLookupState({ loading: false, address: null, attempted: false })

    // If we already have an address from CSV, no need to look up
    if (hasCSVAddress) {
      return
    }

    // Skip lookup if missing required fields
    if (!restaurant?.name || !restaurant?.city) {
      return
    }

    // Perform the lookup
    const performLookup = async () => {
      setLookupState({ loading: true, address: null, attempted: false })
      
      try {
        const result = await lookupAddress(
          restaurant.name,
          restaurant.city,
          restaurant.neighborhood || ''
        )

        if (result.status === 'found' && result.address) {
          setLookupState({ loading: false, address: result.address, attempted: true })
        } else {
          setLookupState({ loading: false, address: null, attempted: true })
        }
      } catch (error) {
        console.error('Error looking up address:', error)
        setLookupState({ loading: false, address: null, attempted: true })
      }
    }

    performLookup()
  }, [restaurant?.name, restaurant?.city, restaurant?.neighborhood, hasCSVAddress])

  // Show CSV address if available
  if (hasCSVAddress) {
    return <AddressWithMapsLink address={csvAddress} />
  }

  // Show loading state
  if (lookupState.loading) {
    return <AddressLoading />
  }

  // Show looked up address if found
  if (lookupState.address) {
    return <AddressWithMapsLink address={lookupState.address} />
  }

  // Show Google Search fallback
  return (
    <GoogleSearchFallback 
      name={restaurant?.name}
      city={restaurant?.city}
      neighborhood={restaurant?.neighborhood}
    />
  )
}

export default function DetailModal({ restaurant, isOpen, onClose }) {
  if (!isOpen || !restaurant) return null

  // Check if website is valid and normalize the URL
  const hasWebsite = hasValidWebsite(restaurant.website)
  const websiteUrl = hasWebsite ? normalizeUrl(restaurant.website) : null

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-t-2xl sm:rounded-3xl shadow-2xl max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto overscroll-contain modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200/50 px-4 sm:px-8 py-4 sm:py-6 flex justify-between items-start z-10 rounded-t-2xl sm:rounded-t-3xl">
          <div className="flex-1 pr-2">
            {restaurant.cuisineType && (
              <div className="mb-1 sm:mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></span>
                  {sortCuisineTypeAlphabetically(restaurant.cuisineType)}
                </span>
              </div>
            )}
            <h2 className="heading-elegant text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 leading-tight">{restaurant.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-3 sm:p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-all touch-target flex-shrink-0"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 pb-8 sm:pb-8">
          {/* City, Neighborhood and Cuisine Tags */}
          <div className="flex flex-wrap gap-2">
            {restaurant.neighborhood && (
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 rounded-full text-xs sm:text-sm font-semibold border border-emerald-100">
                📍 {restaurant.neighborhood}
              </span>
            )}
            {restaurant.city && (
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 rounded-full text-xs sm:text-sm font-semibold border border-sky-100">
                🏙️ {restaurant.city}
              </span>
            )}
          </div>

          {/* Address */}
          <div>
            <h3 className="heading-elegant text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
              <span>📍</span> Location
            </h3>
            <AddressDisplayModal restaurant={restaurant} />
          </div>

          {/* Website Link */}
          <div>
            <h3 className="heading-elegant text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
              <span>🌐</span> Website
            </h3>
            {websiteUrl ? (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 sm:py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 active:from-amber-700 active:to-orange-700 transition-all shadow-md hover:shadow-lg touch-target"
              >
                Visit Website
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            ) : (
              <span className="text-gray-400 italic text-sm sm:text-base">No website provided</span>
            )}
          </div>

          {/* Price Range */}
          <div>
            <h3 className="heading-elegant text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
              <span>💰</span> Price Range
            </h3>
            {restaurant.priceRange ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 rounded-xl border border-emerald-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg sm:text-xl font-bold">{restaurant.priceRange}</span>
              </div>
            ) : (
              <span className="text-gray-400 italic text-sm sm:text-base">No price range provided</span>
            )}
          </div>

          {/* What You Love */}
          {restaurant.whatYouLove && (
            <div>
              <h3 className="heading-elegant text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                <span>❤️</span> What do friends love about this place?
              </h3>
              <p className="text-gray-700 leading-relaxed text-base sm:text-lg bg-rose-50/50 p-3 sm:p-4 rounded-xl border border-rose-100">{restaurant.whatYouLove}</p>
            </div>
          )}

          {/* Must Have Recommendations */}
          {restaurant.mustHave && (
            <div>
              <h3 className="heading-elegant text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                <span>⭐</span> Must Have Recommendations
              </h3>
              <p className="text-gray-700 leading-relaxed text-base sm:text-lg bg-amber-50/50 p-3 sm:p-4 rounded-xl border border-amber-100">{restaurant.mustHave}</p>
            </div>
          )}

          {/* Reservation Info */}
          {(restaurant.reservationNeeded || restaurant.planningTimeframe) && (
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-sky-100">
              <h3 className="heading-elegant text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                <span>📅</span> Reservation Details
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {restaurant.reservationNeeded && (
                  <p className="text-gray-700 text-base sm:text-lg">
                    <span className="font-bold text-gray-800">Reservation Needed:</span>{' '}
                    {restaurant.reservationNeeded}
                  </p>
                )}
                {restaurant.planningTimeframe && (
                  <p className="text-gray-700 text-base sm:text-lg">
                    <span className="font-bold text-gray-800">Planning Timeframe:</span>{' '}
                    {restaurant.planningTimeframe}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

