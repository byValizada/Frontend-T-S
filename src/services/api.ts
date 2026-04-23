const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// TOKEN
export const getToken = (): string | null => {
  return localStorage.getItem('token')
}

export const setToken = (token: string) => {
  localStorage.setItem('token', token)
}

export const removeToken = () => {
  localStorage.removeItem('token')
}

// HTTP CLIENT
const request = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Xəta baş verdi' }))
    throw new Error(error.message || 'Xəta baş verdi')
  }

  return response.json()
}

// AUTH
export const authAPI = {
  login: async (login: string, parol: string) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, parol })
    })
  },
  logout: async () => {
    return request('/auth/logout', { method: 'POST' })
  }
}

// İSTİFADƏÇİLƏR
export const usersAPI = {
  getAll: async () => {
    return request('/users')
  },
  create: async (user: any) => {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify(user)
    })
  },
  update: async (login: string, data: any) => {
    return request(`/users/${login}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },
  delete: async (login: string) => {
    return request(`/users/${login}`, {
      method: 'DELETE'
    })
  }
}

// TAPŞIRIQLAR
export const tasksAPI = {
  getAll: async () => {
    return request('/tasks')
  },
  create: async (task: any) => {
    return request('/tasks', {
      method: 'POST',
      body: JSON.stringify(task)
    })
  },
  update: async (id: string, data: any) => {
    return request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },
  delete: async (id: string) => {
    return request(`/tasks/${id}`, {
      method: 'DELETE'
    })
  }
}

// ELANLAR
export const elanlarAPI = {
  getAll: async () => {
    return request('/elanlar')
  },
  create: async (elan: any) => {
    return request('/elanlar', {
      method: 'POST',
      body: JSON.stringify(elan)
    })
  },
  markAsRead: async (id: string, login: string) => {
    return request(`/elanlar/${id}/oxu`, {
      method: 'PUT',
      body: JSON.stringify({ login })
    })
  },
  delete: async (id: string) => {
    return request(`/elanlar/${id}`, {
      method: 'DELETE'
    })
  }
}

// AKTİVLİK JURNALI
export const logsAPI = {
  getAll: async () => {
    return request('/logs')
  },
  create: async (log: any) => {
    return request('/logs', {
      method: 'POST',
      body: JSON.stringify(log)
    })
  }
}

// QEYDLƏR
export const notesAPI = {
  getAll: async (login: string) => {
    return request(`/notes/${login}`)
  },
  create: async (login: string, note: any) => {
    return request(`/notes/${login}`, {
      method: 'POST',
      body: JSON.stringify(note)
    })
  },
  update: async (login: string, id: string, data: any) => {
    return request(`/notes/${login}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },
  delete: async (login: string, id: string) => {
    return request(`/notes/${login}/${id}`, {
      method: 'DELETE'
    })
  }
}