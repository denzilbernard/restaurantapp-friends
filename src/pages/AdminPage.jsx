import { useState, useEffect } from 'react'
import AdminLogin from '../components/AdminLogin'
import AdminUpload from '../components/AdminUpload'
import SupportInbox from '../components/SupportInbox'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upload') // 'upload' or 'inbox'
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Check if already authenticated
    const authenticated = sessionStorage.getItem('adminAuthenticated') === 'true'
    setIsAuthenticated(authenticated)
    setIsLoading(false)
  }, [])

  // Count unread messages for the badge
  useEffect(() => {
    if (isAuthenticated) {
      const updateUnreadCount = () => {
        const messages = JSON.parse(localStorage.getItem('supportMessages') || '[]')
        const unread = messages.filter(msg => !msg.read).length
        setUnreadCount(unread)
      }
      
      updateUnreadCount()
      
      // Listen for storage changes (in case messages are added from another tab)
      window.addEventListener('storage', updateUnreadCount)
      
      // Also set up an interval to check for updates
      const interval = setInterval(updateUnreadCount, 5000)
      
      return () => {
        window.removeEventListener('storage', updateUnreadCount)
        clearInterval(interval)
      }
    }
  }, [isAuthenticated])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Tab Navigation */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-4 font-medium transition-colors relative ${
                activeTab === 'upload'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Data
              </div>
              {activeTab === 'upload' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('inbox')}
              className={`px-6 py-4 font-medium transition-colors relative ${
                activeTab === 'inbox'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                Support Inbox
                {unreadCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-amber-500 text-amber-900 text-xs font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              {activeTab === 'inbox' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'upload' ? <AdminUpload /> : <SupportInbox />}
    </div>
  )
}
