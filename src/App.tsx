import { useState, useEffect } from 'react'
import Login from './components/Login/Login'
import Dashboard from './components/Dashboard/Dashboard'
import SuperAdminPanel from './components/SuperAdminPanel/SuperAdminPanel'
import MuessiseAdminPanel from './components/MuessiseAdminPanel/MuessiseAdminPanel'
import BolmeAdminPanel from './components/BolmeAdminPanel/BolmeAdminPanel'
import type { User } from './services/dataService'
function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('currentUser')
    if (saved) setCurrentUser(JSON.parse(saved))
  }, [])

  const handleLogin = (user: User) => {
    setCurrentUser(user)
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    setCurrentUser(null)
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />
  }

  if (currentUser.rol === 'SuperAdmin') {
    return (
      <SuperAdminPanel
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    )
  }

  if (currentUser.rol === 'Admin') {
    return (
      <MuessiseAdminPanel
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    )
  }

  if (currentUser.rol === 'BolmeAdmin') {
    return (
      <BolmeAdminPanel
        currentUser={currentUser}
        onLogout={handleLogout}
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

export default App