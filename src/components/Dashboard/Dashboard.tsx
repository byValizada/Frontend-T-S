import { useState, useEffect } from 'react'
import {
  FaPlus, FaInfoCircle, FaRegCircle, FaCheckCircle, FaEdit,
  FaTrash, FaCircle
} from 'react-icons/fa'
import Sidebar from '../Sidebar/Sidebar'
import TaskModal from '../TaskModal/TaskModal'
import type { NewTask } from '../TaskModal/TaskModal'
import TaskDetailModal from '../TaskDetailModal/TaskDetailModal'
import EditTaskModal from '../EditTaskModal/EditTaskModal'
import CompletedModal from '../CompletedModal/CompletedModal'
import CompletedNotesModal from '../CompletedModal/CompletedNotesModal'
import NoteDetailModal from '../TaskDetailModal/NoteDetailModal'
import ElanBildirisi from './ElanBildirisi'
import { addLog } from '../shared/logHelper'
import './Dashboard.css'

interface User {
  login: string
  parol: string
  rol: string
  adSoyad: string
}

interface DashboardProps {
  currentUser: User
  onLogout: () => void
  onGoToAdminPanel: () => void
}

interface Note {
  id: string
  metn: string
  notlar: string
  tamamlanib: boolean
  yaranmaTarixi: string
  tarixAktiv?: boolean
  saatAktiv?: boolean
  tarix?: string
  saat?: string
}

function Dashboard({ currentUser, onLogout, onGoToAdminPanel }: DashboardProps) {
  const [activePage, setActivePage] = useState<'tasks' | 'notes'>('tasks')
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [tasks, setTasks] = useState<NewTask[]>([])
  const [selectedTask, setSelectedTask] = useState<NewTask | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isCompletedOpen, setIsCompletedOpen] = useState(false)
  const [checkingTaskId, setCheckingTaskId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [yeniQeyd, setYeniQeyd] = useState('')
  const [isCompletedNotesOpen, setIsCompletedNotesOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isNoteDetailOpen, setIsNoteDetailOpen] = useState(false)
  const [fadingNoteId, setFadingNoteId] = useState<string | null>(null)

  useEffect(() => {
    const data = localStorage.getItem('tasks')
    if (data) setTasks(JSON.parse(data))
    const notesData = localStorage.getItem(`notes_${currentUser.login}`)
    if (notesData) setNotes(JSON.parse(notesData))
  }, [currentUser.login])

  const handleSaveTask = (task: NewTask) => {
    const updatedTasks = [...tasks, task]
    setTasks(updatedTasks)
    localStorage.setItem('tasks', JSON.stringify(updatedTasks))
    addLog('tapsirig_yarat', currentUser.adSoyad, currentUser.login, `"${task.tapsirigAdi}" tapşırığını yaratdı`)
  }

  const handleUpdateTask = (updatedTask: NewTask) => {
    const updatedTasks = tasks.map(t =>
      t.id === updatedTask.id ? updatedTask : t
    )
    setTasks(updatedTasks)
    localStorage.setItem('tasks', JSON.stringify(updatedTasks))
    setSelectedTask(updatedTask)
  }

  const openDetail = (task: NewTask) => {
    setSelectedTask(task)
    setIsDetailOpen(true)
  }

  const openEdit = (e: React.MouseEvent, task: NewTask) => {
    e.stopPropagation()
    setSelectedTask(task)
    setIsEditOpen(true)
  }

  const handleEditSave = (updatedTask: NewTask) => {
    const updatedTasks = tasks.map(t =>
      t.id === updatedTask.id ? updatedTask : t
    )
    setTasks(updatedTasks)
    localStorage.setItem('tasks', JSON.stringify(updatedTasks))
    addLog('tapsirig_redakte', currentUser.adSoyad, currentUser.login, `"${updatedTask.tapsirigAdi}" tapşırığını redaktə etdi`)
  }

  const handleCheckboxClick = (e: React.MouseEvent, task: NewTask) => {
    e.stopPropagation()
    if (task.verenLogin !== currentUser.login) return
    if (task.tamamlanib) return
    setCheckingTaskId(task.id)
    setTimeout(() => {
      const updatedTasks = tasks.map(t => {
        if (t.id === task.id) {
          return { ...t, tamamlanib: true, tamamlanmaTarixi: new Date().toLocaleDateString('az-AZ') }
        }
        return t
      })
      setTasks(updatedTasks)
      localStorage.setItem('tasks', JSON.stringify(updatedTasks))
      addLog('tapsirig_tamamla', currentUser.adSoyad, currentUser.login, `"${task.tapsirigAdi}" tapşırığını tamamladı`)
      setCheckingTaskId(null)
    }, 1500)
  }

  const handleToggleNote = (id: string) => {
    const note = notes.find(n => n.id === id)
    if (!note) return
    if (!note.tamamlanib) {
      setFadingNoteId(id)
      setTimeout(() => {
        const updatedNotes = notes.map(n =>
          n.id === id ? { ...n, tamamlanib: true } : n
        )
        setNotes(updatedNotes)
        localStorage.setItem(`notes_${currentUser.login}`, JSON.stringify(updatedNotes))
        setFadingNoteId(null)
      }, 1500)
    }
  }

  const handleRestoreNote = (id: string) => {
    const updatedNotes = notes.map(n =>
      n.id === id ? { ...n, tamamlanib: false } : n
    )
    setNotes(updatedNotes)
    localStorage.setItem(`notes_${currentUser.login}`, JSON.stringify(updatedNotes))
  }

  const handleAddNote = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && yeniQeyd.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        metn: yeniQeyd.trim(),
        notlar: '',
        tamamlanib: false,
        yaranmaTarixi: new Date().toLocaleString('az-AZ')
      }
      const updatedNotes = [newNote, ...notes]
      setNotes(updatedNotes)
      localStorage.setItem(`notes_${currentUser.login}`, JSON.stringify(updatedNotes))
      setYeniQeyd('')
    }
  }

  const handleNoteSave = (updatedNote: Note) => {
    const updatedNotes = notes.map(n =>
      n.id === updatedNote.id ? updatedNote : n
    )
    setNotes(updatedNotes)
    localStorage.setItem(`notes_${currentUser.login}`, JSON.stringify(updatedNotes))
  }

  const myActiveTasks = tasks
    .filter(task => {
      const meneQoyulan = task.secilmisShexsler.some(s => s.login === currentUser.login)
      const menimQoydugum = task.verenLogin === currentUser.login
      return (meneQoyulan || menimQoydugum) && !task.tamamlanib
    })
    .sort((a, b) => {
      if (a.tecili && !b.tecili) return -1
      if (!a.tecili && b.tecili) return 1
      return Number(b.id) - Number(a.id)
    })

  const myCompletedTasks = tasks.filter(task => {
    const meneQoyulan = task.secilmisShexsler.some(s => s.login === currentUser.login)
    const menimQoydugum = task.verenLogin === currentUser.login
    return (meneQoyulan || menimQoydugum) && task.tamamlanib
  })

  const activeNotes = notes.filter(n => !n.tamamlanib)
  const completedNotes = notes.filter(n => n.tamamlanib)

  const getEtiket = (task: NewTask): string => {
    const meneQoyulan = task.secilmisShexsler.some(s => s.login === currentUser.login)
    const menimQoydugum = task.verenLogin === currentUser.login
    if (meneQoyulan && menimQoydugum) return 'Özünə qoymusan'
    if (meneQoyulan) return 'Sənə qoyulub'
    return 'Sən qoymusan'
  }

  const getEtiketClass = (task: NewTask): string => {
    const meneQoyulan = task.secilmisShexsler.some(s => s.login === currentUser.login)
    const menimQoydugum = task.verenLogin === currentUser.login
    if (meneQoyulan && menimQoydugum) return 'etiket-ozune'
    if (meneQoyulan) return 'etiket-sene'
    return 'etiket-sen'
  }

  return (
    <div className="dashboard">
      <Sidebar
        currentUser={currentUser}
        onLogout={onLogout}
        onGoToAdminPanel={onGoToAdminPanel}
        activePage={activePage}
        onPageChange={setActivePage}
      />

      <main className="main-content">

        {/* ÜMUMİ TAPŞIRIQLAR */}
        {activePage === 'tasks' && (
          <section className="bolme">
            <div className="baslig-sira">
              <h2>Ümumi tapşırıqlar</h2>
              <button
                className="plus-btn"
                title="Yeni tapşırıq əlavə et"
                onClick={() => setIsTaskModalOpen(true)}
              >
                <FaPlus />
              </button>
            </div>

            <div className="content">
              {myActiveTasks.length === 0 ? (
                <p className="empty-message">Hələ tapşırıq yoxdur</p>
              ) : (
                myActiveTasks.map((task) => (
                  <div
                    className={`task-item ${checkingTaskId === task.id ? 'checking' : ''} ${task.tecili ? 'tecili' : ''}`}
                    key={task.id}
                  >
                    <div className="task-header">
                      <div
                        className="checkbox-wrapper"
                        onClick={(e) => handleCheckboxClick(e, task)}
                      >
                        {checkingTaskId === task.id ? (
                          <FaCheckCircle className="checkbox-icon checking-anim" />
                        ) : (
                          <FaRegCircle
                            className={`checkbox-icon ${task.verenLogin === currentUser.login ? 'clickable-check' : ''}`}
                          />
                        )}
                      </div>

                      <span className="task-title">{task.tapsirigAdi}</span>

                      <div className="task-header-etiket">
                        <span className="task-veren-label">Tapşırığı verən:</span>
                        <span className="task-veren-ad">{task.veren}</span>
                        <span className={`etiket ${getEtiketClass(task)}`}>
                          {getEtiket(task)}
                        </span>
                      </div>

                      <div className="task-right-icons">
                        {task.verenLogin === currentUser.login && (
                          <FaEdit
                            className="edit-task-icon"
                            title="Redaktə et"
                            onClick={(e) => openEdit(e, task)}
                          />
                        )}
                        <FaInfoCircle
                          className="info-icon"
                          title="Ətraflı məlumat"
                          onClick={() => openDetail(task)}
                        />
                      </div>
                    </div>

                    <div className="task-body">
                      <div className="task-meta-row">
                        {task.tarix && (
                          <span className="task-meta-item">
                            <span className="label">Yarandı:</span>
                            <span className="value">{task.tarix}</span>
                          </span>
                        )}
                        <span className="task-meta-item">
                          <span className="label">Son tarix:</span>
                          <span className="value">{task.deadline}</span>
                        </span>
                        <span className="task-meta-divider">|</span>
                        {task.secilmisShexsler.map((s) => (
                          <div key={s.login} className={`shexs-kvadrat status-${s.status || 'gozlenir'}`}>
                            {s.adSoyad}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="footer">
              <button
                className="tamamlanmis-btn"
                onClick={() => setIsCompletedOpen(true)}
              >
                tamamlanmış tapşırıqlar
                {myCompletedTasks.length > 0 && (
                  <span className="completed-count">{myCompletedTasks.length}</span>
                )}
              </button>
            </div>
          </section>
        )}

        {/* ŞƏXSİ QEYDLƏR */}
        {activePage === 'notes' && (
          <section className="bolme">
            <div className="baslig-sira">
              <h2>Şəxsi qeydlərim</h2>
            </div>

            <div className="content notes-content">
              <div className="note-input-row">
                <FaCircle className="note-input-icon" />
                <input
                  type="text"
                  className="note-input"
                  placeholder="Yeni qeyd əlavə et..."
                  value={yeniQeyd}
                  onChange={e => setYeniQeyd(e.target.value)}
                  onKeyDown={handleAddNote}
                />
              </div>

              {activeNotes.map(note => (
                <div
                  key={note.id}
                  className={`note-item ${fadingNoteId === note.id ? 'fading' : ''}`}
                >
                  <div
                    className="note-check"
                    onClick={() => handleToggleNote(note.id)}
                  >
                    <FaRegCircle className="note-circle" />
                  </div>
                  <span className="note-metn">{note.metn}</span>
                  <div className="note-item-actions">
                    <FaInfoCircle
                      className="note-info-icon"
                      onClick={() => {
                        setSelectedNote(note)
                        setIsNoteDetailOpen(true)
                      }}
                    />
                    <FaTrash
                      className="note-delete-icon"
                      onClick={() => {
                        const updatedNotes = notes.filter(n => n.id !== note.id)
                        setNotes(updatedNotes)
                        localStorage.setItem(`notes_${currentUser.login}`, JSON.stringify(updatedNotes))
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="footer">
              <button
                className="tamamlanmis-btn"
                onClick={() => setIsCompletedNotesOpen(true)}
              >
                tamamlanmış qeydlər
                {completedNotes.length > 0 && (
                  <span className="completed-count">{completedNotes.length}</span>
                )}
              </button>
            </div>
          </section>
        )}

      </main>

      <ElanBildirisi currentUser={currentUser} />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        currentUser={currentUser}
        onSave={handleSaveTask}
      />

      <TaskDetailModal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedTask(null) }}
        task={selectedTask}
        currentUser={currentUser}
        onUpdateTask={handleUpdateTask}
      />

      <EditTaskModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelectedTask(null) }}
        task={selectedTask}
        currentUser={currentUser}
        onSave={handleEditSave}
      />

      <CompletedModal
        isOpen={isCompletedOpen}
        onClose={() => setIsCompletedOpen(false)}
        completedTasks={myCompletedTasks}
        currentUser={currentUser}
        onTaskClick={(task) => {
          setIsCompletedOpen(false)
          setSelectedTask(task)
          setIsDetailOpen(true)
        }}
      />

      <CompletedNotesModal
        isOpen={isCompletedNotesOpen}
        onClose={() => setIsCompletedNotesOpen(false)}
        notes={completedNotes}
        onRestore={handleRestoreNote}
      />

      <NoteDetailModal
        isOpen={isNoteDetailOpen}
        onClose={() => { setIsNoteDetailOpen(false); setSelectedNote(null) }}
        note={selectedNote}
        onSave={handleNoteSave}
      />

    </div>
  )
}

export default Dashboard