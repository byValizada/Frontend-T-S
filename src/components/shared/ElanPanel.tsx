import { useState, useEffect } from 'react'
import { FaTrash, FaPlus, FaCheck, FaTimes, FaEye } from 'react-icons/fa'
import { elanlarAPI } from '../../services/api'
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
  const [ugurlu, setUgurlu] = useState('')
  const [aciqElanId, setAciqElanId] = useState<string | null>(null)

  const [elanlar, setElanlar] = useState<Elan[]>([])

  useEffect(() => { loadElanlar() }, [currentUser.login])

  const loadElanlar = async () => {
    try {
      const all: Elan[] = await elanlarAPI.getAllSent()
      setElanlar((all || []).filter(e => e.gonderenLogin === currentUser.login).reverse())
    } catch {
      try {
        const all: Elan[] = await elanlarAPI.getAll()
        setElanlar((all || []).filter(e => e.gonderenLogin === currentUser.login).reverse())
      } catch { setElanlar([]) }
    }
  }

  const toggleAlici = (login: string) => {
    setSecilmisAlicilar(prev =>
      prev.includes(login) ? prev.filter(l => l !== login) : [...prev, login]
    )
  }

  const handleGonder = async () => {
    if (!baslig.trim()) { setXeta('Başlıq daxil edin'); return }
    if (!metn.trim()) { setXeta('Elan mətni daxil edin'); return }
    if (!hamiseyaGonder && secilmisAlicilar.length === 0) { setXeta('Ən azı bir alıcı seçin'); return }
    try {
      await elanlarAPI.create({
        baslig: baslig.trim(),
        metn: metn.trim(),
        alicilar: hamiseyaGonder ? 'hamisi' : secilmisAlicilar,
      })
      setBaslig(''); setMetn(''); setSecilmisAlicilar([]); setXeta('')
      setUgurlu('Elan uğurla göndərildi!')
      setTimeout(() => setUgurlu(''), 3000)
      await loadElanlar()
    } catch (err: any) { setXeta(err.message || 'Xəta baş verdi') }
  }

  const handleSil = async (id: string) => {
    try {
      await elanlarAPI.delete(id)
      setElanlar(prev => prev.filter(e => e.id !== id))
    } catch (err: any) { setXeta(err.message || 'Xəta baş verdi') }
  }

  // Elanın alıcı listəsi
  const getAlicilar = (elan: Elan): User[] => {
    if (elan.alicilar === 'hamisi') return users.filter(u => u.login !== currentUser.login)
    return users.filter(u => (elan.alicilar as string[]).includes(u.login))
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
            <input type="text" value={baslig} onChange={e => setBaslig(e.target.value)} placeholder="Elanın başlığı..." />
          </div>

          <div className="elan-form-group">
            <label>Mətn *</label>
            <textarea value={metn} onChange={e => setMetn(e.target.value)} placeholder="Elanın mətni..." rows={4} />
          </div>

          <div className="elan-form-group">
            <label>Alıcılar</label>
            <div className="elan-alici-secim">
              <div className={`elan-alici-btn ${hamiseyaGonder ? 'selected' : ''}`} onClick={() => setHamiseyaGonder(true)}>
                Hamısına göndər
              </div>
              <div className={`elan-alici-btn ${!hamiseyaGonder ? 'selected' : ''}`} onClick={() => setHamiseyaGonder(false)}>
                Seçilmişlərə göndər
              </div>
            </div>

            {!hamiseyaGonder && (
              <div className="elan-alici-list">
                {otherUsers.map(user => (
                  <div key={user.login} className={`elan-alici-item ${secilmisAlicilar.includes(user.login) ? 'selected' : ''}`} onClick={() => toggleAlici(user.login)}>
                    <input type="checkbox" checked={secilmisAlicilar.includes(user.login)} readOnly />
                    <span>{user.adSoyad}</span>
                    <span className="elan-alici-rol">{user.rol}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {xeta && <p className="elan-xeta">{xeta}</p>}
          {ugurlu && <p className="elan-ugurlu">{ugurlu}</p>}

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
              {elanlar.map(elan => {
                const alicilar = getAlicilar(elan)
                const oxuyanSay = elan.oxuyanlar.length
                const cemiSay = alicilar.length
                const isOpen = aciqElanId === elan.id

                return (
                  <div key={elan.id} className="elan-item">
                    <div className="elan-item-header">
                      <span className="elan-item-baslig">{elan.baslig}</span>
                      <div className="elan-item-actions">
                        <button
                          className="elan-oxuyan-btn"
                          onClick={() => setAciqElanId(isOpen ? null : elan.id)}
                          title="Oxuyanları gör"
                        >
                          <FaEye /> {oxuyanSay}/{cemiSay}
                        </button>
                        <button className="elan-sil-btn" onClick={() => handleSil(elan.id)} title="Sil">
                          <FaTrash />
                        </button>
                      </div>
                    </div>

                    <p className="elan-item-metn">{elan.metn}</p>

                    {/* OXUYANLAR SİYAHISI */}
                    {isOpen && (
                      <div className="elan-oxuyanlar-panel">
                        <div className="elan-oxuyanlar-baslig">
                          <FaEye /> Oxuyanlar ({oxuyanSay}/{cemiSay})
                          <button onClick={() => setAciqElanId(null)}><FaTimes /></button>
                        </div>
                        <div className="elan-oxuyanlar-list">
                          {alicilar.map(u => {
                            const oxuyub = elan.oxuyanlar.includes(u.login)
                            return (
                              <div key={u.login} className={`elan-oxuyan-item ${oxuyub ? 'oxuyub' : 'oxumayib'}`}>
                                <div className="elan-oxuyan-avatar">{u.adSoyad.charAt(0)}</div>
                                <span className="elan-oxuyan-ad">{u.adSoyad}</span>
                                <span className="elan-oxuyan-rol">{u.rol}</span>
                                <span className={`elan-oxuyan-status ${oxuyub ? 'oxuyub' : 'oxumayib'}`}>
                                  {oxuyub ? <><FaCheck /> Oxudu</> : <><FaTimes /> Oxumadı</>}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="elan-item-footer">
                      <span className="elan-item-tarix">{elan.yaranmaTarixi}</span>
                      <span className="elan-item-alici">
                        {elan.alicilar === 'hamisi' ? 'Hamısına' : `${(elan.alicilar as string[]).length} nəfərə`} göndərildi
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default ElanPanel