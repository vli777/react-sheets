import React from 'react'
import { useThemeStore } from '../store/useThemeStore'

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, getCurrentTheme } = useThemeStore()
  const currentTheme = getCurrentTheme()

  return (
    <div className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-[#161b22] border-b border-gray-200 dark:border-[#30363d]">
      <span className="text-sm text-gray-600 dark:text-[#8b949e]">Theme:</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
        className="px-2 py-1 text-sm bg-white dark:bg-[#21262d] border border-gray-300 dark:border-[#30363d] rounded text-gray-900 dark:text-[#c9d1d9]"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <span className="text-xs text-gray-500 dark:text-[#8b949e]">
        ({currentTheme})
      </span>
    </div>
  )
} 