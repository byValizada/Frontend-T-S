import { useState, useEffect } from 'react'
import Login from './components/Login/Login'
import Dashboard from './components/Dashboard/Dashboard'
import SuperAdminPanel from './components/SuperAdminPanel/SuperAdminPanel'
import MuessiseAdminPanel from './components/MuessiseAdminPanel/MuessiseAdminPanel'
import BolmeAdminPanel from './components/BolmeAdminPanel/BolmeAdminPanel'
import ChatWidget from './components/shared/ChatWidget'
import type { User } from './services/dataService'

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [adminInDashboard, setAdminInDashboard] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('currentUser')
    if (saved) setCurrentUser(JSON.parse(saved))
  }, [])

  const handleLogin = (user: User) => {
    setCurrentUser(user)
    if (user.rol === 'Admin' || user.rol === 'BolmeAdmin') {
      setAdminInDashboard(true)
    } else {
      setAdminInDashboard(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    setCurrentUser(null)
    setAdminInDashboard(false)
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />
  }

  const renderPanel = () => {
    if (currentUser.rol === 'SuperAdmin') {
      return (
        <SuperAdminPanel
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )
    }

    if (currentUser.rol === 'Admin') {
      if (adminInDashboard) {
        return (
          <Dashboard
            currentUser={currentUser}
            onLogout={handleLogout}
            onGoToAdminPanel={() => setAdminInDashboard(false)}
          />
        )
      }
      return (
        <MuessiseAdminPanel
          currentUser={currentUser}
          onLogout={handleLogout}
          onGoToDashboard={() => setAdminInDashboard(true)}
        />
      )
    }

    if (currentUser.rol === 'BolmeAdmin') {
      if (adminInDashboard) {
        return (
          <Dashboard
            currentUser={currentUser}
            onLogout={handleLogout}
            onGoToAdminPanel={() => setAdminInDashboard(false)}
          />
        )
      }
      return (
        <BolmeAdminPanel
          currentUser={currentUser}
          onLogout={handleLogout}
          onGoToDashboard={() => setAdminInDashboard(true)}
        />
      )
    }

    return (
      <Dashboard
        currentUser={currentUser}
        onLogout={handleLogout}
        onGoToAdminPanel={() => {}}
      />
    )
  }

  // Dashboard açıq olanda ChatWidget Dashboard.tsx-in içindən render olunur
  // Admin panellərdə isə buradakı ChatWidget işləyir
  const isInDashboard =
    currentUser.rol === 'İşçi' ||
    currentUser.rol === 'Müavin' ||
    ((currentUser.rol === 'Admin' || currentUser.rol === 'BolmeAdmin') && adminInDashboard)

  return (
    <>
      {renderPanel()}
      {!isInDashboard && <ChatWidget currentUser={currentUser as any} />}
    </>
  )
}

export default App