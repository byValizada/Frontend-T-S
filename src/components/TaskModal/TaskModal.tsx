import { useState, useEffect } from 'react'
import { FaTimes, FaCloudUploadAlt, FaTrash, FaCalendarAlt } from 'react-icons/fa'
import './TaskModal.css'

interface User {
  login: string
  parol: string
  rol: string
  adSoyad: string
}

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: User
  onSave: (task: NewTask) => void
}

export interface ShexsStatus {
  login: string
  adSoyad: string
  icraEdilib: boolean
  status?: 'gozlenir' | 'icrada' | 'tamamlandi'
}

export interface FileData {
  name: string
  size: number
  type: string
  base64: string
}

export interface Mesaj {
  id: string
  yazanLogin: string
  yazanAd: string
  metn: string
  tarix: string
  redakteOlunub?: boolean
  fayllar?: {name: string, base64: string, type: string}[]
  isLink?: boolean
}

export interface NewTask {
  id: string
  tapsirigAdi: string
  qeyd: string
  veren: string
  verenLogin: string
  secilmisShexsler: ShexsStatus[]
  deadline: string
  fayllar: FileData[]
  tarix: string
  tamamlanib: boolean
  tamamlanmaTarixi?: string
  mesajlar?: Mesaj[]
  tecili?: boolean
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function TaskModal({ isOpen, onClose, currentUser, onSave }: TaskModalProps) {
  const [tapsirigAdi, setTapsirigAdi] = useState('')
  const [qeyd, setQeyd] = useState('')
  const [secilmisLoginler, setSecilmisLoginler] = useState<string[]>([])
  const [deadline, setDeadline] = useState('')
  const [fayllar, setFayllar] = useState<FileData[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [xeta, setXeta] = useState('')
  const [yuklenir, setYuklenir] = useState(false)
  const [tecili, setTecili] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const data = localStorage.getItem('users')
      if (data) {
        const allUsers: User[] = JSON.parse(data)
        const others = allUsers.filter(u => u.login !== currentUser.login)
        setUsers(others)
      }
      setTapsirigAdi('')
      setQeyd('')
      setSecilmisLoginler([])
      setDeadline('')
      setFayllar([])
      setXeta('')
      setTecili(false)
    }
  }, [isOpen, currentUser.login])

  const toggleShexs = (login: string) => {
    setSecilmisLoginler(prev =>
      prev.includes(login) ? prev.filter(l => l !== login) : [...prev, login]
    )
  }

  const toggleAll = () => {
    setSecilmisLoginler(
      secilmisLoginler.length === users.length ? [] : users.map(u => u.login)
    )
  }

  const handleFileAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setYuklenir(true)
    const newFiles: FileData[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > 2 * 1024 * 1024) {
        setXeta(`"${file.name}" 2MB-dan böyükdür.`)
        continue
      }
      const base64 = await fileToBase64(file)
      newFiles.push({ name: file.name, size: file.size, type: file.type, base64 })
    }
    setFayllar(prev => [...prev, ...newFiles])
    setYuklenir(false)
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setFayllar(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSave = () => {
    if (!tapsirigAdi.trim()) { setXeta('Tapşırığın adını daxil edin'); return }
    if (secilmisLoginler.length === 0) { setXeta('Ən azı bir şəxs seçin'); return }
    if (!deadline) { setXeta('Son tarixi seçin'); return }

    const shexslerStatus: ShexsStatus[] = secilmisLoginler.map(login => {
      const user = users.find(u => u.login === login)
      return { login, adSoyad: user ? user.adSoyad : login, icraEdilib: false }
    })

    const newTask: NewTask = {
      id: Date.now().toString(),
      tapsirigAdi: tapsirigAdi.trim(),
      qeyd: qeyd.trim(),
      veren: currentUser.adSoyad,
      verenLogin: currentUser.login,
      secilmisShexsler: shexslerStatus,
      deadline,
      fayllar,
      tarix: new Date().toLocaleString('az-AZ'),
      tamamlanib: false,
      tecili
    }

    onSave(newTask)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal-box" onClick={e => e.stopPropagation()}>

        <div className="task-modal-header">
          <h3>Yeni tapşırıq yarat</h3>
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
                value={tapsirigAdi}
                onChange={e => setTapsirigAdi(e.target.value)}
                placeholder="Tapşırığın adını daxil edin"
              />
            </div>

            <div className="task-form-group">
              <label>Qeyd</label>
              <textarea
                value={qeyd}
                onChange={e => setQeyd(e.target.value)}
                placeholder="Əlavə qeydlər yazın..."
              />
            </div>

            <div className="task-form-group">
              <label><FaCalendarAlt className="label-icon" /> Son tarix *</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
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

              {fayllar.length > 0 && (
                <div className="files-list">
                  {fayllar.map((file, index) => (
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

          {/* SAĞ */}
          <div className="task-modal-right">
            <div className="task-form-group" style={{ height: '100%' }}>
              <label>Tapşırıq qoyulan şəxslər * ({secilmisLoginler.length} seçilib)</label>
              <div className="shexsler-list" style={{ maxHeight: '100%' }}>
                {users.length === 0 ? (
                  <p className="no-users">Başqa istifadəçi yoxdur</p>
                ) : (
                  <>
                    <div className="shexs-item select-all" onClick={toggleAll}>
                      <input
                        type="checkbox"
                        checked={secilmisLoginler.length === users.length && users.length > 0}
                        readOnly
                      />
                      <span className="shexs-name">Hamısını seç</span>
                    </div>
                    {users.map(user => (
                      <div
                        key={user.login}
                        className={`shexs-item ${secilmisLoginler.includes(user.login) ? 'selected' : ''}`}
                        onClick={() => toggleShexs(user.login)}
                      >
                        <input
                          type="checkbox"
                          checked={secilmisLoginler.includes(user.login)}
                          readOnly
                        />
                        <span className="shexs-name">{user.adSoyad}</span>
                        <span className="shexs-rol">{user.rol}</span>
                      </div>
                    ))}
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
              <span className="veren-label">Tapşırığı icra edən:</span>
              <span className="veren-ad">{currentUser.adSoyad}</span>
              <span className="veren-rol">{currentUser.rol}</span>
            </div>
            <button
              className={`tecili-btn ${tecili ? 'aktiv' : ''}`}
              onClick={() => setTecili(!tecili)}
            >
              🔴 Təcili
            </button>
          </div>
          <div className="task-footer-right">
            <button className="task-cancel-btn" onClick={onClose}>Ləğv et</button>
            <button className="task-save-btn" onClick={handleSave}>Tapşırıq yarat</button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default TaskModal