import { useState, useRef, useEffect } from 'react'
import { FaTimes, FaDownload, FaFile, FaFileImage, FaFilePdf, FaFileWord, FaFileExcel, FaPaperclip } from 'react-icons/fa'
import type { NewTask, FileData, Mesaj } from '../TaskModal/TaskModal'
import './TaskDetailModal.css'

interface User {
  login: string
  parol: string
  rol: string
  adSoyad: string
}

interface TaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  task: NewTask | null
  currentUser: User
  onUpdateTask: (updatedTask: NewTask) => void
}

function TaskDetailModal({ isOpen, onClose, task, currentUser, onUpdateTask }: TaskDetailModalProps) {
  const [yeniMesaj, setYeniMesaj] = useState('')
  const [editingMesajId, setEditingMesajId] = useState<string | null>(null)
  const [mesajFayllar, setMesajFayllar] = useState<{name: string, base64: string, type: string}[]>([])
  const [icraModalAciq, setIcraModalAciq] = useState(false)
  const [icraFayllar, setIcraFayllar] = useState<{name: string, base64: string, type: string}[]>([])
  const mesajlarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (mesajlarRef.current) {
      mesajlarRef.current.scrollTop = mesajlarRef.current.scrollHeight
    }
  }, [task?.mesajlar])

  if (!isOpen || !task) return null

  const myStatus = task.secilmisShexsler.find(s => s.login === currentUser.login)
  const isVeren = task.verenLogin === currentUser.login

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FaFileImage className="file-type-icon image" />
    if (type === 'application/pdf') return <FaFilePdf className="file-type-icon pdf" />
    if (type.includes('word') || type.includes('document')) return <FaFileWord className="file-type-icon word" />
    if (type.includes('sheet') || type.includes('excel')) return <FaFileExcel className="file-type-icon excel" />
    return <FaFile className="file-type-icon default" />
  }

  const downloadFile = (file: FileData) => {
    const link = document.createElement('a')
    link.href = file.base64
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleGonder = () => {
    if (!yeniMesaj.trim() && mesajFayllar.length === 0) return
    if (editingMesajId) {
      const updatedTask: NewTask = {
        ...task,
        mesajlar: (task.mesajlar || []).map(m =>
          m.id === editingMesajId ? { ...m, metn: yeniMesaj.trim(), redakteOlunub: true } : m
        )
      }
      onUpdateTask(updatedTask)
      setEditingMesajId(null)
    } else {
      const mesaj: Mesaj = {
        id: Date.now().toString(),
        yazanLogin: currentUser.login,
        yazanAd: currentUser.adSoyad,
        metn: yeniMesaj.trim(),
        tarix: new Date().toLocaleString('az-AZ'),
        redakteOlunub: false,
        fayllar: mesajFayllar
      }
      onUpdateTask({ ...task, mesajlar: [...(task.mesajlar || []), mesaj] })
      setMesajFayllar([])
    }
    setYeniMesaj('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleGonder()
    }
    if (e.key === 'Escape') {
      setEditingMesajId(null)
      setYeniMesaj('')
    }
  }

  const handleRedakteBaslat = (m: Mesaj) => {
    setEditingMesajId(m.id)
    setYeniMesaj(m.metn)
  }

  const handleMesajFaylElave = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newFiles: {name: string, base64: string, type: string}[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > 5 * 1024 * 1024) continue
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      newFiles.push({ name: file.name, base64, type: file.type })
    }
    setMesajFayllar(prev => [...prev, ...newFiles])
    e.target.value = ''
  }

  const handleIcraFaylElave = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newFiles: {name: string, base64: string, type: string}[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      newFiles.push({ name: file.name, base64, type: file.type })
    }
    setIcraFayllar(prev => [...prev, ...newFiles])
    e.target.value = ''
  }

  const handleIcrayaGotur = () => {
    const updatedShexsler = task.secilmisShexsler.map(s =>
      s.login === currentUser.login ? { ...s, status: 'icrada' as const } : s
    )
    onUpdateTask({ ...task, secilmisShexsler: updatedShexsler })
  }

  const handleIcraEtdim = () => {
    setIcraModalAciq(true)
  }

  const handleIcraTedsiq = () => {
    const updatedShexsler = task.secilmisShexsler.map(s =>
      s.login === currentUser.login ? { ...s, status: 'tamamlandi' as const, icraEdilib: true } : s
    )
    if (icraFayllar.length > 0) {
      const mesaj: Mesaj = {
        id: Date.now().toString(),
        yazanLogin: currentUser.login,
        yazanAd: currentUser.adSoyad,
        metn: 'İcra sənədləri əlavə edildi',
        tarix: new Date().toLocaleString('az-AZ'),
        redakteOlunub: false,
        fayllar: icraFayllar
      }
      onUpdateTask({ ...task, secilmisShexsler: updatedShexsler, mesajlar: [...(task.mesajlar || []), mesaj] })
    } else {
      onUpdateTask({ ...task, secilmisShexsler: updatedShexsler })
    }
    setIcraModalAciq(false)
    setIcraFayllar([])
  }

  const gorulecekMesajlar = (task.mesajlar || []).filter(m => m.metn !== 'İcra sənədləri əlavə edildi')

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-box" onClick={e => e.stopPropagation()}>

        <div className="detail-header">
          <h3>{task.tapsirigAdi}</h3>
          <button className="detail-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="detail-columns">

          {/* SOL */}
          <div className="detail-left">
            <div className="detail-info-section">
              <div className="detail-row">
                <span className="detail-label">Tapşırığı verən:</span>
                <span className="detail-value">{task.veren}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Son tarix:</span>
                <span className="detail-value">{task.deadline}</span>
              </div>
              {task.qeyd && (
                <div className="detail-row">
                  <span className="detail-label">Qeyd:</span>
                  <span className="detail-value">{task.qeyd}</span>
                </div>
              )}
            </div>

            <div className="detail-section">
              <p className="detail-section-title">İcraçılar</p>
              <div className="detail-shexsler">
                {task.secilmisShexsler.map(s => (
                  <div key={s.login} className={`detail-kvadrat status-${s.status || 'gozlenir'}`}>
                    {s.adSoyad}
                  </div>
                ))}
              </div>
            </div>

            {task.mesajlar && task.mesajlar.some(m => m.metn === 'İcra sənədləri əlavə edildi') && (
              <div className="icra-senedler-box">
                <p className="icra-senedler-baslig">✓ İcra sənədləri</p>
                {task.mesajlar
                  .filter(m => m.metn === 'İcra sənədləri əlavə edildi')
                  .map((m, mi) => (
                    <div key={mi} className="icra-senedler-item">
                      <span className="icra-senedler-ad">{m.yazanAd}</span>
                      {m.fayllar?.map((f, i) => (
                        <a key={i} href={f.base64} download={f.name} className="icra-senedler-fayl">
                          <FaPaperclip /> {f.name}
                        </a>
                      ))}
                    </div>
                  ))
                }
              </div>
            )}

            {task.fayllar.length > 0 && (
              <div className="detail-section">
                <p className="detail-section-title">
                  <FaPaperclip style={{ marginRight: 6 }} />
                  Fayllar ({task.fayllar.length})
                </p>
                <div className="detail-files">
                  {task.fayllar.map((file, index) => (
                    <div key={index} className="detail-file-item">
                      <div className="detail-file-left">
                        {getFileIcon(file.type)}
                        <div className="detail-file-info">
                          <span className="detail-file-name">{file.name}</span>
                          <span className="detail-file-size">{formatFileSize(file.size)}</span>
                        </div>
                      </div>
                      <button className="detail-download-btn" onClick={() => downloadFile(file)}>
                        <FaDownload /> Yüklə
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {myStatus && !task.tamamlanib && (
              <div className="detail-status-buttons">
                {(!myStatus.status || myStatus.status === 'gozlenir') && (
                  <button className="btn-icraya-gotur" onClick={handleIcrayaGotur}>
                    İcraya götürdüm
                  </button>
                )}
                {myStatus.status === 'icrada' && (
                  <button className="btn-icra-etdim" onClick={handleIcraEtdim}>
                    İcra etdim
                  </button>
                )}
                {myStatus.status === 'tamamlandi' && (
                  <span className="tamamlandi-yazisi">✓ Siz icra etdiniz</span>
                )}
              </div>
            )}

            <div className="detail-close-wrapper">
              <button className="detail-close-btn" onClick={onClose}>
                Bağla
              </button>
            </div>
          </div>

          {/* SAĞ */}
          <div className="detail-right">
            <div className="detail-right-top">
              <p className="detail-section-title">Qeydlər</p>
              <div className="detail-mesajlar" ref={mesajlarRef}>
                {gorulecekMesajlar.length === 0 ? (
                  <p className="no-mesaj">Hələ qeyd yoxdur</p>
                ) : (
                  gorulecekMesajlar.map(m => (
                    <div
                      key={m.id}
                      className={`mesaj-item ${m.yazanLogin === currentUser.login ? 'oz-mesaj' : 'basqa-mesaj'}`}
                    >
                      <div className="mesaj-meta">
                        <span className="mesaj-ad">{m.yazanAd}</span>
                        <span className="mesaj-tarix">{m.tarix}</span>
                      </div>
                      <div className="mesaj-bubble-wrapper">
                        <div className="mesaj-metn">
                          {m.metn}
                          {m.fayllar && m.fayllar.length > 0 && (
                            <div className="mesaj-fayllar">
                              {m.fayllar.map((f, i) => (
                                <div key={i} className="mesaj-fayl-goster">
                                  {f.type.startsWith('image/') ? (
                                    <img src={f.base64} alt={f.name} className="mesaj-sekil" />
                                  ) : (
                                    <a href={f.base64} download={f.name} className="mesaj-fayl-link">
                                      <FaPaperclip /> {f.name}
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {m.yazanLogin === currentUser.login && (
                          <span
                            className="mesaj-qelem-icon"
                            onClick={() => handleRedakteBaslat(m)}
                            title="Redaktə et"
                          >✏️</span>
                        )}
                      </div>
                      {m.redakteOlunub && (
                        <span className="mesaj-redakte-yazisi">redaktə olunub</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="detail-right-bottom">
              {editingMesajId && (
                <div className="redakte-xəbərdarlıq">
                  <span>✏️ Redaktə rejimi</span>
                  <button onClick={() => { setEditingMesajId(null); setYeniMesaj('') }}>
                    <FaTimes /> Ləğv et
                  </button>
                </div>
              )}

              {mesajFayllar.length > 0 && (
                <div className="mesaj-fayllar-preview">
                  {mesajFayllar.map((f, i) => (
                    <div key={i} className="mesaj-fayl-item">
                      {f.type.startsWith('image/') ? (
                        <img src={f.base64} alt={f.name} className="mesaj-fayl-img" />
                      ) : (
                        <span className="mesaj-fayl-ad">{f.name}</span>
                      )}
                      <button className="mesaj-fayl-sil" onClick={() => setMesajFayllar(prev => prev.filter((_, idx) => idx !== i))}>
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mesaj-yazma">
                <textarea
                  value={yeniMesaj}
                  onChange={e => setYeniMesaj(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={editingMesajId ? "Redaktə edin..." : "Qeyd yazın... (Enter ilə göndər)"}
                />
                {(myStatus || isVeren) && (
                  <label className="mesaj-fayl-btn" title="Fayl əlavə et">
                    <FaPaperclip />
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleMesajFaylElave}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
                <button className="mesaj-gonder-btn" onClick={handleGonder}>
                  {editingMesajId ? 'Yenilə' : 'Göndər'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {icraModalAciq && (
          <div className="icra-modal-overlay" onClick={() => setIcraModalAciq(false)}>
            <div className="icra-modal-box" onClick={e => e.stopPropagation()}>
              <h4 className="icra-modal-baslig">Tapşırığı icra etdiniz?</h4>
              <p className="icra-modal-metn">İstəsəniz icra sənədlərini əlavə edə bilərsiniz</p>
              <label className="icra-fayl-btn">
                <FaPaperclip /> Fayl əlavə et
                <input type="file" multiple onChange={handleIcraFaylElave} style={{ display: 'none' }} />
              </label>
              {icraFayllar.length > 0 && (
                <div className="icra-fayllar-list">
                  {icraFayllar.map((f, i) => (
                    <div key={i} className="icra-fayl-item">
                      <span>{f.name}</span>
                      <button onClick={() => setIcraFayllar(prev => prev.filter((_, idx) => idx !== i))}>
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="icra-modal-buttons">
                <button className="icra-legv-btn" onClick={() => { setIcraModalAciq(false); setIcraFayllar([]) }}>
                  Ləğv et
                </button>
                <button className="icra-tedsiq-btn" onClick={handleIcraTedsiq}>
                  Təsdiqləyin
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default TaskDetailModal