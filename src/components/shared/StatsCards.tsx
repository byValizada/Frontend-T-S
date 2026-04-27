import { useState, useEffect } from 'react'
import { FaTasks, FaCheckCircle, FaSpinner, FaTimes, FaRegCircle } from 'react-icons/fa'
import './StatsCards.css'

interface User {
  login: string
  parol: string
  rol: string
  adSoyad: string
  companyId?: string
  bolmeId?: string
}

interface ShexsStatus {
  login: string
  adSoyad: string
  icraEdilib: boolean
  status?: string
}

interface NewTask {
  id: string
  tapsirigAdi: string
  qeyd: string
  veren: string
  verenLogin: string
  secilmisShexsler: ShexsStatus[]
  deadline: string
  tamamlanib: boolean
  tamamlanmaTarixi?: string
  tecili?: boolean
}

interface StatsCardsProps {
  currentUser: User
  allowedLogins?: string[]
}

function StatsCards({ currentUser, allowedLogins }: StatsCardsProps) {
  const [tasks, setTasks] = useState<NewTask[]>([])
  const [activeModal, setActiveModal] = useState<'all' | 'active' | 'completed' | null>(null)

  useEffect(() => {
    const data = localStorage.getItem('tasks')
    if (data) setTasks(JSON.parse(data))
  }, [])

  const filteredTasks = tasks.filter(task => {
    if (currentUser.rol === 'SuperAdmin') return true
    if (allowedLogins && allowedLogins.length > 0) {
      const verendir = allowedLogins.includes(task.verenLogin)
      const icracidir = task.secilmisShexsler.some(s => allowedLogins.includes(s.login))
      return verendir || icracidir
    }
    return false
  })

  const allTasks = filteredTasks
  const activeTasks = filteredTasks.filter(t => !t.tamamlanib)
  const completedTasks = filteredTasks.filter(t => t.tamamlanib)

  const getModalTasks = () => {
    if (activeModal === 'all') return allTasks
    if (activeModal === 'active') return activeTasks
    if (activeModal === 'completed') return completedTasks
    return []
  }

  const getModalTitle = () => {
    if (activeModal === 'all') return 'Bütün tapşırıqlar'
    if (activeModal === 'active') return 'Aktiv tapşırıqlar'
    if (activeModal === 'completed') return 'Tamamlanmış tapşırıqlar'
    return ''
  }

  return (
    <>
      <div className="stats-cards">
        <div className="stats-card stats-all" onClick={() => setActiveModal('all')}>
          <div className="stats-icon-box">
            <FaTasks className="stats-icon" />
          </div>
          <div className="stats-info">
            <span className="stats-sayi">{allTasks.length}</span>
            <span className="stats-ad">Ümumi tapşırıq</span>
          </div>
        </div>

        <div className="stats-card stats-active" onClick={() => setActiveModal('active')}>
          <div className="stats-icon-box">
            <FaSpinner className="stats-icon" />
          </div>
          <div className="stats-info">
            <span className="stats-sayi">{activeTasks.length}</span>
            <span className="stats-ad">Aktiv tapşırıq</span>
          </div>
        </div>

        <div className="stats-card stats-completed" onClick={() => setActiveModal('completed')}>
          <div className="stats-icon-box">
            <FaCheckCircle className="stats-icon" />
          </div>
          <div className="stats-info">
            <span className="stats-sayi">{completedTasks.length}</span>
            <span className="stats-ad">Tamamlanmış</span>
          </div>
        </div>
      </div>

      {activeModal && (
        <div className="stats-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="stats-modal-box" onClick={e => e.stopPropagation()}>

            <div className="stats-modal-header">
              <h3>{getModalTitle()} <span className="stats-modal-say">({getModalTasks().length})</span></h3>
              <button className="stats-modal-close" onClick={() => setActiveModal(null)}>
                <FaTimes />
              </button>
            </div>

            <div className="stats-modal-body">
              {getModalTasks().length === 0 ? (
                <p className="stats-bos">Tapşırıq yoxdur</p>
              ) : (
                getModalTasks().map(task => (
                  <div
                    key={task.id}
                    className={`stats-task-item${task.tecili ? ' tecili' : ''}${task.tamamlanib ? ' completed' : ''}`}
                  >
                    {/* TASK HEADER - Dashboard kimi */}
                    <div className="stats-task-row-main">
                      <div className="stats-task-checkbox">
                        {task.tamamlanib
                          ? <FaCheckCircle className="stats-check-icon done" />
                          : <FaRegCircle className="stats-check-icon" />
                        }
                      </div>

                      <div className="stats-task-main">
                        <span className={`stats-task-ad${task.tamamlanib ? ' done' : ''}`}>
                          {task.tapsirigAdi}
                        </span>
                        {task.secilmisShexsler.length > 0 && (
                          <div className="stats-icracilar">
                            {task.secilmisShexsler.map(s => (
                              <span key={s.login} className={`stats-icraci-tag status-${s.status || 'gozlenir'}`}>
                                {s.adSoyad}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="stats-task-right">
                        {task.deadline && (
                          <span className="stats-deadline">{task.deadline}</span>
                        )}
                        {task.tamamlanmaTarixi && (
                          <span className="stats-tamamlanma">{task.tamamlanmaTarixi}</span>
                        )}
                        <span className={`stats-task-star${task.tecili ? ' aktiv' : ''}`}>
                          {task.tecili ? '★' : '☆'}
                        </span>
                      </div>
                    </div>

                    {/* VERƏN */}
                    <div className="stats-task-veren">
                      Verən: <strong>{task.veren}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}
    </>
  )
}

export default StatsCards