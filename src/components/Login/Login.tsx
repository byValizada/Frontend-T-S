import { useState } from 'react'
import { FaUser, FaLock, FaEye, FaEyeSlash, FaTasks } from 'react-icons/fa'
import { isSuperAdmin } from '../../services/dataService'
import './Login.css'

interface LoginProps {
  onLogin: (user: User) => void
}

interface User {
  login: string
  parol: string
  rol: string
  adSoyad: string
  companyId?: string
  bolmeId?: string
}

function Login({ onLogin }: LoginProps) {
  const [login, setLogin] = useState('')
  const [parol, setParol] = useState('')
  const [xeta, setXeta] = useState('')
  const [showParol, setShowParol] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    if (!login.trim() || !parol.trim()) {
      setXeta('Login və parolu daxil edin')
      return
    }

    setLoading(true)

    setTimeout(() => {
      // Super Admin yoxlama
      if (isSuperAdmin(login)) {
        const superAdminParol = localStorage.getItem('superAdminParol') || 'Tural123@'
        if (parol === superAdminParol) {
          const user: User = {
            login: login,
            parol: parol,
            rol: 'SuperAdmin',
            adSoyad: 'Tural Vəlizadə'
          }
          localStorage.setItem('currentUser', JSON.stringify(user))
          onLogin(user)
          setLoading(false)
          return
        } else {
          setXeta('Parol yanlışdır')
          setLoading(false)
          return
        }
      }

      // Adi istifadəçi yoxlama
      const usersData = localStorage.getItem('users')
      if (!usersData) {
        setXeta('İstifadəçi tapılmadı')
        setLoading(false)
        return
      }

      const users: User[] = JSON.parse(usersData)
      const user = users.find(u => u.login === login && u.parol === parol)

      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user))
        onLogin(user)
      } else {
        setXeta('Login və ya parol yanlışdır')
      }
      setLoading(false)
    }, 400)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="login-page">
      <div className="login-bg-shapes">
        <div className="login-shape login-shape-1"></div>
        <div className="login-shape login-shape-2"></div>
        <div className="login-shape login-shape-3"></div>
      </div>

      <div className="login-box">
        <div className="login-header">
          <div className="login-icon-wrapper">
            <FaTasks className="login-icon" />
          </div>
          <h1 className="login-title">TİS</h1>
          <p className="login-subtitle">Tapşırıq İdarəetmə Sistemi</p>
        </div>

        <div className="login-form">
          <div className="input-group">
            <label>İstifadəçi adı</label>
            <div className="input-wrapper">
              <FaUser className="input-icon" />
              <input
                type="text"
                value={login}
                onChange={e => { setLogin(e.target.value); setXeta('') }}
                onKeyDown={handleKeyDown}
                placeholder="Login daxil edin"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="input-group">
            <label>Parol</label>
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input
                type={showParol ? 'text' : 'password'}
                value={parol}
                onChange={e => { setParol(e.target.value); setXeta('') }}
                onKeyDown={handleKeyDown}
                placeholder="Parol daxil edin"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-parol"
                onClick={() => setShowParol(!showParol)}
                tabIndex={-1}
              >
                {showParol ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {xeta && (
            <div className="error-message">
              <span className="error-dot"></span>
              {xeta}
            </div>
          )}

          <button
            className={`giris-btn ${loading ? 'loading' : ''}`}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loader"></span>
            ) : (
              <>Daxil ol</>
            )}
          </button>
        </div>

        <div className="login-footer">
          <p>© {new Date().getFullYear()} TİS — Bütün hüquqlar qorunur</p>
        </div>
      </div>
    </div>
  )
}

export default Login
