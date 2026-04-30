import { getToken } from '../../services/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://10.206.156.142:5128/api'

export interface ChatMessage {
  id: string
  gonderenLogin: string
  gonderenAd: string
  alanLogin: string
  alanAd: string
  metn: string
  tarix: string
  createdAtIso: string
  oxundu: boolean
  silindi?: boolean
  redakte?: boolean
  fayl?: { name: string; type: string; base64: string }
}

export interface Conversation {
  partnerLogin: string
  lastMessage: ChatMessage
  unreadCount: number
}

const req = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers })
  if (!res.ok) throw new Error(`Chat API error: ${res.status}`)
  if (res.status === 204) return null
  return res.json()
}

const mapMsg = (dto: any): ChatMessage => ({
  id: (dto.Id || dto.id || '').toString(),
  gonderenLogin: dto.SenderLogin || dto.senderLogin || '',
  gonderenAd: dto.SenderName || dto.senderName || '',
  alanLogin: dto.ReceiverLogin || dto.receiverLogin || '',
  alanAd: dto.ReceiverName || dto.receiverName || '',
  metn: dto.Text || dto.text || '',
  createdAtIso: dto.CreatedAt || dto.createdAt || new Date().toISOString(),
  tarix: (dto.CreatedAt || dto.createdAt)
    ? new Date(dto.CreatedAt || dto.createdAt).toLocaleString('az-AZ')
    : new Date().toLocaleString('az-AZ'),
  oxundu: dto.IsRead ?? dto.isRead ?? false,
  silindi: dto.IsDeleted ?? dto.isDeleted ?? false,
  redakte: dto.IsEdited ?? dto.isEdited ?? false,
  fayl: (dto.FileName || dto.fileName)
    ? { name: dto.FileName || dto.fileName, type: dto.FileType || dto.fileType || '', base64: dto.FileBase64 || dto.fileBase64 || '' }
    : undefined,
})

export const getMessages = async (_login1: string, login2: string): Promise<ChatMessage[]> => {
  const data = await req(`/chat/messages?with=${encodeURIComponent(login2)}`)
  return (data || []).map(mapMsg)
}

export const sendMessage = async (message: Omit<ChatMessage, 'id' | 'tarix' | 'createdAtIso' | 'oxundu'>): Promise<ChatMessage> => {
  const dto = {
    ReceiverLogin: message.alanLogin,
    ReceiverName: message.alanAd,
    Text: message.metn,
    FileName: message.fayl?.name ?? null,
    FileType: message.fayl?.type ?? null,
    FileBase64: message.fayl?.base64 ?? null,
  }
  const result = await req('/chat/messages', { method: 'POST', body: JSON.stringify(dto) })
  return mapMsg(result)
}

export const markAsRead = async (_currentLogin: string, senderLogin: string): Promise<void> => {
  await req(`/chat/messages/read?from=${encodeURIComponent(senderLogin)}`, { method: 'PATCH' })
}

export const deleteMessage = async (messageId: string): Promise<void> => {
  await req(`/chat/messages/${messageId}`, { method: 'DELETE' })
}

export const editMessage = async (messageId: string, text: string): Promise<void> => {
  await req(`/chat/messages/${messageId}`, { method: 'PATCH', body: JSON.stringify({ Text: text }) })
}

export const getUnreadCount = async (): Promise<number> => {
  const data = await req('/chat/unread')
  return data?.count ?? 0
}

export const getConversations = async (): Promise<Conversation[]> => {
  const data = await req('/chat/conversations')
  return (data || []).map((c: any) => ({
    partnerLogin: c.PartnerLogin || c.partnerLogin || '',
    lastMessage: mapMsg(c.LastMessage || c.lastMessage || {}),
    unreadCount: c.UnreadCount ?? c.unreadCount ?? 0,
  }))
}

export const heartbeat = async (): Promise<void> => {
  await req('/chat/heartbeat', { method: 'POST' })
}

export const getOnlineUsers = async (): Promise<Set<string>> => {
  const data = await req('/chat/online')
  return new Set<string>(data || [])
}
