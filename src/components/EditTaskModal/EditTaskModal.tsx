import { useState, useEffect } from 'react'
import { FaTimes, FaCloudUploadAlt, FaTrash, FaCalendarAlt } from 'react-icons/fa'
import type { NewTask, FileData, ShexsStatus } from '../TaskModal/TaskModal'
import { usersAPI, mapUserDto } from '../../services/api'
import './EditTaskModal.css'

interface User {
  id?: string
  login: string
  parol: string
  rol: string
  adSoyad: string
}

interface EditTaskModalProps {
  isOpen: boolean
  onClose: () => void
  task: NewTask | null
  currentUser: User
  onSave: (updatedTask: NewTask) => void
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function EditTaskModal({ isOpen, onClose, task, currentUser, onSave }: EditTaskModalProps) {
  const [editAd, setEditAd] = useState('')
  const [editQeyd, setEditQeyd] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [editFayllar, setEditFayllar] = useState<FileData[]>([])
  const [editShexsler, setEditShexsler] = useState<ShexsStatus[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [yuklenir, setYuklenir] = useState(false)
  const [xeta, setXeta] = useState('')

  useEffect(() => {
    if (isOpen && task) {
      setEditAd(task.tapsirigAdi)
      setEditQeyd(task.qeyd)
      setEditDeadline(task.deadline)
      setEditFayllar([...task.fayllar])
      setEditShexsler([...task.secilmisShexsler])
      setXeta('')
      usersAPI.getAll().then((data: any[]) => {
        const others = (data || []).map(mapUserDto).filter((u: any) => u.login !== currentUser.login)
        setAllUsers(others as User[])
      }).catch(() => setAllUsers([]))
    }
  }, [isOpen, task, currentUser.login])

  if (!isOpen || !task) return null

  const toggleShexs = (user: User) => {
    const exists = editShexsler.find(s => s.login === user.login)
    if (exists) {
      if (editShexsler.length === 1) return
      setEditShexsler(prev => prev.filter(s => s.login !== user.login))
    } else {
      setEditShexsler(prev => [...prev, {
        id: user.id,
        login: user.login,
        adSoyad: user.adSoyad,
        icraEdilib: false,
        status: 'gozlenir' as const
      }])
    }
  }

  const toggleAll = () => {
    if (editShexsler.length === allUsers.length) {
      if (allUsers.length === 1) return
      setEditShexsler([])
    } else {
      setEditShexsler(allUsers.map(u => ({
        id: u.id,
        login: u.login,
        adSoyad: u.adSoyad,
        icraEdilib: false,
        status: 'gozlenir' as const
      })))
    }
  }

  const handleFileAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setYuklenir(true)
    const newFiles: FileData[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > 2 * 1024 * 1024) {
        setXeta(`"${file.name}" 2MB-dan böyükdür`)
        continue
      }
      const base64 = await fileToBase64(file)
      newFiles.push({ name: file.name, size: file.size, type: file.type, base64 })
    }
    setEditFayllar(prev => [...prev, ...newFiles])
    setYuklenir(false)
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setEditFayllar(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSave = () => {
    if (!editAd.trim()) { setXeta('Tapşırığın adını daxil edin'); return }
    if (!editDeadline) { setXeta('Son tarixi seçin'); return }
    if (editShexsler.length === 0) { setXeta('Ən azı bir icraçı seçin'); return }

    const updatedTask: NewTask = {
      ...task,
      tapsirigAdi: editAd.trim(),
      qeyd: editQeyd.trim(),
      deadline: editDeadline,
      fayllar: editFayllar,
      secilmisShexsler: editShexsler
    }

    onSave(updatedTask)
    onClose()
  }

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal-box" onClick={e => e.stopPropagation()}>

        <div className="task-modal-header">
          <h3>Tapşırığı redaktə et</h3>
          <button className="task-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="task-modal-columns">

          {/* SOL */}
          <div className="task-modal-left">
            <div className="task-form-group">
              <label>Tapşırığın adı *</label>
              <input
                type="text"
                value={editAd}
                onChange={e => setEditAd(e.target.value)}
                placeholder="Tapşırığın adını daxil edin"
              />
            </div>

            <div className="task-form-group">
              <label>Qeyd</label>
              <textarea
                value={editQeyd}
                onChange={e => setEditQeyd(e.target.value)}
                placeholder="Əlavə qeydlər yazın..."
              />
            </div>

            <div className="task-form-group">
              <label><FaCalendarAlt className="label-icon" /> Son tarix *</label>
              <input
                type="date"
                value={editDeadline}
                onChange={e => setEditDeadline(e.target.value)}
              />
            </div>

            <div className="task-form-group">
              <label><FaCloudUploadAlt className="label-icon" /> Sənəd / Şəkil (max 2MB)</label>
              <div className="file-upload-area">
                <label className="file-upload-btn">
                  <FaCloudUploadAlt /> {yuklenir ? 'Yüklənir...' : 'Fayl seç'}
                  <input
                    type="file"
                    multiple
                    onChange={handleFileAdd}
                    style={{ display: 'none' }}
                    disabled={yuklenir}
                  />
                </label>
                <span className="file-hint">Bir neçə fayl seçə bilərsiniz</span>
              </div>

              {editFayllar.length > 0 && (
                <div className="files-list">
                  {editFayllar.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-info">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{formatFileSize(file.size)}</span>
                      </div>
                      <button className="file-remove" onClick={() => removeFile(index)}>
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {xeta && <p className="task-form-error">{xeta}</p>}
          </div>

          {/* SAĞ - ŞƏXSLƏR */}
          <div className="task-modal-right">
            <div className="task-form-group" style={{ height: '100%' }}>
              <label>İcraçılar * ({editShexsler.length} seçilib)</label>
              <div className="shexsler-list" style={{ maxHeight: '100%' }}>
                {allUsers.length === 0 ? (
                  <p className="no-users">Başqa istifadəçi yoxdur</p>
                ) : (
                  <>
                    <div className="shexs-item select-all" onClick={toggleAll}>
                      <input
                        type="checkbox"
                        checked={editShexsler.length === allUsers.length && allUsers.length > 0}
                        readOnly
                      />
                      <span className="shexs-name">Hamısını seç</span>
                    </div>
                    {allUsers.map(user => {
                      const selected = editShexsler.some(s => s.login === user.login)
                      return (
                        <div
                          key={user.login}
                          className={`shexs-item ${selected ? 'selected' : ''}`}
                          onClick={() => toggleShexs(user)}
                        >
                          <input type="checkbox" checked={selected} readOnly />
                          <span className="shexs-name">{user.adSoyad}</span>
                          <span className="shexs-rol">{user.rol}</span>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="task-modal-footer">
          <div className="task-footer-left">
            <div className="veren-info">
              <span className="veren-label">Verən:</span>
              <span className="veren-ad">{currentUser.adSoyad}</span>
              <span className="veren-rol">{currentUser.rol}</span>
            </div>
          </div>
          <div className="task-footer-right">
            <button className="task-cancel-btn" onClick={onClose}>Ləğv et</button>
            <button className="task-save-btn" onClick={handleSave}>Yadda saxla</button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default EditTaskModal