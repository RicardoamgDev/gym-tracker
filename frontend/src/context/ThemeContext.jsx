import { createContext, useContext, useEffect, useState } from 'react'

const ThemeCtx = createContext(null)

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    localStorage.setItem('theme', mode)
    document.documentElement.style.colorScheme = mode
  }, [mode])

  const toggle = () => setMode(m => (m === 'light' ? 'dark' : 'light'))

  return (
    <ThemeCtx.Provider value={{ mode, setMode, toggle, isDark: mode === 'dark' }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export const useThemeMode = () => useContext(ThemeCtx)
