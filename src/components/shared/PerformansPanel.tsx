import { useState, useEffect } from 'react'
import { FaTrophy } from 'react-icons/fa'
import { tasksAPI } from '../../services/api'
import './PerformansPanel.css'

interface User {
  login: string
  parol: string
  rol: string
  adSoyad: string
  companyId?: string
  bolmeId?: string
}

interface PerformansPanelProps {
  users: User[]
  currentUser: User
}

function PerformansPanel({ users, currentUser }: PerformansPanelProps) {
  const [allTasks, setAllTasks] = useState<any[]>([])

  useEffect(() => {
    tasksAPI.getAll().then(data => setAllTasks(data || [])).catch(() => setAllTasks([]))
  }, [currentUser.login])

  const getPerformans = () => {
    const allUsers = users.some(u => u.login === currentUser.login)
      ? users
      : [...users, currentUser]

    return allUsers
      .filter(u => u.rol !== 'SuperAdmin')
      .map(user => {
        const userTasks = allTasks.filter((t: any) =>
          t.secilmisShexsler.some((s: any) => s.login === user.login) ||
          t.verenLogin === user.login
        )
        const aktiv = userTasks.filter((t: any) => !t.tamamlanib).length
        const tamamlandi = userTasks.filter((t: any) => t.tamamlanib).length
        const umumi = userTasks.length
        const faiz = umumi > 0 ? Math.round((tamamlandi / umumi) * 100) : 0
        return { login: user.login, adSoyad: user.adSoyad, rol: user.rol, umumi, aktiv, tamamlandi, faiz }
      })
      .sort((a, b) => b.faiz - a.faiz)
  }

  const performansData = getPerformans()

  const getTrophyColor = (index: number) => {
    if (index === 0) return '#FFD700'
    if (index === 1) return '#C0C0C0'
    if (index === 2) return '#CD7F32'
    return null
  }

  return (
    <div>
      <div className="performans-list">
        {performansData.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#8BB8B5', padding: '20px' }}>
            Hələ tapşırıq yoxdur
          </p>
        ) : (
          performansData.map((p, index) => (
            <div key={p.login} className="performans-item">
              <div className="performans-item-left">
                <div className="performans-sira">
                  {getTrophyColor(index) ? (
                    <FaTrophy style={{ color: getTrophyColor(index)!, fontSize: 18 }} />
                  ) : (
                    <span style={{ color: '#8BB8B5', fontSize: 13 }}>#{index + 1}</span>
                  )}
                </div>
                <div className="performans-user-info">
                  <span className="performans-ad">{p.adSoyad}</span>
                  <span className="performans-rol">{p.rol}</span>
                </div>
              </div>

              <div className="performans-stats">
                <div className="performans-stat">
                  <span className="pstat-sayi">{p.umumi}</span>
                  <span className="pstat-ad">Ümumi</span>
                </div>
                <div className="performans-stat">
                  <span className="pstat-sayi aktiv">{p.aktiv}</span>
                  <span className="pstat-ad">Aktiv</span>
                </div>
                <div className="performans-stat">
                  <span className="pstat-sayi tamamlandi">{p.tamamlandi}</span>
                  <span className="pstat-ad">Tamamlandı</span>
                </div>
                <div className="performans-faiz-wrapper">
                  <div className="performans-faiz-bar">
                    <div
                      className="performans-faiz-dolu"
                      style={{ width: `${p.faiz}%` }}
                    />
                  </div>
                  <span className="performans-faiz-metn">{p.faiz}%</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default PerformansPanel
