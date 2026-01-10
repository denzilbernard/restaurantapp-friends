import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Simple admin password - in production, use proper authentication
const ADMIN_PASSWORD = 'admin123'

export default function AdminLoginButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300))

    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('adminAuthenticated', 'true')
      setIsOpen(false)
      setPassword('')
      navigate('/admin')
    } else {
      setError('Invalid password')
    }
    
    setIsLoading(false)
  }

  const handleClose = () => {
    setIsOpen(false)
    setError('')
    setPassword('')
  }

  return (
    <>
      {/* Admin Login Button - Top Right with safe area */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-3 sm:top-6 right-3 sm:right-6 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/80 hover:bg-white active:bg-gray-100 backdrop-blur-md text-gray-700 hover:text-gray-900 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-1.5 sm:gap-2 z-40 group border border-white/50 safe-area-top touch-target"
        aria-label="Admin login"
      >
        <svg 
          className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110 text-amber-600" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
          />
        </svg>
        <span className="text-xs sm:text-sm font-medium">Admin</span>
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={handleClose}
        >
          {/* Modal Content */}
          <div 
            className="glass-card rounded-t-2xl sm:rounded-3xl shadow-2xl max-w-md w-full"
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="heading-elegant text-base sm:text-lg font-semibold text-gray-800">Admin Access</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Enter your password to access the admin portal</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-3 sm:p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors touch-target flex-shrink-0"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 pb-6 sm:pb-6">
              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="admin-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-base touch-target"
                  placeholder="Enter admin password"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full py-3.5 sm:py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 active:from-amber-700 active:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 touch-target"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
