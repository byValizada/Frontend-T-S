import { useState } from 'react'
import { FaBullhorn, FaTrash, FaPlus } from 'react-icons/fa'
import './ElanPanel.css'

interface User {
  login: string
  parol: string
  rol: string
  adSoyad: string
  companyId?: string
  bolmeId?: string
}

export interface Elan {
  id: string
  baslig: string
  metn: string
  yaranmaTarixi: string
  oxuyanlar: string[]
  alicilar: string[] | 'hamisi'
  gonderenLogin: string
  gonderenAd: string
  gonderenRol: string
  companyId?: string
  bolmeId?: string
}

interface ElanPanelProps {
  users: User[]
  currentUser: User
}

function ElanPanel({ users, currentUser }: ElanPanelProps) {
  const [baslig, setBaslig] = useState('')
  const [metn, setMetn] = useState('')
  const [secilmisAlicilar, setSecilmisAlicilar] = useState<string[]>([])
  const [hamiseyaGonder, setHamiseyaGonder] = useState(true)
  const [xeta, setXeta] = useState('')

  const getElanlar = (): Elan[] => {
    const data = localStorage.getItem('elanlar')
    if (!data) return []
    const all: Elan[] = JSON.parse(data)

    // Rola görə filter - yalnız öz göndərdikləri görünsün
    return all
      .filter(e => e.gonderenLogin === currentUser.login)
      .reverse()
  }

  const elanlar = getElanlar()

  const toggleAlici = (login: string) => {
    setSecilmisAlicilar(prev =>
      prev.includes(login) ? prev.filter(l => l !== login) : [...prev, login]
    )
  }

  const handleGonder = () => {
    if (!baslig.trim()) {
      setXeta('Başlıq daxil edin')
      return
    }
    if (!metn.trim()) {
      setXeta('Elan mətni daxil edin')
      return
    }
    if (!hamiseyaGonder && secilmisAlicilar.length === 0) {
      setXeta('Ən azı bir alıcı seçin')
      return
    }

    const yeniElan: Elan = {
      id: Date.now().toString(),
      baslig: baslig.trim(),
      metn: metn.trim(),
      yaranmaTarixi: new Date().toLocaleString('az-AZ'),
      oxuyanlar: [],
      alicilar: hamiseyaGonder ? 'hamisi' : secilmisAlicilar,
      gonderenLogin: currentUser.login,
      gonderenAd: currentUser.adSoyad,
      gonderenRol: currentUser.rol,
      companyId: currentUser.companyId,
      bolmeId: currentUser.bolmeId
    }

    const data = localStorage.getItem('elanlar')
    const elanlarList: Elan[] = data ? JSON.parse(data) : []
    localStorage.setItem('elanlar', JSON.stringify([...elanlarList, yeniElan]))

    setBaslig('')
    setMetn('')
    setSecilmisAlicilar([])
    setXeta('')
  }

  const handleSil = (id: string) => {
    const data = localStorage.getItem('elanlar')
    const elanlarList: Elan[] = data ? JSON.parse(data) : []
    const updated = elanlarList.filter(e => e.id !== id)
    localStorage.setItem('elanlar', JSON.stringify(updated))
    // Force re-render
    setBaslig(prev => prev + '')
  }

  const otherUsers = users.filter(u => u.login !== currentUser.login && u.rol !== 'SuperAdmin')

  return (
    <div>
      

      <div className="elan-icerik">
        {/* YENİ ELAN FORMU */}
        <div className="elan-form">
          <h4 className="elan-form-baslig">Yeni elan göndər</h4>

          <div className="elan-form-group">
            <label>Başlıq *</label>
            <input
              type="text"
              value={baslig}
              onChange={e => setBaslig(e.target.value)}
              placeholder="Elanın başlığı..."
            />
          </div>

          <div className="elan-form-group">
            <label>Mətn *</label>
            <textarea
              value={metn}
              onChange={e => setMetn(e.target.value)}
              placeholder="Elanın mətni..."
              rows={3}
            />
          </div>

          <div className="elan-form-group">
            <label>Alıcılar</label>
            <div className="elan-alici-secim">
              <div
                className={`elan-alici-btn ${hamiseyaGonder ? 'selected' : ''}`}
                onClick={() => setHamiseyaGonder(true)}
              >
                Hamısına göndər
              </div>
              <div
                className={`elan-alici-btn ${!hamiseyaGonder ? 'selected' : ''}`}
                onClick={() => setHamiseyaGonder(false)}
              >
                Seçilmişlərə göndər
              </div>
            </div>

            {!hamiseyaGonder && (
              <div className="elan-alici-list">
                {otherUsers.map(user => (
                  <div
                    key={user.login}
                    className={`elan-alici-item ${secilmisAlicilar.includes(user.login) ? 'selected' : ''}`}
                    onClick={() => toggleAlici(user.login)}
                  >
                    <input
                      type="checkbox"
                      checked={secilmisAlicilar.includes(user.login)}
                      readOnly
                    />
                    <span>{user.adSoyad}</span>
                    <span className="elan-alici-rol">{user.rol}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {xeta && <p className="elan-xeta">{xeta}</p>}

          <button className="elan-gonder-btn" onClick={handleGonder}>
            <FaPlus /> Elan göndər
          </button>
        </div>

        {/* GÖNDƏRILMIŞ ELANLAR */}
        <div className="elan-list-wrapper">
          <h4 className="elan-form-baslig">Göndərilmiş elanlar ({elanlar.length})</h4>
          {elanlar.length === 0 ? (
            <p className="elan-bos">Hələ elan göndərilməyib</p>
          ) : (
            <div className="elan-list">
              {elanlar.map(elan => (
                <div key={elan.id} className="elan-item">
                  <div className="elan-item-header">
                    <span className="elan-item-baslig">{elan.baslig}</span>
                    <div className="elan-item-actions">
                      <span className="elan-oxuyan">
                        {elan.oxuyanlar.length} oxudu
                      </span>
                      <button
                        className="elan-sil-btn"
                        onClick={() => handleSil(elan.id)}
                        title="Sil"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <p className="elan-item-metn">{elan.metn}</p>
                  <div className="elan-item-footer">
                    <span className="elan-item-tarix">{elan.yaranmaTarixi}</span>
                    <span className="elan-item-alici">
                      {elan.alicilar === 'hamisi' ? 'Hamısına' : `${(elan.alicilar as string[]).length} nəfərə`} göndərildi
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ElanPanel