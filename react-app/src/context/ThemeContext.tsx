import React, { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  dark: boolean
  toggleDark: () => void
}

const ThemeContext = createContext<ThemeContextType>({ dark: false, toggleDark: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('csk-theme') === 'dark' } catch { return false }
  })

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('csk-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('csk-theme', 'light')
    }
  }, [dark])

  const toggleDark = () => setDark(d => !d)

  return (
    <ThemeContext.Provider value={{ dark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

