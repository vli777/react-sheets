import { useEffect } from 'react'
import './App.css'
import { SheetWithToolbar } from './components/SheetWithToolbar'
import { ThemeToggle } from './components/ThemeToggle'
import { useSheetStore } from './store/useSheetStore'
import { useThemeStore } from './store/useThemeStore'
import type { ApiResponse } from './types/api'
import mockData from './api/mockData.json'

interface AppProps {
  url?: string;
}

function App({ url = '/api/sheet' }: AppProps) {
  const loadApiData = useSheetStore((data) => data.initFromApi)
  const applyTheme = useThemeStore((state) => state.applyTheme)

  useEffect(() => {
    // Initialize theme
    applyTheme()
  }, [applyTheme])

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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0d1117]">
      <ThemeToggle />
      <div className="flex-1 flex items-center justify-center">
        <SheetWithToolbar />
      </div>
    </div>
  )
}

export default App
