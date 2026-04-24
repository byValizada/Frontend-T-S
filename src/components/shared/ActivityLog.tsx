import { useState, useEffect } from 'react'
import { FaTimes, FaHistory, FaSignInAlt, FaPlus, FaCheck, FaEdit, FaTrash, FaBullhorn, FaUserPlus, FaUserMinus } from 'react-icons/fa'
import type { LogItem } from './logHelper'
import './ActivityLog.css'

interface ActivityLogProps {
  onClose: () => void
}

function ActivityLog({ onClose }: ActivityLogProps) {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [filter, setFilter] = useState<string>('hamisi')

  useEffect(() => {
    const data = localStorage.getItem('activityLog')
    if (data) {
      setLogs(JSON.parse(data).reverse())
    }
  }, [])

  const getIcon = (tip: LogItem['tip']) => {
    switch (tip) {
      case 'giris': return <FaSignInAlt className="log-icon log-giris" />
      case 'tapsirig_yarat': return <FaPlus className="log-icon log-yarat" />
      case 'tapsirig_tamamla': return <FaCheck className="log-icon log-tamamla" />
      case 'tapsirig_redakte': return <FaEdit className="log-icon log-redakte" />
      case 'tapsirig_sil': return <FaTrash className="log-icon log-sil" />
      case 'elan_gonder': return <FaBullhorn className="log-icon log-elan" />
      case 'istifadeci_yarat': return <FaUserPlus className="log-icon log-yarat" />
      case 'istifadeci_sil': return <FaUserMinus className="log-icon log-sil" />
    }
  }

  const getTipAd = (tip: LogItem['tip']) => {
    switch (tip) {
      case 'giris': return 'Giriş'
      case 'tapsirig_yarat': return 'Tapşırıq yaratdı'
      case 'tapsirig_tamamla': return 'Tapşırıq tamamladı'
      case 'tapsirig_redakte': return 'Tapşırıq redaktə etdi'
      case 'tapsirig_sil': return 'Tapşırıq sildi'
      case 'elan_gonder': return 'Elan göndərdi'
      case 'istifadeci_yarat': return 'İstifadəçi yaratdı'
      case 'istifadeci_sil': return 'İstifadəçi sildi'
    }
  }

  const filteredLogs = filter === 'hamisi'
    ? logs
    : logs.filter(l => l.tip === filter)

  return (
    <div className="actlog-bolme">
      <div className="actlog-header">
        <h3>
          <FaHistory style={{ marginRight: 8 }} />
          Aktivlik Jurnalı ({filteredLogs.length})
        </h3>
        <button className="actlog-close" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      {/* FİLTR */}
      <div className="actlog-filter">
        {[
          { key: 'hamisi', ad: 'Hamısı' },
          { key: 'giris', ad: 'Girişlər' },
          { key: 'tapsirig_yarat', ad: 'Yaratma' },
          { key: 'tapsirig_tamamla', ad: 'Tamamlama' },
          { key: 'tapsirig_redakte', ad: 'Redaktə' },
          { key: 'elan_gonder', ad: 'Elanlar' },
          { key: 'istifadeci_yarat', ad: 'İst. yaratma' },
          { key: 'istifadeci_sil', ad: 'İst. silmə' },
        ].map(f => (
          <button
            key={f.key}
            className={`actlog-filter-btn ${filter === f.key ? 'aktiv' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.ad}
          </button>
        ))}
      </div>

      {/* LOG SİYAHISI */}
      <div className="actlog-list">
        {filteredLogs.length === 0 ? (
          <p className="actlog-bos">Hələ heç bir aktivlik qeyd edilməyib</p>
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} className="actlog-item">
              <div className="actlog-icon-wrapper">
                {getIcon(log.tip)}
              </div>
              <div className="actlog-info">
                <span className="actlog-ad">{log.adSoyad}</span>
                <span className="actlog-metn">{log.metn}</span>
              </div>
              <div className="actlog-right">
                <span className="actlog-tip">{getTipAd(log.tip)}</span>
                <span className="actlog-tarix">{log.tarix}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ActivityLog