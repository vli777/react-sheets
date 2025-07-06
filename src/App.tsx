import { useEffect } from 'react'
import './App.css'
import { SheetWithToolbar } from './components/SheetWithToolbar'
import { useSheetStore } from './store/useSheetStore'
import type { ApiResponse } from './types/api'
import mockData from './api/mockData.json'

function App() {
  const loadApiData = useSheetStore((data) => data.initFromApi)

  useEffect(() => {
    loadApiData(mockData as ApiResponse)
  }, [loadApiData])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SheetWithToolbar />
    </div>
  )
}

export default App
