import { useState, useMemo } from 'react'
import { useSheetData } from './hooks/useSheetData'
import FilterBar from './components/FilterBar'
import RestaurantList from './components/RestaurantList'
import DetailModal from './components/DetailModal'
import SupportButton from './components/SupportButton'
import AdminLoginButton from './components/AdminLoginButton'
import { normalizeCity } from './utils/cityNormalizer'
import { groupRestaurantsByName } from './utils/restaurantGrouper'
import { areSimilar } from './utils/deduplicateSimilar'

// Helper function to get the first alphabetical cuisine type from a restaurant group
function getFirstAlphabeticalCuisineType(group) {
    const allCuisineTypes = []
    
    // Collect all cuisine types from all recommendations in the group
    group.recommendations.forEach((restaurant) => {
      if (restaurant.cuisineType) {
        const cuisineTypes = restaurant.cuisineType
          .split(/[,/]/)
          .map(type => type.trim())
          .filter(type => type.length > 0)
        allCuisineTypes.push(...cuisineTypes)
      }
    })
    
    // If no cuisine types found, return empty string (will sort to the end)
    if (allCuisineTypes.length === 0) {
      return ''
    }
    
    // Sort alphabetically and return the first one
    return allCuisineTypes.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))[0]
}

function App() {
  const { data: restaurants, loading, error } = useSheetData()
  const [filters, setFilters] = useState({
    name: '',
    city: '',
    neighborhood: [],
    cuisineType: [],
    reservationNeeded: '',
  })
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Group restaurants by name first
  const groupedRestaurants = useMemo(() => {
    return groupRestaurantsByName(restaurants)
  }, [restaurants])

  // Filter restaurants based on current filters
  const filteredRestaurants = useMemo(() => {
    const normalizedCityFilter = filters.city ? normalizeCity(filters.city) : ''
    
    const filtered = groupedRestaurants.filter((group) => {
      // Check if any recommendation in the group matches the filters
      return group.recommendations.some((restaurant) => {
        if (filters.name && restaurant.name !== filters.name) return false
        // Normalize restaurant city for comparison to ensure consistency
        if (normalizedCityFilter) {
          const normalizedRestaurantCity = normalizeCity(restaurant.city)
          if (normalizedRestaurantCity !== normalizedCityFilter) return false
        }
        
        // Handle multi-select neighborhood filter
        if (filters.neighborhood && filters.neighborhood.length > 0) {
          // Split neighborhoods by comma or slash and check if any matches the selected filters
          const restaurantNeighborhoods = restaurant.neighborhood
            ? restaurant.neighborhood.split(/[,/]/).map(n => n.trim())
            : []
          // Check if any of the selected neighborhoods match any of the restaurant's neighborhoods
          // Use similarity matching to handle deduplicated values
          const hasMatchingNeighborhood = filters.neighborhood.some(selectedNeighborhood =>
            restaurantNeighborhoods.some(restaurantNeighborhood =>
              selectedNeighborhood === restaurantNeighborhood || areSimilar(selectedNeighborhood, restaurantNeighborhood)
            )
          )
          if (!hasMatchingNeighborhood) return false
        }
        
        // Handle multi-select cuisine type filter
        if (filters.cuisineType && filters.cuisineType.length > 0) {
          // Split cuisine types by comma or slash and check if any matches the selected filters
          const restaurantCuisineTypes = restaurant.cuisineType
            ? restaurant.cuisineType.split(/[,/]/).map(type => type.trim())
            : []
          // Check if any of the selected cuisine types match any of the restaurant's cuisine types
          // Use similarity matching to handle deduplicated values
          const hasMatchingCuisine = filters.cuisineType.some(selectedCuisine =>
            restaurantCuisineTypes.some(restaurantCuisine =>
              selectedCuisine === restaurantCuisine || areSimilar(selectedCuisine, restaurantCuisine)
            )
          )
          if (!hasMatchingCuisine) return false
        }
        
        if (filters.reservationNeeded && restaurant.reservationNeeded !== filters.reservationNeeded) return false
        return true
      })
    })
    
    // Sort alphabetically by cuisine type
    return filtered.sort((a, b) => {
      const cuisineA = getFirstAlphabeticalCuisineType(a)
      const cuisineB = getFirstAlphabeticalCuisineType(b)
      return cuisineA.localeCompare(cuisineB, undefined, { sensitivity: 'base' })
    })
  }, [groupedRestaurants, filters])

  // Get neighborhoods available for a specific city
  const getNeighborhoodsForCity = (cityFilter) => {
    const normalizedCityFilter = cityFilter ? normalizeCity(cityFilter) : ''
    const allRecommendations = groupedRestaurants.flatMap(group => group.recommendations || [group])
    
    if (!normalizedCityFilter) return []
    
    const filteredRecommendations = allRecommendations.filter(r => 
      normalizeCity(r.city) === normalizedCityFilter
    )
    
    const neighborhoods = new Set()
    filteredRecommendations.forEach(r => {
      if (r.neighborhood) {
        r.neighborhood.split(/[,/]/).map(n => n.trim()).filter(Boolean).forEach(n => {
          neighborhoods.add(n.toLowerCase())
        })
      }
    })
    return neighborhoods
  }

  // Get cuisine types available for a specific city and/or neighborhoods
  const getCuisinesForCityAndNeighborhoods = (cityFilter, selectedNeighborhoods = []) => {
    const normalizedCityFilter = cityFilter ? normalizeCity(cityFilter) : ''
    const allRecommendations = groupedRestaurants.flatMap(group => group.recommendations || [group])
    
    // Start with all recommendations
    let filteredRecommendations = allRecommendations
    
    // Filter by city if specified
    if (normalizedCityFilter) {
      filteredRecommendations = filteredRecommendations.filter(r => 
        normalizeCity(r.city) === normalizedCityFilter
      )
    }
    
    // Further filter by neighborhoods if any are selected
    if (selectedNeighborhoods && selectedNeighborhoods.length > 0) {
      const selectedNeighborhoodsLower = selectedNeighborhoods.map(n => n.toLowerCase())
      filteredRecommendations = filteredRecommendations.filter(r => {
        if (!r.neighborhood) return false
        const restaurantNeighborhoods = r.neighborhood.split(/[,/]/).map(n => n.trim().toLowerCase())
        return restaurantNeighborhoods.some(n => selectedNeighborhoodsLower.includes(n))
      })
    }
    
    const cuisines = new Set()
    filteredRecommendations.forEach(r => {
      if (r.cuisineType) {
        r.cuisineType.split(/[,/]/).map(type => type.trim()).filter(Boolean).forEach(type => {
          cuisines.add(type.toLowerCase())
        })
      }
    })
    return cuisines
  }

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [filterType]: value }
      
      // When city changes, clear downstream filters that are no longer valid
      if (filterType === 'city') {
        if (value) {
          // Clear neighborhood selections that don't exist in the new city
          const validNeighborhoods = getNeighborhoodsForCity(value)
          const filteredNeighborhoods = (prev.neighborhood || []).filter(n => 
            validNeighborhoods.has(n.toLowerCase())
          )
          newFilters.neighborhood = filteredNeighborhoods
          
          // Clear cuisine type selections that don't exist in the new city (considering filtered neighborhoods)
          const validCuisines = getCuisinesForCityAndNeighborhoods(value, filteredNeighborhoods)
          const filteredCuisines = (prev.cuisineType || []).filter(c => 
            validCuisines.has(c.toLowerCase())
          )
          newFilters.cuisineType = filteredCuisines
        }
        // When city is cleared (All Cities), keep all selections as they may still be valid
      }
      
      // When neighborhoods change, clear cuisine type selections that are no longer valid
      if (filterType === 'neighborhood') {
        if (value && value.length > 0) {
          // Get cuisines available for the current city + new neighborhoods
          const validCuisines = getCuisinesForCityAndNeighborhoods(prev.city, value)
          const filteredCuisines = (prev.cuisineType || []).filter(c => 
            validCuisines.has(c.toLowerCase())
          )
          newFilters.cuisineType = filteredCuisines
        }
        // When neighborhoods are cleared, cuisines cascade back to city-level
      }
      
      return newFilters
    })
  }

  const handleRestaurantClick = (restaurant) => {
    setSelectedRestaurant(restaurant)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRestaurant(null)
  }

  return (
    <div className="min-h-screen landscape-bg">
      {/* Decorative sun glow */}
      <div className="sun-glow"></div>
      
      {/* Decorative birds */}
      <div className="birds">🕊️</div>
      
      {/* Main content layer */}
      <div className="content-layer">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
          {/* Glassmorphic header - responsive padding */}
          <header className="glass-header rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-10 mt-14 sm:mt-0">
            {/* Decorative element */}
            <div className="mb-2 sm:mb-4 flex items-center gap-2 sm:gap-3">
              <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
              <span className="text-amber-600 text-xs sm:text-sm font-medium tracking-wider uppercase">Curated Recommendations</span>
            </div>
            
            {/* Main heading with elegant font - responsive sizing */}
            <h1 className="heading-elegant text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-2 sm:mb-4 leading-tight">
              Local Eats <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500">&</span> Treats
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl leading-relaxed">
              Discover amazing restaurants and hidden gems recommended by friends, and share the love!
            </p>
          </header>

          {loading && (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600"></div>
              <p className="mt-4 text-gray-600 font-medium">Finding delicious places...</p>
            </div>
          )}

          {error && (
            <div className="glass-card rounded-2xl p-6 mb-6 border-l-4 border-l-red-400">
              <p className="text-red-800 font-semibold">Error loading data</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <p className="text-red-500 text-sm mt-2">
                Make sure your Google Sheet is published and the CSV URL is correct in useSheetData.js
              </p>
            </div>
          )}

          {!loading && !error && (
            <>
              <FilterBar
                restaurants={groupedRestaurants}
                filters={filters}
                onFilterChange={handleFilterChange}
                filteredCount={filteredRestaurants.length}
                totalCount={groupedRestaurants.length}
              />

              <RestaurantList
                restaurants={filteredRestaurants}
                onRestaurantClick={handleRestaurantClick}
              />
            </>
          )}

          <DetailModal
            restaurant={selectedRestaurant}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
          />
        </div>
      </div>

      {/* Floating Support Button */}
      <SupportButton />

      {/* Admin Login Button - Top Right */}
      <AdminLoginButton />
    </div>
  )
}

export default App

