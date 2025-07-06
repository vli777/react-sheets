import { useEffect, useState } from 'react'
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
    <>
      <div className="w-screen h-screen flex flex-col">
        <Sheet />
      </div>
    </>
  )
}

export default App
