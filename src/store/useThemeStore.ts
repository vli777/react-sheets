import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
  getCurrentTheme: () => 'light' | 'dark'
  isDark: () => boolean
  applyTheme: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      
      setTheme: (theme: Theme) => {
        set({ theme })
        get().applyTheme()
      },
      
      getCurrentTheme: (): 'light' | 'dark' => {
        const { theme } = get()
        return theme
      },
      
      isDark: (): boolean => {
        return get().getCurrentTheme() === 'dark'
      },
      
      applyTheme: () => {
        const currentTheme = get().getCurrentTheme()
        const root = document.documentElement
        
        if (currentTheme === 'dark') {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
)

// Initialize theme on app start
if (typeof window !== 'undefined') {
  const store = useThemeStore.getState()
  store.applyTheme()
  

} 