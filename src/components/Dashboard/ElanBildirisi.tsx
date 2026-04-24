import { useState, useEffect } from 'react'
import { FaTimes, FaBullhorn, FaCheck } from 'react-icons/fa'

interface Elan {
  id: string
  baslig: string
  metn: string
  yaranmaTarixi: string
  oxuyanlar: string[]
  alicilar: string[] | 'hamisi'
}

interface User {
  login: string
  parol: string
  rol: string
  adSoyad: string
}

interface ElanBildirisiProps {
  currentUser: User
}

function ElanBildirisi({ currentUser }: ElanBildirisiProps) {
  const [elanlar, setElanlar] = useState<Elan[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    loadElanlar()
  }, [])

  const loadElanlar = () => {
    const data = localStorage.getItem('elanlar')
    if (!data) return

    const allElanlar: Elan[] = JSON.parse(data)

    // Yalnız bu istifadəçiyə aid və oxunmamış elanlar
    const myElanlar = allElanlar.filter(elan => {
      const alici = elan.alicilar === 'hamisi' ||
        (Array.isArray(elan.alicilar) && elan.alicilar.includes(currentUser.login))
      const oxunmamis = !elan.oxuyanlar.includes(currentUser.login)
      return alici && oxunmamis
    })

    setElanlar(myElanlar)
    setActiveIndex(0)
  }

  const handleOxudum = (elanId: string) => {
    // Elanı oxunmuş kimi işarələ
    const data = localStorage.getItem('elanlar')
    if (!data) return

    const allElanlar: Elan[] = JSON.parse(data)
    const updated = allElanlar.map(e => {
      if (e.id === elanId) {
        return {
          ...e,
          oxuyanlar: [...e.oxuyanlar, currentUser.login]
        }
      }
      return e
    })

    localStorage.setItem('elanlar', JSON.stringify(updated))

    // Elanı siyahıdan çıxar
    const newElanlar = elanlar.filter(e => e.id !== elanId)
    setElanlar(newElanlar)
    setActiveIndex(0)
  }

  const handleHamisiniOxudum = () => {
    const data = localStorage.getItem('elanlar')
    if (!data) return

    const allElanlar: Elan[] = JSON.parse(data)
    const updated = allElanlar.map(e => {
      const alici = e.alicilar === 'hamisi' ||
        (Array.isArray(e.alicilar) && e.alicilar.includes(currentUser.login))
      if (alici && !e.oxuyanlar.includes(currentUser.login)) {
        return { ...e, oxuyanlar: [...e.oxuyanlar, currentUser.login] }
      }
      return e
    })

    localStorage.setItem('elanlar', JSON.stringify(updated))
    setElanlar([])
  }

  if (elanlar.length === 0) return null

  const activeElan = elanlar[activeIndex]

  return (
    <div className="elan-bildirisi-overlay">
      <div className="elan-bildirisi-box">

        {/* BAŞLIQ */}
        <div className="elan-bildirisi-header">
          <div className="elan-bildirisi-header-left">
            <FaBullhorn className="elan-bildirisi-ikon" />
            <span>Yeni Elan</span>
            {elanlar.length > 1 && (
              <span className="elan-sayi-badge">{elanlar.length} elan</span>
            )}
          </div>
        </div>

        {/* ELAN MƏTNİ */}
        <div className="elan-bildirisi-body">
          <h3 className="elan-bildirisi-baslig">{activeElan.baslig}</h3>
          <p className="elan-bildirisi-metn">{activeElan.metn}</p>
          <span className="elan-bildirisi-tarix">{activeElan.yaranmaTarixi}</span>
        </div>

        {/* NAVİQASİYA (birdən çox elan varsa) */}
        {elanlar.length > 1 && (
          <div className="elan-nav">
            {elanlar.map((_, i) => (
              <div
                key={i}
                className={`elan-nav-nokta ${i === activeIndex ? 'aktiv' : ''}`}
                onClick={() => setActiveIndex(i)}
              />
            ))}
          </div>
        )}

        {/* DÜYMƏLƏr */}
        <div className="elan-bildirisi-footer">
          {elanlar.length > 1 && (
            <button className="elan-hamisi-btn" onClick={handleHamisiniOxudum}>
              <FaCheck /> Hamısını oxudum
            </button>
          )}
          <div className="elan-bildirisi-footer-right">
            {elanlar.length > 1 && activeIndex < elanlar.length - 1 && (
              <button
                className="elan-novbeti-btn"
                onClick={() => setActiveIndex(activeIndex + 1)}
              >
                Növbəti →
              </button>
            )}
            <button
              className="elan-oxudum-btn"
              onClick={() => handleOxudum(activeElan.id)}
            >
              <FaTimes /> Oxudum, bağla
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ElanBildirisi