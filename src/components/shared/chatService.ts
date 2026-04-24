export interface ChatMessage {
  id: string
  gonderenLogin: string
  gonderenAd: string
  alanLogin: string
  alanAd: string
  metn: string
  tarix: string
  oxundu: boolean
  silindi?: boolean
  fayl?: {
    name: string
    type: string
    base64: string
  }
}

// Bütün mesajları al
export const getAllMessages = (): ChatMessage[] => {
  const data = localStorage.getItem('chatMessages')
  return data ? JSON.parse(data) : []
}

// İki şəxs arasındakı mesajları al
export const getMessages = (login1: string, login2: string): ChatMessage[] => {
  const all = getAllMessages()
  return all.filter(m =>
    !m.silindi &&
    ((m.gonderenLogin === login1 && m.alanLogin === login2) ||
     (m.gonderenLogin === login2 && m.alanLogin === login1))
  )
}

// Mesaj göndər
export const sendMessage = (message: Omit<ChatMessage, 'id' | 'tarix' | 'oxundu'>): ChatMessage => {
  const all = getAllMessages()
  const newMsg: ChatMessage = {
    ...message,
    id: Date.now().toString(),
    tarix: new Date().toLocaleString('az-AZ'),
    oxundu: false
  }
  localStorage.setItem('chatMessages', JSON.stringify([...all, newMsg]))
  return newMsg
}

// Mesajları oxundu et
export const markAsRead = (currentLogin: string, senderLogin: string) => {
  const all = getAllMessages()
  const updated = all.map(m =>
    m.gonderenLogin === senderLogin && m.alanLogin === currentLogin && !m.oxundu
      ? { ...m, oxundu: true }
      : m
  )
  localStorage.setItem('chatMessages', JSON.stringify(updated))
}

// Mesaj sil
export const deleteMessage = (messageId: string) => {
  const all = getAllMessages()
  const updated = all.map(m =>
    m.id === messageId ? { ...m, silindi: true } : m
  )
  localStorage.setItem('chatMessages', JSON.stringify(updated))
}

// Oxunmamış mesaj sayı
export const getUnreadCount = (currentLogin: string): number => {
  const all = getAllMessages()
  return all.filter(m =>
    m.alanLogin === currentLogin && !m.oxundu && !m.silindi
  ).length
}

// Şəxsə görə oxunmamış say
export const getUnreadFromUser = (currentLogin: string, senderLogin: string): number => {
  const all = getAllMessages()
  return all.filter(m =>
    m.gonderenLogin === senderLogin && m.alanLogin === currentLogin && !m.oxundu && !m.silindi
  ).length
}

// Son mesaj (chat list üçün)
export const getLastMessage = (login1: string, login2: string): ChatMessage | null => {
  const msgs = getMessages(login1, login2)
  return msgs.length > 0 ? msgs[msgs.length - 1] : null
}

// Online status
export const setOnlineStatus = (login: string, online: boolean) => {
  const data = localStorage.getItem('onlineUsers')
  const onlineUsers: Record<string, string> = data ? JSON.parse(data) : {}
  if (online) {
    onlineUsers[login] = new Date().toISOString()
  } else {
    delete onlineUsers[login]
  }
  localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers))
}

export const isUserOnline = (login: string): boolean => {
  const data = localStorage.getItem('onlineUsers')
  if (!data) return false
  const onlineUsers: Record<string, string> = JSON.parse(data)
  if (!onlineUsers[login]) return false
  // 2 dəqiqə ərzində aktiv olanlar online sayılır
  const lastSeen = new Date(onlineUsers[login]).getTime()
  const now = Date.now()
  return now - lastSeen < 2 * 60 * 1000
}