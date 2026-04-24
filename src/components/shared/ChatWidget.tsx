import { useState, useEffect, useRef } from 'react'
import {
  FaComments, FaTimes, FaMinus, FaExpand, FaCompress,
  FaSearch, FaPaperPlane, FaArrowLeft, FaPaperclip, FaTrash,
  FaCheck, FaCheckDouble, FaCircle
} from 'react-icons/fa'
import {
  getMessages, sendMessage, markAsRead, deleteMessage,
  getUnreadCount, getUnreadFromUser, getLastMessage,
  setOnlineStatus, isUserOnline
} from './chatService'
import type { ChatMessage } from './chatService'
import './ChatWidget.css'

interface User {
  login: string
  parol: string
  rol: string
  adSoyad: string
  companyId?: string
  bolmeId?: string
}

interface ChatWidgetProps {
  currentUser: User
}

type ChatView = 'closed' | 'list' | 'chat'
type ChatSize = 'normal' | 'minimized' | 'maximized'

function ChatWidget({ currentUser }: ChatWidgetProps) {
  const [view, setView] = useState<ChatView>('closed')
  const [size, setSize] = useState<ChatSize>('normal')
  const [search, setSearch] = useState('')
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [unreadTotal, setUnreadTotal] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Online status güncelle
  useEffect(() => {
    setOnlineStatus(currentUser.login, true)
    const interval = setInterval(() => {
      setOnlineStatus(currentUser.login, true)
    }, 30000)

    return () => {
      clearInterval(interval)
      setOnlineStatus(currentUser.login, false)
    }
  }, [currentUser.login])

  // İstifadəçiləri yüklə
  useEffect(() => {
    const data = localStorage.getItem('users')
    if (data) {
      const users: User[] = JSON.parse(data)
      setAllUsers(users.filter(u => u.login !== currentUser.login && u.rol !== 'SuperAdmin'))
    }
  }, [currentUser.login])

  // Oxunmamış mesaj sayı
  useEffect(() => {
    const updateUnread = () => setUnreadTotal(getUnreadCount(currentUser.login))
    updateUnread()
    const interval = setInterval(updateUnread, 3000)
    return () => clearInterval(interval)
  }, [currentUser.login])

  // Mesajları yenilə (seçili istifadəçi ilə)
  useEffect(() => {
    if (!selectedUser) return
    const updateMessages = () => {
      const msgs = getMessages(currentUser.login, selectedUser.login)
      setMessages(msgs)
      markAsRead(currentUser.login, selectedUser.login)
    }
    updateMessages()
    const interval = setInterval(updateMessages, 2000)
    return () => clearInterval(interval)
  }, [selectedUser, currentUser.login])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // SuperAdmin-i siyahıya əlavə et
  useEffect(() => {
    if (currentUser.rol !== 'SuperAdmin') {
      const data = localStorage.getItem('users')
      if (data) {
        const users: User[] = JSON.parse(data)
        const hasSuper = allUsers.some(u => u.login === 'Tural')
        if (!hasSuper) {
          const superAdmin = users.find(u => u.rol === 'SuperAdmin')
          // SuperAdmin yoxdursa, hardcoded əlavə et
          if (!superAdmin) {
            setAllUsers(prev => [...prev, {
              login: 'Tural',
              parol: '',
              rol: 'SuperAdmin',
              adSoyad: 'Tural Vəlizadə'
            }])
          }
        }
      }
    }
  }, [currentUser.rol, allUsers])

  // Axtarış
  const filteredUsers = allUsers.filter(u => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return u.adSoyad.toLowerCase().includes(q) ||
      u.login.toLowerCase().includes(q) ||
      u.rol.toLowerCase().includes(q)
  })

  // Son yazışmaları olan istifadəçilər (yuxarıda göstərmək üçün)
  const getUsersWithChats = () => {
    return allUsers
      .map(u => ({
        user: u,
        lastMsg: getLastMessage(currentUser.login, u.login),
        unread: getUnreadFromUser(currentUser.login, u.login)
      }))
      .filter(item => item.lastMsg !== null)
      .sort((a, b) => {
        const ta = new Date(a.lastMsg!.tarix).getTime()
        const tb = new Date(b.lastMsg!.tarix).getTime()
        return tb - ta
      })
  }

  // Mesaj göndər
  const handleSend = () => {
    if (!newMessage.trim() || !selectedUser) return

    sendMessage({
      gonderenLogin: currentUser.login,
      gonderenAd: currentUser.adSoyad,
      alanLogin: selectedUser.login,
      alanAd: selectedUser.adSoyad,
      metn: newMessage.trim()
    })

    setNewMessage('')
    // Yenilə
    const msgs = getMessages(currentUser.login, selectedUser.login)
    setMessages(msgs)
  }

  // Fayl göndər
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedUser) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Fayl 2MB-dan böyükdür')
      return
    }

    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })

    sendMessage({
      gonderenLogin: currentUser.login,
      gonderenAd: currentUser.adSoyad,
      alanLogin: selectedUser.login,
      alanAd: selectedUser.adSoyad,
      metn: `📎 ${file.name}`,
      fayl: { name: file.name, type: file.type, base64 }
    })

    e.target.value = ''
    const msgs = getMessages(currentUser.login, selectedUser.login)
    setMessages(msgs)
  }

  // Mesaj sil
  const handleDelete = (msgId: string) => {
    deleteMessage(msgId)
    const msgs = getMessages(currentUser.login, selectedUser!.login)
    setMessages(msgs)
  }

  // Müəssisə/bölmə adını tap
  const getCompanyName = (companyId?: string) => {
    if (!companyId) return ''
    const data = localStorage.getItem('companies')
    if (!data) return ''
    const companies = JSON.parse(data)
    return companies.find((c: any) => c.id === companyId)?.ad || ''
  }

  const getBolmeName = (bolmeId?: string) => {
    if (!bolmeId) return ''
    const data = localStorage.getItem('bolmeler')
    if (!data) return ''
    const bolmeler = JSON.parse(data)
    return bolmeler.find((b: any) => b.id === bolmeId)?.ad || ''
  }

  // İstifadəçi seç
  const openChat = (user: User) => {
    setSelectedUser(user)
    setView('chat')
    markAsRead(currentUser.login, user.login)
  }

  // BAĞLI - yalnız ikon
  if (view === 'closed') {
    return (
      <div className="chat-fab" onClick={() => setView('list')}>
        <FaComments />
        {unreadTotal > 0 && <span className="chat-fab-badge">{unreadTotal}</span>}
      </div>
    )
  }

  // MİNİMİZE - kiçik bar
  if (size === 'minimized') {
    return (
      <div className="chat-minimized" onClick={() => setSize('normal')}>
        <FaComments style={{ marginRight: 8 }} />
        <span>Chat</span>
        {unreadTotal > 0 && <span className="chat-min-badge">{unreadTotal}</span>}
        <button className="chat-min-close" onClick={(e) => { e.stopPropagation(); setView('closed'); setSize('normal') }}>
          <FaTimes />
        </button>
      </div>
    )
  }

  return (
    <div className={`chat-widget ${size === 'maximized' ? 'chat-maximized' : 'chat-normal'}`}>
      {/* BAŞLIQ */}
      <div className="chat-header">
        <div className="chat-header-left">
          {view === 'chat' && (
            <button className="chat-back-btn" onClick={() => { setView('list'); setSelectedUser(null) }}>
              <FaArrowLeft />
            </button>
          )}
          {view === 'chat' && selectedUser ? (
            <div className="chat-header-user">
              <span className="chat-header-name">{selectedUser.adSoyad}</span>
              <span className="chat-header-status">
                {isUserOnline(selectedUser.login) ? (
                  <><FaCircle className="online-dot" /> Online</>
                ) : (
                  <><FaCircle className="offline-dot" /> Offline</>
                )}
              </span>
            </div>
          ) : (
            <span className="chat-header-title">💬 Chat</span>
          )}
        </div>
        <div className="chat-header-btns">
          <button onClick={() => setSize('minimized')} title="Kiçilt"><FaMinus /></button>
          <button onClick={() => setSize(size === 'maximized' ? 'normal' : 'maximized')} title={size === 'maximized' ? 'Normal' : 'Tam ekran'}>
            {size === 'maximized' ? <FaCompress /> : <FaExpand />}
          </button>
          <button onClick={() => { setView('closed'); setSize('normal'); setSelectedUser(null) }} title="Bağla"><FaTimes /></button>
        </div>
      </div>

      {/* İSTİFADƏÇİ SİYAHISI */}
      {view === 'list' && (
        <div className="chat-body">
          <div className="chat-search">
            <FaSearch className="chat-search-icon" />
            <input
              type="text"
              placeholder="Ad, login və ya rol axtar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="chat-user-list">
            {/* Son yazışmalar */}
            {!search.trim() && getUsersWithChats().length > 0 && (
              <>
                <p className="chat-section-title">Son yazışmalar</p>
                {getUsersWithChats().map(({ user, lastMsg, unread }) => (
                  <div key={user.login} className="chat-user-item" onClick={() => openChat(user)}>
                    <div className="chat-user-avatar">
                      {user.adSoyad.charAt(0).toUpperCase()}
                      <span className={`chat-user-dot ${isUserOnline(user.login) ? 'online' : 'offline'}`} />
                    </div>
                    <div className="chat-user-info">
                      <span className="chat-user-name">{user.adSoyad}</span>
                      <span className="chat-user-meta">{user.rol} • {getCompanyName(user.companyId)} {getBolmeName(user.bolmeId) && `• ${getBolmeName(user.bolmeId)}`}</span>
                      <span className="chat-user-last">{lastMsg?.metn}</span>
                    </div>
                    {unread > 0 && <span className="chat-user-unread">{unread}</span>}
                  </div>
                ))}
              </>
            )}

            {/* Axtarış nəticələri / Bütün istifadəçilər */}
            <p className="chat-section-title">{search.trim() ? 'Axtarış nəticəsi' : 'Bütün istifadəçilər'}</p>
            {filteredUsers.length === 0 ? (
              <p className="chat-empty">İstifadəçi tapılmadı</p>
            ) : (
              filteredUsers.map(user => (
                <div key={user.login} className="chat-user-item" onClick={() => openChat(user)}>
                  <div className="chat-user-avatar">
                    {user.adSoyad.charAt(0).toUpperCase()}
                    <span className={`chat-user-dot ${isUserOnline(user.login) ? 'online' : 'offline'}`} />
                  </div>
                  <div className="chat-user-info">
                    <span className="chat-user-name">{user.adSoyad}</span>
                    <span className="chat-user-meta">{user.rol} • {getCompanyName(user.companyId)} {getBolmeName(user.bolmeId) && `• ${getBolmeName(user.bolmeId)}`}</span>
                  </div>
                  {getUnreadFromUser(currentUser.login, user.login) > 0 && (
                    <span className="chat-user-unread">{getUnreadFromUser(currentUser.login, user.login)}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MESAJLAŞMA */}
      {view === 'chat' && selectedUser && (
        <>
          <div className="chat-messages">
            {messages.length === 0 ? (
              <p className="chat-empty">Hələ mesaj yoxdur. İlk mesajı göndər!</p>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`chat-msg ${msg.gonderenLogin === currentUser.login ? 'chat-msg-mine' : 'chat-msg-other'}`}
                >
                  {msg.fayl && msg.fayl.type.startsWith('image/') ? (
                    <img src={msg.fayl.base64} alt={msg.fayl.name} className="chat-msg-img" />
                  ) : msg.fayl ? (
                    <a href={msg.fayl.base64} download={msg.fayl.name} className="chat-msg-file">
                      📎 {msg.fayl.name}
                    </a>
                  ) : (
                    <span className="chat-msg-text">{msg.metn}</span>
                  )}
                  <div className="chat-msg-footer">
                    <span className="chat-msg-time">{msg.tarix}</span>
                    {msg.gonderenLogin === currentUser.login && (
                      <>
                        {msg.oxundu ? (
                          <FaCheckDouble className="chat-msg-read" />
                        ) : (
                          <FaCheck className="chat-msg-unread" />
                        )}
                        <button className="chat-msg-del" onClick={() => handleDelete(msg.id)}>
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-bar">
            <button className="chat-attach-btn" onClick={() => fileInputRef.current?.click()}>
              <FaPaperclip />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <input
              type="text"
              className="chat-input"
              placeholder="Mesaj yazın..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button className="chat-send-btn" onClick={handleSend}>
              <FaPaperPlane />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ChatWidget