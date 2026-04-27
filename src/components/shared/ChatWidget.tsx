import { useState, useEffect, useRef } from 'react'
import {
  FaComments, FaTimes, FaMinus, FaExpand, FaCompress,
  FaSearch, FaPaperPlane, FaArrowLeft, FaPaperclip, FaTrash,
  FaCheck, FaCheckDouble, FaCircle, FaPencilAlt
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
  rutbe?: string
  vezife?: string
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
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const msgInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setOnlineStatus(currentUser.login, true)
    const interval = setInterval(() => setOnlineStatus(currentUser.login, true), 30000)
    return () => { clearInterval(interval); setOnlineStatus(currentUser.login, false) }
  }, [currentUser.login])

  useEffect(() => {
    const data = localStorage.getItem('users')
    if (data) {
      const users: User[] = JSON.parse(data)
      setAllUsers(users.filter(u => u.login !== currentUser.login && u.rol !== 'SuperAdmin'))
    }
  }, [currentUser.login])

  useEffect(() => {
    const updateUnread = () => setUnreadTotal(getUnreadCount(currentUser.login))
    updateUnread()
    const interval = setInterval(updateUnread, 3000)
    return () => clearInterval(interval)
  }, [currentUser.login])

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (currentUser.rol !== 'SuperAdmin') {
      const data = localStorage.getItem('users')
      if (data) {
        const users: User[] = JSON.parse(data)
        const hasSuper = allUsers.some(u => u.login === 'Tural')
        if (!hasSuper) {
          const superAdmin = users.find(u => u.rol === 'SuperAdmin')
          if (!superAdmin) {
            setAllUsers(prev => [...prev, { login: 'Tural', parol: '', rol: 'SuperAdmin', adSoyad: 'Tural Vəlizadə' }])
          }
        }
      }
    }
  }, [currentUser.rol, allUsers])

  const filteredUsers = allUsers.filter(u => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return u.adSoyad.toLowerCase().includes(q) || u.login.toLowerCase().includes(q) || u.rol.toLowerCase().includes(q)
  })

  const getUsersWithChats = () => {
    return allUsers
      .map(u => ({ user: u, lastMsg: getLastMessage(currentUser.login, u.login), unread: getUnreadFromUser(currentUser.login, u.login) }))
      .filter(item => item.lastMsg !== null)
      .sort((a, b) => new Date(b.lastMsg!.tarix).getTime() - new Date(a.lastMsg!.tarix).getTime())
  }

  // Mesaj göndər / redaktəni saxla
  const handleSend = () => {
    if (!newMessage.trim() || !selectedUser) return

    if (editingMsgId) {
      // Edit rejimi - chatService-dən mesajı yenilə
      const allMsgs: ChatMessage[] = JSON.parse(localStorage.getItem('chat_messages') || '[]')
      const updated = allMsgs.map(m =>
        m.id === editingMsgId ? { ...m, metn: newMessage.trim(), redakte: true } : m
      )
      localStorage.setItem('chat_messages', JSON.stringify(updated))
      setMessages(getMessages(currentUser.login, selectedUser.login))
      setEditingMsgId(null)
      setNewMessage('')
    } else {
      sendMessage({
        gonderenLogin: currentUser.login,
        gonderenAd: currentUser.adSoyad,
        alanLogin: selectedUser.login,
        alanAd: selectedUser.adSoyad,
        metn: newMessage.trim()
      })
      setNewMessage('')
      setMessages(getMessages(currentUser.login, selectedUser.login))
    }
  }

  // Karandaş klikdə mesajı input-a at
  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMsgId(msg.id)
    setNewMessage(msg.metn)
    setTimeout(() => msgInputRef.current?.focus(), 50)
  }

  const handleCancelEdit = () => {
    setEditingMsgId(null)
    setNewMessage('')
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedUser) return
    if (file.size > 2 * 1024 * 1024) { alert('Fayl 2MB-dan böyükdür'); return }
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
    setMessages(getMessages(currentUser.login, selectedUser.login))
  }

  const handleDelete = (msgId: string) => {
    deleteMessage(msgId)
    setMessages(getMessages(currentUser.login, selectedUser!.login))
  }

  const getCompanyName = (companyId?: string) => {
    if (!companyId) return ''
    try { return JSON.parse(localStorage.getItem('companies') || '[]').find((c: any) => c.id === companyId)?.ad || '' } catch { return '' }
  }

  const getBolmeName = (bolmeId?: string) => {
    if (!bolmeId) return ''
    try { return JSON.parse(localStorage.getItem('bolmeler') || '[]').find((b: any) => b.id === bolmeId)?.ad || '' } catch { return '' }
  }

  const getUserLine1 = (user: User) => {
    const parts = [user.rol]
    if (user.rutbe) parts.push(user.rutbe)
    if (user.vezife) parts.push(user.vezife)
    return parts.join(' • ')
  }

  const getUserLine2 = (user: User) => {
    const parts = []
    const company = getCompanyName(user.companyId)
    const bolme = getBolmeName(user.bolmeId)
    if (company) parts.push(company)
    if (bolme) parts.push(bolme)
    return parts.join(' • ')
  }

  const openChat = (user: User) => {
    setSelectedUser(user)
    setView('chat')
    markAsRead(currentUser.login, user.login)
  }

  if (view === 'closed') {
    return (
      <div className="chat-fab" onClick={() => setView('list')}>
        <FaComments />
        {unreadTotal > 0 && <span className="chat-fab-badge">{unreadTotal}</span>}
      </div>
    )
  }

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
            <button className="chat-back-btn" onClick={() => { setView('list'); setSelectedUser(null); setEditingMsgId(null); setNewMessage('') }}>
              <FaArrowLeft />
            </button>
          )}
          {view === 'chat' && selectedUser ? (
            <div className="chat-header-user">
              <span className="chat-header-name">{selectedUser.adSoyad}</span>
              <span className="chat-header-status">
                {isUserOnline(selectedUser.login)
                  ? <><FaCircle className="online-dot" /> Online</>
                  : <><FaCircle className="offline-dot" /> Offline</>
                }
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
          <button onClick={() => { setView('closed'); setSize('normal'); setSelectedUser(null); setEditingMsgId(null); setNewMessage('') }} title="Bağla">
            <FaTimes />
          </button>
        </div>
      </div>

      {/* İSTİFADƏÇİ SİYAHISI */}
      {view === 'list' && (
        <div className="chat-body">
          <div className="chat-search">
            <FaSearch className="chat-search-icon" />
            <input type="text" placeholder="Ad Soyad axtar..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="chat-user-list">
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
                      <span className="chat-user-meta">{getUserLine1(user)}</span>
                      {getUserLine2(user) && <span className="chat-user-meta">{getUserLine2(user)}</span>}
                      <span className="chat-user-last">{lastMsg?.metn}</span>
                    </div>
                    {unread > 0 && <span className="chat-user-unread">{unread}</span>}
                  </div>
                ))}
              </>
            )}

            {search.trim() && (
              <>
                <p className="chat-section-title">Axtarış nəticəsi</p>
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
                        <span className="chat-user-meta">{getUserLine1(user)}</span>
                        {getUserLine2(user) && <span className="chat-user-meta">{getUserLine2(user)}</span>}
                      </div>
                      {getUnreadFromUser(currentUser.login, user.login) > 0 && (
                        <span className="chat-user-unread">{getUnreadFromUser(currentUser.login, user.login)}</span>
                      )}
                    </div>
                  ))
                )}
              </>
            )}

            {!search.trim() && getUsersWithChats().length === 0 && (
              <p className="chat-empty">Hələ yazışma yoxdur. Axtarışdan istifadəçi tapın.</p>
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
                    <div className="chat-msg-metn-row">
                      <span className="chat-msg-text">
                        {msg.metn}
                        {(msg as any).redakte && <span className="chat-msg-redakte"> ✎</span>}
                      </span>
                      {msg.gonderenLogin === currentUser.login && (
                        <button
                          className="chat-msg-edit-btn"
                          onClick={() => handleStartEdit(msg)}
                          title="Redaktə et"
                        >
                          <FaPencilAlt />
                        </button>
                      )}
                    </div>
                  )}
                  <div className="chat-msg-footer">
                    <span className="chat-msg-time">{msg.tarix}</span>
                    {msg.gonderenLogin === currentUser.login && (
                      <>
                        {msg.oxundu ? <FaCheckDouble className="chat-msg-read" /> : <FaCheck className="chat-msg-unread" />}
                        <button className="chat-msg-del" onClick={() => handleDelete(msg.id)}><FaTrash /></button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <div className={`chat-input-bar${editingMsgId ? ' editing' : ''}`}>
            {editingMsgId && (
              <div className="chat-edit-indicator">
                <span>✎ Redaktə rejimi</span>
                <button onClick={handleCancelEdit}><FaTimes /></button>
              </div>
            )}
            <div className="chat-input-row">
              {!editingMsgId && (
                <>
                  <button className="chat-attach-btn" onClick={() => fileInputRef.current?.click()}><FaPaperclip /></button>
                  <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} />
                </>
              )}
              <input
                ref={msgInputRef}
                type="text"
                className="chat-input"
                placeholder={editingMsgId ? "Mesajı düzəldin..." : "Mesaj yazın..."}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSend()
                  if (e.key === 'Escape' && editingMsgId) handleCancelEdit()
                }}
              />
              <button className="chat-send-btn" onClick={handleSend}><FaPaperPlane /></button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ChatWidget