import { useState, useEffect } from 'react'

export default function SupportInbox() {
  const [messages, setMessages] = useState([])
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [filter, setFilter] = useState('all') // 'all', 'unread', 'read'

  // Load messages from localStorage
  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = () => {
    const storedMessages = JSON.parse(localStorage.getItem('supportMessages') || '[]')
    setMessages(storedMessages)
  }

  // Format date for display
  const formatDate = (isoString) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Mark message as read
  const markAsRead = (messageId) => {
    const updatedMessages = messages.map(msg => 
      msg.id === messageId ? { ...msg, read: true } : msg
    )
    setMessages(updatedMessages)
    localStorage.setItem('supportMessages', JSON.stringify(updatedMessages))
  }

  // Mark message as unread
  const markAsUnread = (messageId) => {
    const updatedMessages = messages.map(msg => 
      msg.id === messageId ? { ...msg, read: false } : msg
    )
    setMessages(updatedMessages)
    localStorage.setItem('supportMessages', JSON.stringify(updatedMessages))
  }

  // Delete message
  const deleteMessage = (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return
    
    const updatedMessages = messages.filter(msg => msg.id !== messageId)
    setMessages(updatedMessages)
    localStorage.setItem('supportMessages', JSON.stringify(updatedMessages))
    
    if (selectedMessage?.id === messageId) {
      setSelectedMessage(null)
    }
  }

  // Delete all messages
  const deleteAllMessages = () => {
    if (!window.confirm('Are you sure you want to delete ALL messages? This cannot be undone.')) return
    
    setMessages([])
    setSelectedMessage(null)
    localStorage.setItem('supportMessages', JSON.stringify([]))
  }

  // Handle message selection
  const handleSelectMessage = (message) => {
    setSelectedMessage(message)
    if (!message.read) {
      markAsRead(message.id)
    }
  }

  // Filter messages
  const filteredMessages = messages.filter(msg => {
    if (filter === 'unread') return !msg.read
    if (filter === 'read') return msg.read
    return true
  })

  // Count unread messages
  const unreadCount = messages.filter(msg => !msg.read).length

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Support Inbox
            </h1>
            <p className="text-slate-400">
              View and manage user feedback and questions
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
              onClick={() => {
                sessionStorage.removeItem('adminAuthenticated')
                window.location.href = '/admin'
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Total Messages</p>
            <p className="text-2xl font-bold text-white">{messages.length}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Unread</p>
            <p className="text-2xl font-bold text-amber-400">{unreadCount}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Read</p>
            <p className="text-2xl font-bold text-emerald-400">{messages.length - unreadCount}</p>
          </div>
        </div>

        {/* Filter Tabs & Actions */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              All ({messages.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'read'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Read ({messages.length - unreadCount})
            </button>
          </div>
          {messages.length > 0 && (
            <button
              onClick={deleteAllMessages}
              className="px-4 py-2 bg-red-600/80 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete All
            </button>
          )}
        </div>

        {/* Main Content */}
        {messages.length === 0 ? (
          <div className="bg-slate-800/50 rounded-xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700 rounded-full mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Messages Yet</h3>
            <p className="text-slate-400">
              When users submit feedback through the support button, their messages will appear here.
            </p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="bg-slate-800/50 rounded-xl p-12 text-center">
            <p className="text-slate-400">No {filter} messages</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Message List */}
            <div className="bg-slate-800 rounded-xl overflow-hidden">
              <div className="divide-y divide-slate-700 max-h-[600px] overflow-y-auto">
                {filteredMessages.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={`w-full text-left p-4 hover:bg-slate-700/50 transition-colors ${
                      selectedMessage?.id === message.id ? 'bg-slate-700/70' : ''
                    } ${!message.read ? 'border-l-4 border-amber-500' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${!message.read ? 'text-white' : 'text-slate-300'}`}>
                          {message.name}
                        </span>
                        {!message.read && (
                          <span className="px-2 py-0.5 bg-amber-500 text-amber-900 text-xs font-medium rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(message.submittedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-1 truncate">
                      {message.email}
                    </p>
                    <p className="text-sm text-slate-500 line-clamp-2">
                      {message.message}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Detail */}
            <div className="bg-slate-800 rounded-xl overflow-hidden">
              {selectedMessage ? (
                <div className="h-full flex flex-col">
                  {/* Detail Header */}
                  <div className="p-4 border-b border-slate-700">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {selectedMessage.name}
                        </h3>
                        <a 
                          href={`mailto:${selectedMessage.email}`}
                          className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
                        >
                          {selectedMessage.email}
                        </a>
                      </div>
                      <div className="flex gap-2">
                        {selectedMessage.read ? (
                          <button
                            onClick={() => markAsUnread(selectedMessage.id)}
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                            title="Mark as unread"
                          >
                            <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => markAsRead(selectedMessage.id)}
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => deleteMessage(selectedMessage.id)}
                          className="p-2 bg-red-600/50 hover:bg-red-600 rounded-lg transition-colors"
                          title="Delete message"
                        >
                          <svg className="w-5 h-5 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="px-4 py-3 bg-slate-700/30 border-b border-slate-700">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        Submitted on {new Date(selectedMessage.submittedAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedMessage.message}
                    </p>
                  </div>

                  {/* Reply Action */}
                  <div className="p-4 border-t border-slate-700">
                    <a
                      href={`mailto:${selectedMessage.email}?subject=Re: Your feedback on Restaurant Recommendations`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Reply via Email
                    </a>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-8">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <p className="text-slate-500">Select a message to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
