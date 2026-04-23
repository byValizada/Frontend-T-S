import { FaTimes, FaHistory, FaSignInAlt, FaPlus, FaCheck, FaEdit, FaTrash } from 'react-icons/fa'
import './AdminPanel.css'

export interface LogItem {
  id: string
  tip: 'giris' | 'tapsirig_yarat' | 'tapsirig_tamamla' | 'tapsirig_redakte' | 'tapsirig_sil'
  adSoyad: string
  login: string
  metn: string
  tarix: string
}

interface ActivityLogProps {
  onClose: () => void
}

function ActivityLog({ onClose }: ActivityLogProps) {
  const getLogs = (): LogItem[] => {
    const data = localStorage.getItem('activityLog')
    if (!data) return []
    return JSON.parse(data).reverse()
  }

  const getIcon = (tip: LogItem['tip']) => {
    switch (tip) {
      case 'giris': return <FaSignInAlt className="log-icon log-giris" />
      case 'tapsirig_yarat': return <FaPlus className="log-icon log-yarat" />
      case 'tapsirig_tamamla': return <FaCheck className="log-icon log-tamamla" />
      case 'tapsirig_redakte': return <FaEdit className="log-icon log-redakte" />
      case 'tapsirig_sil': return <FaTrash className="log-icon log-sil" />
    }
  }

  const logs = getLogs()

  return (
    <div className="activitylog-bolme">
      <div className="activitylog-header">
        <h3>
          <FaHistory style={{ marginRight: 8 }} />
          Aktivlik Jurnalı
        </h3>
        <button className="performans-close" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      <div className="activitylog-list">
        {logs.length === 0 ? (
          <p className="activitylog-bos">Hələ heç bir aktivlik qeyd edilməyib</p>
        ) : (
          logs.map(log => (
            <div key={log.id} className="activitylog-item">
              <div className="activitylog-icon-wrapper">
                {getIcon(log.tip)}
              </div>
              <div className="activitylog-info">
                <span className="activitylog-ad">{log.adSoyad}</span>
                <span className="activitylog-metn">{log.metn}</span>
              </div>
              <span className="activitylog-tarix">{log.tarix}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Log əlavə etmək üçün helper funksiya
export const addLog = (
  tip: LogItem['tip'],
  adSoyad: string,
  login: string,
  metn: string
) => {
  const data = localStorage.getItem('activityLog')
  const logs: LogItem[] = data ? JSON.parse(data) : []

  const newLog: LogItem = {
    id: Date.now().toString(),
    tip,
    adSoyad,
    login,
    metn,
    tarix: new Date().toLocaleString('az-AZ')
  }

  // Maksimum 100 log saxla
  const updatedLogs = [...logs, newLog].slice(-100)
  localStorage.setItem('activityLog', JSON.stringify(updatedLogs))
}

export default ActivityLog