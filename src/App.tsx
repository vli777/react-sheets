import { useEffect } from 'react'
import './App.css'
import { Sheet } from './components/Sheet'
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
      <div className="p-4 m-4 bg-white rounded-lg shadow-lg flex flex-col items-center">
        <Sheet />
      </div>
    </div>
  )
}

export default App
