import { useState, useEffect } from 'react'
import { FaSun, FaMoon } from 'react-icons/fa'
import './ThemeToggle.css'

function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    // 1. LocalStorage-dən yoxla
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved

    // 2. Brauzer parametrinə bax
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light'

    // 3. Default dark
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
    <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Açıq rejim' : 'Tünd rejim'}>
      {theme === 'dark' ? <FaSun /> : <FaMoon />}
    </button>
  )
}

export default ThemeToggle