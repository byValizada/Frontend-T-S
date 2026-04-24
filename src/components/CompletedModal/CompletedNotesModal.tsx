import { useState } from 'react'
import { FaTimes, FaSearch } from 'react-icons/fa'
import './CompletedNotesModal.css'
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

interface CompletedNotesModalProps {
  isOpen: boolean
  onClose: () => void
  notes: Note[]
  onRestore: (id: string) => void
}

function CompletedNotesModal({ isOpen, onClose, notes, onRestore }: CompletedNotesModalProps) {
  const [axtaris, setAxtaris] = useState('')

  if (!isOpen) return null

  const filteredNotes = notes.filter(n =>
    n.metn.toLowerCase().includes(axtaris.toLowerCase()) ||
    (n.notlar && n.notlar.toLowerCase().includes(axtaris.toLowerCase()))
  )

  return (
    <div className="completed-overlay" onClick={onClose}>
      <div className="completed-box" onClick={e => e.stopPropagation()}>

        {/* BAŞLIQ */}
        <div className="completed-header">
          <h3>Tamamlanmış qeydlər</h3>
          <button className="completed-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* AXTARIŞ */}
        <div className="completed-search">
          <FaSearch className="completed-search-icon" />
          <input
            type="text"
            placeholder="Qeyd axtar..."
            value={axtaris}
            onChange={e => setAxtaris(e.target.value)}
          />
        </div>

        {/* QEYDLƏR */}
        <div className="completed-list">
          {filteredNotes.length === 0 ? (
            <p className="completed-bos">
              {axtaris ? 'Axtarışa uyğun qeyd tapılmadı' : 'Tamamlanmış qeyd yoxdur'}
            </p>
          ) : (
            filteredNotes.map(note => (
<div key={note.id} className="completed-note-card">
                <div className="completed-note-card-left">
                  <div className="completed-note-check">✓</div>
                </div>
                <div className="completed-note-card-body">
                  <span className="completed-note-metn">{note.metn}</span>
                  {note.notlar && (
                    <span className="completed-note-notlar">{note.notlar}</span>
                  )}
                  <div className="completed-note-meta">
                    {note.tarix && (
                      <span className="completed-note-tarix">📅 {note.tarix} {note.saat}</span>
                    )}
                    <span className="completed-note-vaxt">{note.yaranmaTarixi}</span>
                  </div>
                </div>
                <button
                  className="completed-note-restore"
                  onClick={() => onRestore(note.id)}
                  title="Geri qaytır"
                >
                  ↩
                </button>
              </div>
            ))
          )}
        </div>

        <div className="completed-footer">
          <span>{filteredNotes.length} qeyd</span>
        </div>

      </div>
    </div>
  )
}

export default CompletedNotesModal