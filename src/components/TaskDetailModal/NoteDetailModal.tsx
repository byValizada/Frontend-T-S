import { useState, useEffect } from 'react'
import { FaTimes, FaCheck, FaCalendarAlt, FaClock } from 'react-icons/fa'
import './NoteDetailModal.css'

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

interface NoteDetailModalProps {
  isOpen: boolean
  onClose: () => void
  note: Note | null
  onSave: (updatedNote: Note) => void
}

function NoteDetailModal({ isOpen, onClose, note, onSave }: NoteDetailModalProps) {
  const [metn, setMetn] = useState('')
  const [notlar, setNotlar] = useState('')
  const [tarixAktiv, setTarixAktiv] = useState(false)
  const [saatAktiv, setSaatAktiv] = useState(false)
  const [tarix, setTarix] = useState('')
  const [saat, setSaat] = useState('')

  useEffect(() => {
    if (note) {
      setMetn(note.metn || '')
      setNotlar(note.notlar || '')
      setTarixAktiv(note.tarixAktiv || false)
      setSaatAktiv(note.saatAktiv || false)
      setTarix(note.tarix || '')
      setSaat(note.saat || '')
    }
  }, [note])

  if (!isOpen || !note) return null

  const handleSave = () => {
    const updatedNote: Note = {
      ...note,
      metn: metn || note.metn,
      notlar: notlar.trim(),
      tarixAktiv,
      saatAktiv,
      tarix: tarixAktiv ? tarix : '',
      saat: saatAktiv ? saat : ''
    }
    onSave(updatedNote)
    onClose()
  }

  return (
    <div className="note-detail-overlay" onClick={onClose}>
      <div className="note-detail-box" onClick={e => e.stopPropagation()}>


        {/* BAŞLIQ */}
        <div className="note-detail-header">
          <div></div>
          <button className="note-detail-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* QEYD ADI + NOTLAR */}
        <div className="note-detail-section">
          <input
            className="note-detail-metn-input"
            type="text"
            value={metn}
            onChange={e => setMetn(e.target.value)}
            placeholder="Qeyd"
          />
          <textarea
            className="note-detail-notlar-input"
            value={notlar}
            onChange={e => setNotlar(e.target.value)}
            placeholder="Notlar"
          />
        </div>

        {/* TARİX VƏ SAAT */}
        <div className="note-detail-section">
          <p className="note-detail-section-title">Tarih ve Saat</p>

          <div className="note-detail-row">
            <div className="note-detail-row-left">
              <div className="note-detail-row-icon tarih">
                <FaCalendarAlt />
              </div>
              <span>Tarih</span>
            </div>
            <div className="note-detail-row-right">
              {tarixAktiv && (
                <input
                  type="date"
                  className="note-detail-date-input"
                  value={tarix}
                  onChange={e => setTarix(e.target.value)}
                />
              )}
              <div
                className={`note-toggle ${tarixAktiv ? 'aktiv' : ''}`}
                onClick={() => {
                  setTarixAktiv(!tarixAktiv)
                  if (tarixAktiv) setSaatAktiv(false)
                }}
              >
                <div className="note-toggle-circle" />
              </div>
            </div>
          </div>

          <div className={`note-detail-row ${!tarixAktiv ? 'disabled' : ''}`}>
            <div className="note-detail-row-left">
              <div className="note-detail-row-icon saat">
                <FaClock />
              </div>
              <span>Saat</span>
            </div>
            <div className="note-detail-row-right">
              {saatAktiv && tarixAktiv && (
                <input
                  type="time"
                  className="note-detail-date-input"
                  value={saat}
                  onChange={e => setSaat(e.target.value)}
                />
              )}
              <div
                className={`note-toggle ${saatAktiv && tarixAktiv ? 'aktiv' : ''} ${!tarixAktiv ? 'disabled' : ''}`}
                onClick={() => {
                  if (!tarixAktiv) return
                  setSaatAktiv(!saatAktiv)
                }}
              >
                <div className="note-toggle-circle" />
              </div>
            </div>
          </div>
        </div>
 <div className="note-detail-footer">
          <button className="note-detail-save-btn" onClick={handleSave}>
            <FaCheck /> Təsdiqlə
          </button>
        </div>
      </div>
     
    </div>
  )
}

export default NoteDetailModal