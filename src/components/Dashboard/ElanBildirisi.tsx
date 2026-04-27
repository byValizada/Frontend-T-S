import { useState, useEffect } from 'react'
import { FaBullhorn, FaCheck } from 'react-icons/fa'
import './ElanBildirisi.css'

interface User {
  login: string
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

interface Props {
  currentUser: User
}

function ElanBildirisi({ currentUser }: Props) {
  const [oxunmamisElanlar, setOxunmamisElanlar] = useState<Elan[]>([])
  const [aktifIndex, setAktifIndex] = useState(0)

  const getOxunmamisElanlar = (): Elan[] => {
    try {
      const data = localStorage.getItem('elanlar')
      if (!data) return []
      const all: Elan[] = JSON.parse(data)
      return all.filter(e => {
        if (e.gonderenLogin === currentUser.login) return false
        const menimUcun = e.alicilar === 'hamisi' ||
          (Array.isArray(e.alicilar) && e.alicilar.includes(currentUser.login))
        if (!menimUcun) return false
        return !e.oxuyanlar.includes(currentUser.login)
      })
    } catch { return [] }
  }

  useEffect(() => {
    const check = () => setOxunmamisElanlar(getOxunmamisElanlar())
    check()
    const interval = setInterval(check, 3000)
    return () => clearInterval(interval)
  }, [currentUser.login])

  const handleOxudum = () => {
    const elan = oxunmamisElanlar[aktifIndex]
    if (!elan) return

    try {
      const data = localStorage.getItem('elanlar')
      const all: Elan[] = data ? JSON.parse(data) : []
      const updated = all.map(e =>
        e.id === elan.id
          ? { ...e, oxuyanlar: [...e.oxuyanlar, currentUser.login] }
          : e
      )
      localStorage.setItem('elanlar', JSON.stringify(updated))
    } catch {}

    const yeniOxunmamislar = oxunmamisElanlar.filter(e => e.id !== elan.id)
    setOxunmamisElanlar(yeniOxunmamislar)
    setAktifIndex(0)
  }

  if (oxunmamisElanlar.length === 0) return null

  const elan = oxunmamisElanlar[aktifIndex]

  return (
    <div className="elan-bildirisi-overlay">
      <div className="elan-bildirisi-modal">

        {/* BAŞLIQ */}
        <div className="elan-bildirisi-header">
          <div className="elan-bildirisi-icon">
            <FaBullhorn />
          </div>
          <div>
            <span className="elan-bildirisi-label">Yeni Elan</span>
            <p className="elan-bildirisi-gonderen">{elan.gonderenAd}</p>
          </div>
          {oxunmamisElanlar.length > 1 && (
            <span className="elan-bildirisi-say">{aktifIndex + 1}/{oxunmamisElanlar.length}</span>
          )}
        </div>

        {/* MƏZMUN */}
        <div className="elan-bildirisi-body">
          <h2 className="elan-bildirisi-baslig">{elan.baslig}</h2>
          <p className="elan-bildirisi-metn">{elan.metn}</p>
          <span className="elan-bildirisi-tarix">{elan.yaranmaTarixi}</span>
        </div>

        {/* XƏBƏRDARLIQ */}
        <div className="elan-bildirisi-xeberdarlig">
          ⚠️ Bu elanı oxuyana qədər tapşırıqlara daxil ola bilməzsiniz
        </div>

        {/* DÜYMƏ */}
        <button className="elan-bildirisi-btn" onClick={handleOxudum}>
          <FaCheck /> Oxudum, bağla
        </button>

        {/* ÇOXLU ELAN NAVİGASİYASI */}
        {oxunmamisElanlar.length > 1 && (
          <div className="elan-bildirisi-nav">
            {oxunmamisElanlar.map((_, i) => (
              <div
                key={i}
                className={`elan-bildirisi-dot${i === aktifIndex ? ' aktiv' : ''}`}
                onClick={() => setAktifIndex(i)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default ElanBildirisi