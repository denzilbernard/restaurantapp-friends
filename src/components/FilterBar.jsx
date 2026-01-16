import { useMemo } from 'react'
import { normalizeCity } from '../utils/cityNormalizer'
import { deduplicateSimilar, areSimilar } from '../utils/deduplicateSimilar'
import MultiSelect from './MultiSelect'

export default function FilterBar({ restaurants, filters, onFilterChange, onReset, filteredCount, totalCount }) {
  // Flatten grouped restaurants to get all individual recommendations
  const allRecommendations = useMemo(() => {
    return restaurants.flatMap(group => group.recommendations || [group])
  }, [restaurants])

  // Extract unique values for each filter
  const cities = useMemo(() => {
    // Normalize cities before extracting unique values
    const normalizedCities = allRecommendations.map(r => {
      // Always normalize the city value
      const normalized = normalizeCity(r.city)
      return normalized ? normalized.trim() : null
    }).filter(Boolean)
    
    // Use a Set for simple deduplication - normalization ensures consistent values
    const uniqueCities = [...new Set(normalizedCities)].sort()
    
    return uniqueCities
  }, [allRecommendations])

  const neighborhoods = useMemo(() => {
    // Filter recommendations by selected cities if city filters are active
    const normalizedCityFilters = filters.city && filters.city.length > 0
      ? filters.city.map(city => normalizeCity(city)).filter(Boolean)
      : []
    let filteredRecommendations = normalizedCityFilters.length > 0
      ? allRecommendations.filter(r => {
          const normalizedRestaurantCity = normalizeCity(r.city)
          return normalizedRestaurantCity && normalizedCityFilters.includes(normalizedRestaurantCity)
        })
      : allRecommendations
    
    // Further filter by selected cuisine types if any
    if (filters.cuisineType && filters.cuisineType.length > 0) {
      filteredRecommendations = filteredRecommendations.filter(r => {
        if (!r.cuisineType) return false
        const restaurantCuisines = r.cuisineType.split(/[,/]/).map(c => c.trim()).filter(Boolean)
        // Use areSimilar for matching to handle deduplicated values and case differences
        return filters.cuisineType.some(selectedCuisine => {
          if (!selectedCuisine) return false
          return restaurantCuisines.some(restaurantCuisine => {
            // First try exact match (case-insensitive)
            if (selectedCuisine.toLowerCase() === restaurantCuisine.toLowerCase()) {
              return true
            }
            // Then try similarity matching for typos/variations
            return areSimilar(selectedCuisine, restaurantCuisine)
          })
        })
      })
    }
    
    // Extract all individual neighborhoods from comma or slash-separated values
    const allNeighborhoods = filteredRecommendations
      .map(r => r.neighborhood)
      .filter(Boolean)
      .flatMap(neighborhood => {
        // Split by comma or slash and trim each neighborhood
        return neighborhood.split(/[,/]/).map(n => n.trim()).filter(Boolean)
      })
    // Deduplicate similar entries (e.g., "SoHo" vs "Soho")
    return deduplicateSimilar(allNeighborhoods)
  }, [allRecommendations, filters.city, filters.cuisineType])

  const cuisineTypes = useMemo(() => {
    // Filter recommendations by selected cities if city filters are active
    const normalizedCityFilters = filters.city && filters.city.length > 0
      ? filters.city.map(city => normalizeCity(city)).filter(Boolean)
      : []
    let filteredRecommendations = normalizedCityFilters.length > 0
      ? allRecommendations.filter(r => {
          const normalizedRestaurantCity = normalizeCity(r.city)
          return normalizedRestaurantCity && normalizedCityFilters.includes(normalizedRestaurantCity)
        })
      : allRecommendations
    
    // Further filter by selected neighborhoods if any
    if (filters.neighborhood && filters.neighborhood.length > 0) {
      filteredRecommendations = filteredRecommendations.filter(r => {
        if (!r.neighborhood) return false
        const restaurantNeighborhoods = r.neighborhood.split(/[,/]/).map(n => n.trim()).filter(Boolean)
        // Use areSimilar for matching to handle deduplicated values and case differences
        return filters.neighborhood.some(selectedNeighborhood => {
          if (!selectedNeighborhood) return false
          return restaurantNeighborhoods.some(restaurantNeighborhood => {
            // First try exact match (case-insensitive)
            if (selectedNeighborhood.toLowerCase() === restaurantNeighborhood.toLowerCase()) {
              return true
            }
            // Then try similarity matching for typos/variations
            return areSimilar(selectedNeighborhood, restaurantNeighborhood)
          })
        })
      })
    }
    
    // Extract all individual cuisine types from comma or slash-separated values
    const allCuisineTypes = filteredRecommendations
      .map(r => r.cuisineType)
      .filter(Boolean)
      .flatMap(cuisineType => {
        // Split by comma or slash and trim each type
        return cuisineType.split(/[,/]/).map(type => type.trim()).filter(Boolean)
      })
    // Deduplicate similar entries (e.g., "Italian" vs "Itallian")
    return deduplicateSimilar(allCuisineTypes)
  }, [allRecommendations, filters.city, filters.neighborhood])

  const restaurantNames = useMemo(() => {
    // Filter restaurants by selected cities if city filters are active
    const normalizedCityFilters = filters.city && filters.city.length > 0
      ? filters.city.map(city => normalizeCity(city)).filter(Boolean)
      : []
    const filteredRestaurants = normalizedCityFilters.length > 0
      ? restaurants.filter(group => 
          group.recommendations.some(r => {
            const normalizedRestaurantCity = normalizeCity(r.city)
            return normalizedRestaurantCity && normalizedCityFilters.includes(normalizedRestaurantCity)
          })
        )
      : restaurants
    
    // Use group names (which are already unique)
    return filteredRestaurants.map(r => r.name).sort()
  }, [restaurants, filters.city])

  // The four exact reservation options from the CSV spreadsheet
  const ALL_RESERVATION_OPTIONS = [
    'Walk-in only/no reservations',
    'Just pull up!',
    'Not required, but recommended',
    'Yes, required'
  ]

  const reservationOptions = useMemo(() => {
    // Filter recommendations by selected cities if city filters are active
    const normalizedCityFilters = filters.city && filters.city.length > 0
      ? filters.city.map(city => normalizeCity(city)).filter(Boolean)
      : []
    const filteredRecommendations = normalizedCityFilters.length > 0
      ? allRecommendations.filter(r => {
          const normalizedRestaurantCity = normalizeCity(r.city)
          return normalizedRestaurantCity && normalizedCityFilters.includes(normalizedRestaurantCity)
        })
      : allRecommendations
    
    // Get unique reservation values that exist in the filtered recommendations
    const existingValues = new Set(filteredRecommendations.map(r => r.reservationNeeded).filter(Boolean))
    
    // Return only the four standard options that exist in the filtered data
    // If no city filter is active, show all four options
    return normalizedCityFilters.length > 0
      ? ALL_RESERVATION_OPTIONS.filter(option => existingValues.has(option))
      : ALL_RESERVATION_OPTIONS
  }, [allRecommendations, filters.city])

  const priceRanges = useMemo(() => {
    // Filter recommendations by selected cities if city filters are active
    const normalizedCityFilters = filters.city && filters.city.length > 0
      ? filters.city.map(city => normalizeCity(city)).filter(Boolean)
      : []
    let filteredRecommendations = normalizedCityFilters.length > 0
      ? allRecommendations.filter(r => {
          const normalizedRestaurantCity = normalizeCity(r.city)
          return normalizedRestaurantCity && normalizedCityFilters.includes(normalizedRestaurantCity)
        })
      : allRecommendations
    
    // Further filter by selected cuisine types if any
    if (filters.cuisineType && filters.cuisineType.length > 0) {
      filteredRecommendations = filteredRecommendations.filter(r => {
        if (!r.cuisineType) return false
        const restaurantCuisines = r.cuisineType.split(/[,/]/).map(c => c.trim()).filter(Boolean)
        return filters.cuisineType.some(selectedCuisine => {
          if (!selectedCuisine) return false
          return restaurantCuisines.some(restaurantCuisine => {
            if (selectedCuisine.toLowerCase() === restaurantCuisine.toLowerCase()) {
              return true
            }
            return areSimilar(selectedCuisine, restaurantCuisine)
          })
        })
      })
    }
    
    // Further filter by selected neighborhoods if any
    if (filters.neighborhood && filters.neighborhood.length > 0) {
      filteredRecommendations = filteredRecommendations.filter(r => {
        if (!r.neighborhood) return false
        const restaurantNeighborhoods = r.neighborhood.split(/[,/]/).map(n => n.trim()).filter(Boolean)
        return filters.neighborhood.some(selectedNeighborhood => {
          if (!selectedNeighborhood) return false
          return restaurantNeighborhoods.some(restaurantNeighborhood => {
            if (selectedNeighborhood.toLowerCase() === restaurantNeighborhood.toLowerCase()) {
              return true
            }
            return areSimilar(selectedNeighborhood, restaurantNeighborhood)
          })
        })
      })
    }
    
    // Extract unique price ranges
    const uniquePriceRanges = [...new Set(filteredRecommendations.map(r => r.priceRange).filter(Boolean))].sort()
    
    // Sort price ranges logically: $, $$, $$$, $$$$
    return uniquePriceRanges.sort((a, b) => {
      const aCount = (a.match(/\$/g) || []).length
      const bCount = (b.match(/\$/g) || []).length
      return aCount - bCount
    })
  }, [allRecommendations, filters.city, filters.cuisineType, filters.neighborhood])

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      (filters.name && filters.name !== '') ||
      (filters.city && filters.city.length > 0) ||
      (filters.neighborhood && filters.neighborhood.length > 0) ||
      (filters.cuisineType && filters.cuisineType.length > 0) ||
      (filters.reservationNeeded && filters.reservationNeeded !== '') ||
      (filters.priceRange && filters.priceRange.length > 0)
    )
  }, [filters])

  return (
    <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h2 className="heading-elegant text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
          <span className="text-xl sm:text-2xl">🔍</span>
          Find Your Perfect Spot
        </h2>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {hasActiveFilters && onReset && (
            <button
              onClick={onReset}
              className="glass-card px-3 sm:px-4 py-2 sm:py-2.5 rounded-full shrink-0 text-sm sm:text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-white/90 transition-all border border-white/50 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 touch-target"
              aria-label="Reset all filters"
            >
              Reset Filters
            </button>
          )}
          {filteredCount !== undefined && totalCount !== undefined && (
            <div className="glass-card inline-block px-3 sm:px-5 py-2 sm:py-2.5 rounded-full shrink-0 self-start sm:self-auto text-sm sm:text-base">
              <span className="text-gray-600">Showing </span>
              <span className="text-amber-600 font-bold">{filteredCount}</span>
              <span className="text-gray-600"> of </span>
              <span className="text-amber-600 font-bold">{totalCount}</span>
              <span className="text-gray-600 hidden xs:inline"> restaurants</span>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-5 relative">
        {/* City Filter - Multi-select */}
        <div>
          <MultiSelect
            id="city-filter"
            label="City"
            options={cities}
            selectedValues={filters.city || []}
            onChange={(values) => onFilterChange('city', values)}
            placeholder="All Cities"
          />
        </div>

        {/* Restaurant Name Filter */}
        <div>
          <label htmlFor="name-filter" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2">
            Restaurant Name
          </label>
          <select
            id="name-filter"
            value={filters.name || ''}
            onChange={(e) => onFilterChange('name', e.target.value)}
            className="w-full px-3 sm:px-4 py-3 sm:py-2.5 border border-white/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white/70 backdrop-blur-sm text-gray-700 transition-all hover:bg-white/90 text-base touch-target"
          >
            <option value="">All Restaurants</option>
            {restaurantNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Neighborhood Filter */}
        <div>
          <MultiSelect
            id="neighborhood-filter"
            label="Neighborhood"
            options={neighborhoods}
            selectedValues={filters.neighborhood || []}
            onChange={(values) => onFilterChange('neighborhood', values)}
            placeholder="All Neighborhoods"
          />
        </div>

        {/* Cuisine Type Filter */}
        <div>
          <MultiSelect
            id="cuisine-filter"
            label="Cuisine Type"
            options={cuisineTypes}
            selectedValues={filters.cuisineType || []}
            onChange={(values) => onFilterChange('cuisineType', values)}
            placeholder="All Cuisines"
          />
        </div>

        {/* Price Range Filter - Multi-select */}
        <div>
          <MultiSelect
            id="price-range-filter"
            label="Price Range"
            options={priceRanges}
            selectedValues={filters.priceRange || []}
            onChange={(values) => onFilterChange('priceRange', values)}
            placeholder="All Prices"
          />
        </div>


        {/* Reservation Needed Filter */}
        <div>
          <label htmlFor="reservation-filter" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2">
            Reservation Needed
          </label>
          <select
            id="reservation-filter"
            value={filters.reservationNeeded || ''}
            onChange={(e) => onFilterChange('reservationNeeded', e.target.value)}
            className="w-full px-3 sm:px-4 py-3 sm:py-2.5 border border-white/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white/70 backdrop-blur-sm text-gray-700 transition-all hover:bg-white/90 text-base touch-target"
          >
            <option value="">All</option>
            {reservationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

      </div>
    </div>
  )
}

