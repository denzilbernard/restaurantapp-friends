import { useState, useRef, useEffect } from 'react'

export default function MultiSelect({ 
  label, 
  options, 
  selectedValues = [], 
  onChange, 
  placeholder = 'Select options...',
  id 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleToggle = (value) => {
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value]
    onChange(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onChange([])
    } else {
      onChange([...options])
    }
  }

  const displayText = selectedValues.length === 0 
    ? placeholder 
    : selectedValues.length === 1
    ? selectedValues[0]
    : `${selectedValues.length} selected`

  return (
    <div className="relative" ref={dropdownRef}>
      <label htmlFor={id} className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 sm:px-4 py-3 sm:py-2.5 text-left border border-white/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white/70 backdrop-blur-sm flex items-center justify-between transition-all hover:bg-white/90 text-base touch-target"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={`truncate ${selectedValues.length === 0 ? 'text-gray-500' : 'text-gray-900'}`}>
          {displayText}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-[9999] w-full mt-1 bg-white/95 backdrop-blur-md border border-white/50 rounded-xl shadow-lg max-h-60 overflow-auto overscroll-contain">
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-amber-600 hover:text-amber-700 font-semibold w-full text-left px-3 py-2.5 rounded-lg hover:bg-amber-50 transition-colors touch-target"
            >
              {selectedValues.length === options.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div role="listbox" className="p-1">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option)
              return (
                <label
                  key={option}
                  role="option"
                  className={`flex items-center px-3 py-3 sm:py-2 cursor-pointer hover:bg-amber-50 active:bg-amber-100 rounded-lg transition-colors touch-target ${
                    isSelected ? 'bg-amber-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(option)}
                    className="h-5 w-5 sm:h-4 sm:w-4 text-amber-600 focus:ring-amber-400 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700 font-medium">{option}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
