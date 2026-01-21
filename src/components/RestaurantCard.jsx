import React, { useState } from 'react'
import { sortCuisineTypeAlphabetically } from '../utils/cuisineSorter'
import { hasMultipleLocations, normalizeCity } from '../utils/cityNormalizer'

// Helper function to check if website is valid (not "NA" and not empty)
function hasValidWebsite(website) {
  return website && website.trim().toUpperCase() !== 'NA'
}

// Helper function to check if address is valid (not "NA" and not empty)
function hasValidAddress(address) {
  return address && address.trim() && address.trim().toUpperCase() !== 'NA'
}

// Helper function to render address info
function AddressDisplay({ address }) {
  if (hasValidAddress(address)) {
    return (
      <span className="text-gray-700 text-sm line-clamp-2">
        {address}
      </span>
    )
  }
  
  return (
    <span className="text-gray-400 italic text-sm">
      Click for location details
    </span>
  )
}


export default function RestaurantCard({ restaurant, recommendations, onClick }) {
  // Handle both single restaurant and grouped recommendations
  const restaurantGroup = recommendations && recommendations.length > 0 
    ? { name: restaurant.name, recommendations } 
    : { name: restaurant.name, recommendations: [restaurant] }
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentRestaurant = restaurantGroup.recommendations[currentIndex]
  const hasMultipleRecommendations = restaurantGroup.recommendations.length > 1
  
  const hasWebsite = hasValidWebsite(currentRestaurant.website)

  const handlePrevious = (e) => {
    e.stopPropagation()
    setCurrentIndex((prev) => 
      prev === 0 ? restaurantGroup.recommendations.length - 1 : prev - 1
    )
  }

  const handleNext = (e) => {
    e.stopPropagation()
    setCurrentIndex((prev) => 
      prev === restaurantGroup.recommendations.length - 1 ? 0 : prev + 1
    )
  }

  return (
    <div
      onClick={() => onClick(currentRestaurant)}
      className="glass-card rounded-xl sm:rounded-2xl hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden relative group active:scale-[0.99] sm:hover:-translate-y-1"
    >
      {/* Close Button - Floating X - Top Right */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          // Handle close action - you can add onClose prop if needed
        }}
        className="absolute top-2 sm:top-3 right-2 sm:right-3 z-20 bg-white/95 hover:bg-white active:bg-gray-100 rounded-full p-2 sm:p-2.5 shadow-lg transition-all hover:scale-110 backdrop-blur-sm touch-target"
        aria-label="Close"
      >
        <svg className="w-5 h-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation Arrows - Always visible on mobile, hover on desktop */}
      {hasMultipleRecommendations && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white active:bg-gray-100 rounded-full p-3 sm:p-2.5 shadow-lg transition-all hover:scale-110 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 backdrop-blur-sm touch-target"
            aria-label="Previous recommendation"
          >
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white active:bg-gray-100 rounded-full p-3 sm:p-2.5 shadow-lg transition-all hover:scale-110 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 backdrop-blur-sm touch-target"
            aria-label="Next recommendation"
          >
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Recommendation Indicator - Positioned below X button when multiple recommendations exist */}
      {hasMultipleRecommendations && (
        <div className="absolute top-12 sm:top-14 right-2 sm:right-3 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-md">
          {currentIndex + 1} / {restaurantGroup.recommendations.length}
        </div>
      )}

      <div className="p-4 sm:p-6">
        {/* Cuisine Type Tag */}
        {currentRestaurant.cuisineType && (
          <div className="mb-2 sm:mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></span>
              {sortCuisineTypeAlphabetically(currentRestaurant.cuisineType)}
            </span>
          </div>
        )}
        
        {/* Restaurant Name */}
        <h3 className="heading-elegant text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 leading-tight hover:text-amber-700 transition-colors line-clamp-2">
          {currentRestaurant.name}
        </h3>
        
        {/* Location Tags */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          {currentRestaurant.neighborhood && (
            <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 rounded-full text-xs sm:text-sm font-medium border border-emerald-100">
              📍 {currentRestaurant.neighborhood}
            </span>
          )}
          {currentRestaurant.city && (
            <>
              <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 rounded-full text-xs sm:text-sm font-medium border border-sky-100">
                🏙️ {normalizeCity(currentRestaurant.city)}
              </span>
              {hasMultipleLocations(currentRestaurant.city) && (
                <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-full text-xs sm:text-sm font-medium border border-purple-100">
                  📍 Multiple locations
                </span>
              )}
            </>
          )}
        </div>

        {/* Address Info */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200/50">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <AddressDisplay address={currentRestaurant.address} />
          </div>
        </div>

        {/* Website, Price Range, and Reservation Info - Compact */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-gray-600">
              <span className="font-medium">Website:</span>{' '}
              {hasWebsite ? (
                <span className="text-amber-600 font-medium">Available ✓</span>
              ) : (
                <span className="text-gray-400 italic">Not provided</span>
              )}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs sm:text-sm text-gray-600">
              <span className="font-medium">Price Range:</span>{' '}
              {currentRestaurant.priceRange ? (
                <span className="text-emerald-600 font-semibold">{currentRestaurant.priceRange}</span>
              ) : (
                <span className="text-gray-400 italic">Not provided</span>
              )}
            </span>
          </div>
          
          {currentRestaurant.reservationNeeded && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                <span className="font-medium">Reservation:</span> {currentRestaurant.reservationNeeded}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

