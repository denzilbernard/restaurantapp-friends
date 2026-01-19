export default function CuisineWarningModal({ isOpen, onClose, city, missingCuisines }) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 sm:p-4 safe-area-bottom"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div 
        className="glass-card rounded-t-2xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-y-auto overscroll-contain modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg 
                className="w-5 h-5 text-amber-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
            <div>
              <h2 className="heading-elegant text-base sm:text-lg font-semibold text-gray-800">Cuisine Warning</h2>
              <p className="text-xs sm:text-sm text-gray-500">Selected cuisines may not be available</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 sm:p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors touch-target flex-shrink-0"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            You have selected cuisine type(s) that may not be available in <span className="font-semibold text-amber-600">{city}</span>.
          </p>
          
          {missingCuisines && missingCuisines.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">Selected cuisines that may not be available:</p>
              <ul className="list-disc list-inside space-y-1">
                {missingCuisines.map((cuisine, index) => (
                  <li key={index} className="text-sm text-gray-600">{cuisine}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-sm text-gray-600 mb-4">
            Your cuisine selections have been maintained, but you may see fewer or no results. Consider clearing the cuisine filter to see all available options in this city.
          </p>

          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm hover:shadow-md touch-target"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
