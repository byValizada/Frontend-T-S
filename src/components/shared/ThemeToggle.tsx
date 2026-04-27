import { useState, useEffect } from 'react'
import './ThemeToggle.css'

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
    <div
      className={`theme-switch ${theme === 'light' ? 'light' : ''}`}
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Açıq rejim' : 'Tünd rejim'}
    >
      <div className="theme-switch-thumb" />
    </div>
  )
}

export default ThemeToggle