import RestaurantCard from './RestaurantCard'

export default function RestaurantList({ restaurants, onRestaurantClick }) {
  if (restaurants.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <p className="text-gray-500 text-base sm:text-lg">No restaurants match your filters.</p>
        <p className="text-gray-400 text-sm mt-2">Try adjusting your search criteria.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pb-24 sm:pb-8">
      {restaurants.map((group) => (
        <RestaurantCard
          key={group.id}
          restaurant={group}
          recommendations={group.recommendations}
          onClick={onRestaurantClick}
        />
      ))}
    </div>
  )
}

