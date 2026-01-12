import { useState, useEffect, useRef } from 'react'

export default function DataPreview() {
  const [data, setData] = useState([])
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const tableContainerRef = useRef(null)
  const headerRef = useRef(null)
  const bodyRef = useRef(null)

  useEffect(() => {
    // Load data from localStorage
    try {
      const storedData = localStorage.getItem('restaurantData')
      if (storedData) {
        const parsedData = JSON.parse(storedData)
        
        if (parsedData.length > 0) {
          // Extract all unique column names from the data
          const allColumns = new Set()
          parsedData.forEach(row => {
            Object.keys(row).forEach(key => {
              if (key !== 'id') {
                allColumns.add(key)
              }
            })
          })
          
          // Convert to array and sort for consistent display
          const columnArray = Array.from(allColumns).sort()
          setColumns(columnArray)
          setData(parsedData)
        } else {
          setError('No data found')
        }
      } else {
        setError('No data found. Please upload a CSV file first.')
      }
    } catch (err) {
      setError(`Error loading data: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  // Sync horizontal scroll between header and body
  useEffect(() => {
    const header = headerRef.current
    const body = bodyRef.current

    if (!header || !body) return

    const handleScroll = (e) => {
      if (e.target === body) {
        header.scrollLeft = body.scrollLeft
      } else {
        body.scrollLeft = header.scrollLeft
      }
    }

    header.addEventListener('scroll', handleScroll)
    body.addEventListener('scroll', handleScroll)

    return () => {
      header.removeEventListener('scroll', handleScroll)
      body.removeEventListener('scroll', handleScroll)
    }
  }, [data])

  const formatCellValue = (value) => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated')
    window.location.href = '/admin'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Preview Data
              </h1>
              <p className="text-slate-400">
                View uploaded CSV data in a spreadsheet format
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
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </header>

          <div className="bg-red-900/50 border border-red-700 rounded-lg p-6">
            <p className="text-red-300 font-medium mb-2">Error</p>
            <p className="text-red-200">{error}</p>
            <a
              href="/admin"
              className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Go to Upload Page
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Preview Data
            </h1>
            <p className="text-slate-400">
              {data.length} {data.length === 1 ? 'row' : 'rows'} • {columns.length} {columns.length === 1 ? 'column' : 'columns'}
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
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Spreadsheet Container */}
        <div
          ref={tableContainerRef}
          className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden"
          style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}
        >
          {/* Fixed Header */}
          <div
            ref={headerRef}
            className="bg-slate-700 border-b border-slate-600 overflow-x-auto overflow-y-hidden flex-shrink-0"
            style={{ maxHeight: '60px' }}
          >
            <div className="flex" style={{ minWidth: `${columns.length * 200}px` }}>
              {/* Row number column header */}
              <div
                className="bg-slate-600 border-r border-slate-500 px-4 py-3 text-slate-300 font-semibold text-sm sticky left-0 z-10 min-w-[80px] flex items-center justify-center"
                style={{ boxShadow: '2px 0 4px rgba(0,0,0,0.1)' }}
              >
                #
              </div>
              
              {/* Column headers */}
              {columns.map((col, idx) => (
                <div
                  key={col}
                  className="border-r border-slate-500 px-4 py-3 text-slate-200 font-semibold text-sm min-w-[200px] max-w-[300px]"
                  style={{ 
                    writingMode: 'horizontal-tb',
                    wordBreak: 'break-word'
                  }}
                  title={col}
                >
                  {col}
                </div>
              ))}
            </div>
          </div>

          {/* Scrollable Body */}
          <div
            ref={bodyRef}
            className="flex-1 overflow-auto"
            style={{ 
              scrollBehavior: 'smooth',
            }}
          >
            <div className="flex flex-col" style={{ minWidth: `${columns.length * 200}px` }}>
              {data.map((row, rowIndex) => (
                <div
                  key={row.id || rowIndex}
                  className={`flex border-b border-slate-700 hover:bg-slate-700/50 transition-colors ${
                    rowIndex % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'
                  }`}
                >
                  {/* Row number */}
                  <div
                    className="bg-slate-700/50 border-r border-slate-600 px-4 py-2 text-slate-400 text-sm font-mono sticky left-0 z-10 min-w-[80px] flex items-center justify-center"
                    style={{ boxShadow: '2px 0 4px rgba(0,0,0,0.1)' }}
                  >
                    {rowIndex + 1}
                  </div>
                  
                  {/* Data cells */}
                  {columns.map((col) => (
                    <div
                      key={col}
                      className="border-r border-slate-700 px-4 py-2 text-slate-300 text-sm min-w-[200px] max-w-[300px] break-words"
                      style={{
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'pre-wrap'
                      }}
                      title={formatCellValue(row[col])}
                    >
                      {formatCellValue(row[col]) || (
                        <span className="text-slate-500 italic">—</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Footer with scroll info */}
          <div className="bg-slate-700 border-t border-slate-600 px-4 py-2 flex justify-between items-center text-xs text-slate-400 flex-shrink-0">
            <div>
              Showing all {data.length} {data.length === 1 ? 'row' : 'rows'}
            </div>
            <div className="flex gap-4">
              <span>Scroll horizontally and vertically to view all data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
