// Backend hazır olduqda bu dəyəri true edin
export const USE_BACKEND = false

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// LocalStorage açarları
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USERS: 'users',
  TASKS: 'tasks',
  ELANLAR: 'elanlar',
  ACTIVITY_LOG: 'activityLog',
  CURRENT_USER: 'currentUser'
}