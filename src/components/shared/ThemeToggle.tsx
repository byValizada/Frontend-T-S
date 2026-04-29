import { useEffect, useState } from 'react'
import Switch from '@mui/material/Switch'

function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light'
    return 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <Switch
      checked={theme === 'light'}
      onChange={toggleTheme}
      title={theme === 'dark' ? 'Açıq rejim' : 'Tünd rejim'}
    />
  )
}

export default ThemeToggle