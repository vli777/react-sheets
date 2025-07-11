import { useEffect } from 'react'
import './App.css'
import { SheetWithToolbar } from './components/SheetWithToolbar'
import { useSheetStore } from './store/useSheetStore'
import type { ApiResponse } from './types/api'
import mockData from './api/mockData.json'

interface AppProps {
  url?: string;
}

function App({ url = '/api/sheet' }: AppProps) {
  const loadApiData = useSheetStore((data) => data.initFromApi)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('API error')
        const data = (await response.json()) as ApiResponse
        loadApiData(data)
      } catch {
        loadApiData(mockData as ApiResponse)
      }
    }
    fetchData()
  }, [loadApiData, url])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SheetWithToolbar />
    </div>
  )
}

export default App
