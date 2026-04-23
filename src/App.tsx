import { useState, useEffect } from 'react'
import Login from './components/Login/Login'
import Dashboard from './components/Dashboard/Dashboard'
import SuperAdminPanel from './components/SuperAdminPanel/SuperAdminPanel'
import MuessiseAdminPanel from './components/MuessiseAdminPanel/MuessiseAdminPanel'
import BolmeAdminPanel from './components/BolmeAdminPanel/BolmeAdminPanel'
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
  }

 const handleLogout = () => {
    localStorage.removeItem('currentUser')
    setCurrentUser(null)
    setAdminInDashboard(false)
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

  // Müəssisə Admini - Dashboard-da isə Dashboard göstər, yoxsa öz panelini
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

  // Bölmə Admini - eyni məntiqlə
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

  // Müavin və İşçi - birbaşa Dashboard, admin panel yoxdur
  return (
    <Dashboard
      currentUser={currentUser}
      onLogout={handleLogout}
      onGoToAdminPanel={() => {}}
    />
  )
}

export default App