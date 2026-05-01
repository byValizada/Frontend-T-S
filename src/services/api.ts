const API_URL = import.meta.env.VITE_API_URL || "http://10.85.70.142:5128/api";

// TOKEN
export const getToken = (): string | null => localStorage.getItem("token");
export const setToken = (token: string) => localStorage.setItem("token", token);
export const removeToken = () => localStorage.removeItem("token");

// USER MAPPER — backend PascalCase → frontend camelCase
export const mapUserDto = (dto: any) => ({
  id: (dto.id || dto.Id)?.toString() || undefined,
  login: dto.username || dto.Username || dto.login || "",
  parol: "",
  rol: dto.role || dto.Role || dto.rol || "İşçi",
  adSoyad: dto.fullName || dto.FullName || dto.adSoyad || "",
  companyId:
    (dto.muessiseId || dto.MuessiseId || dto.companyId)?.toString() ||
    undefined,
  bolmeId: (dto.bolmeId || dto.BolmeId)?.toString() || undefined,
  ataAdi: dto.ataAdi || undefined,
  rutbe: dto.rutbe || undefined,
  vezife: dto.vezife || undefined,
});

// TASK STATUS MAPPER
const mapTaskItemStatus = (
  s: string,
): "gozlenir" | "icrada" | "tamamlandi" | undefined => {
  if (s === "Pending") return "gozlenir";
  if (s === "InProgress") return "icrada";
  if (s === "Completed") return "tamamlandi";
  return undefined;
};

// TASK MAPPER — backend TaskResponseDto → frontend NewTask
export const mapTaskDto = (dto: any) => ({
  id: (dto.Id || dto.id || "").toString(),
  tapsirigAdi: dto.Title || dto.title || "",
  qeyd: dto.Note || dto.note || dto.Description || dto.description || "",
  veren: dto.CreatorName || dto.creatorName || "",
  verenLogin: dto.CreatorLogin || dto.creatorLogin || "",
  secilmisShexsler: (dto.Assignees || dto.assignees || []).map((a: any) => ({
    id: (a.UserId || a.userId)?.toString(),
    login: a.Login || a.login || "",
    adSoyad: a.FullName || a.fullName || "",
    icraEdilib: (a.Status || a.status) === "Completed",
    status: mapTaskItemStatus(a.Status || a.status),
    nezaretci: a.IsNezaretci || a.isNezaretci || false,
  })),
  deadline:
    dto.Deadline || dto.deadline
      ? new Date(dto.Deadline || dto.deadline).toISOString().split("T")[0]
      : "",
  fayllar: (dto.Files || dto.files || []).map((f: any) => ({
    name: f.FileName || f.fileName || "",
    size: Number(f.FileSize || f.fileSize || 0),
    type: f.ContentType || f.contentType || "",
    base64: f.Base64Data || f.base64Data || "",
  })),
  tarix:
    dto.CreatedAt || dto.createdAt
      ? new Date(dto.CreatedAt || dto.createdAt).toLocaleString("az-AZ")
      : new Date().toLocaleString("az-AZ"),
  tamamlanib: dto.IsCompleted || dto.isCompleted || false,
  tamamlanmaTarixi:
    dto.CompletedAt || dto.completedAt
      ? new Date(dto.CompletedAt || dto.completedAt).toLocaleString("az-AZ")
      : undefined,
  mesajlar: (dto.Comments || dto.comments || []).map((c: any) => ({
    id: (c.Id || c.id || "").toString(),
    yazanLogin: c.AuthorLogin || c.authorLogin || "",
    yazanAd: c.AuthorName || c.authorName || "",
    metn: c.Text || c.text || "",
    tarix:
      c.CreatedAt || c.createdAt
        ? new Date(c.CreatedAt || c.createdAt).toLocaleString("az-AZ")
        : "",
  })),
  tecili: (dto.Priority || dto.priority) === "Critical",
});

// ANNOUNCEMENT MAPPER — backend AnnouncementDto → frontend Elan
export const mapAnnouncementDto = (dto: any) => ({
  id: (dto.Id || dto.id || "").toString(),
  baslig: dto.Title || dto.title || "",
  metn: dto.Text || dto.text || "",
  yaranmaTarixi:
    dto.CreatedAt || dto.createdAt
      ? new Date(dto.CreatedAt || dto.createdAt).toLocaleString("az-AZ")
      : "",
  oxuyanlar: dto.ReadByLogins || dto.readByLogins || [],
  alicilar:
    dto.IsForAll || dto.isForAll
      ? ("hamisi" as const)
      : dto.Recipients || dto.recipients || [],
  gonderenLogin: dto.CreatorLogin || dto.creatorLogin || "",
  gonderenAd: dto.CreatorLogin || dto.creatorLogin || "",
  gonderenRol: "",
  companyId: undefined as string | undefined,
  bolmeId: undefined as string | undefined,
});

// HTTP CLIENT
const request = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    if (response.status === 401) removeToken();
    const error = await response
      .json()
      .catch(() => ({ message: "Xəta baş verdi" }));
    throw new Error(error.message || "Xəta baş verdi");
  }
  if (response.status === 204) return null;
  return response.json();
};

// AUTH
export const authAPI = {
  login: async (login: string, parol: string) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: login, password: parol }),
    }),
  register: async (dto: any) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(dto) }),
  logout: async () => request("/auth/logout", { method: "POST" }),
  me: async () => request("/auth/me"),
};

// İSTİFADƏÇİLƏR
export const usersAPI = {
  getAll: async () => request("/users"),
  create: async (user: any) =>
    request("/users", { method: "POST", body: JSON.stringify(user) }),
  update: async (id: string, data: any) =>
    request(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id: string) => request(`/users/${id}`, { method: "DELETE" }),
};

// TAPŞIRIQLAR
export const tasksAPI = {
  getAll: async () => {
    const data = await request("/tasks/scope");
    return (data || []).map(mapTaskDto);
  },
  create: async (task: any) => {
    const dto = {
      Title: task.tapsirigAdi,
      Note: task.qeyd || "",
      Priority: task.tecili ? 3 : 1,
      AssigneeIds: (task.secilmisShexsler || [])
        .map((s: any) => s.id)
        .filter(Boolean),
      Deadline: task.deadline
        ? new Date(task.deadline + "T00:00:00").toISOString()
        : null,
      Files: (task.fayllar || []).map((f: any) => ({
        FileName: f.name,
        FileSize: f.size,
        ContentType: f.type,
        Base64Data: f.base64,
      })),
    };
    const result = await request("/tasks", {
      method: "POST",
      body: JSON.stringify(dto),
    });
    return mapTaskDto(result);
  },
  update: async (id: string, data: any) => {
    const dto: any = {
      Title: data.tapsirigAdi || data.Title || "",
      Note: data.qeyd ?? data.Note ?? "",
      Priority: data.tecili ? 3 : 1,
      Assignees: (data.secilmisShexsler || [])
        .filter((s: any) => s.id)
        .map((s: any) => ({ Id: s.id, IsNezaretci: s.nezaretci || false })),
      Deadline: data.deadline
        ? new Date(data.deadline + "T00:00:00").toISOString()
        : null,
      Files: (data.fayllar || []).map((f: any) => ({
        FileName: f.name,
        FileSize: f.size,
        ContentType: f.type,
        Base64Data: f.base64,
      })),
    };
    const result = await request(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(dto),
    });
    return result ? mapTaskDto(result) : null;
  },
  delete: async (id: string) => request(`/tasks/${id}`, { method: "DELETE" }),
  complete: async (id: string) =>
    request(`/tasks/${id}/complete`, { method: "PATCH" }),
  updateStatus: async (id: string, status: string) =>
    request(`/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(status),
    }),
  addComment: async (id: string, text: string) =>
    request(`/tasks/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ Text: text }),
    }),
};

// ELANLAR (Announcements)
export const elanlarAPI = {
  getAll: async () => {
    const data = await request("/announcements");
    return (data || []).map(mapAnnouncementDto);
  },
  getAllSent: async () => {
    const data = await request("/announcements/all");
    return (data || []).map(mapAnnouncementDto);
  },
  create: async (elan: any) => {
    const dto = {
      Title: elan.baslig,
      Text: elan.metn,
      IsForAll: elan.alicilar === "hamisi",
      RecipientLogins: elan.alicilar !== "hamisi" ? elan.alicilar : [],
    };
    const result = await request("/announcements", {
      method: "POST",
      body: JSON.stringify(dto),
    });
    return mapAnnouncementDto(result);
  },
  markAsRead: async (id: string, _login: string) =>
    request(`/announcements/${id}/read`, { method: "POST" }),
  delete: async (id: string) =>
    request(`/announcements/${id}`, { method: "DELETE" }),
};

// MÜƏSSİSƏLƏR
export const mapMuessiseDto = (dto: any) => ({
  id: (dto.Id || dto.id || "").toString(),
  ad: dto.Ad || dto.ad || "",
  adminLogin: dto.AdminUsername || dto.adminUsername || "",
  yaranmaTarixi:
    dto.YaranmaTarixi || dto.yaranmaTarixi
      ? new Date(dto.YaranmaTarixi || dto.yaranmaTarixi).toLocaleDateString(
          "az-AZ",
        )
      : "",
  userCount: dto.UserCount || dto.userCount || 0,
  bolmeCount: dto.BolmeCount || dto.bolmeCount || 0,
});

export const mapBolmeDto = (dto: any) => ({
  id: (dto.Id || dto.id || "").toString(),
  ad: dto.Ad || dto.ad || "",
  companyId: (dto.MuessiseId || dto.muessiseId || "").toString(),
  adminLogin: dto.AdminUsername || dto.adminUsername || undefined,
  userCount: dto.UserCount || dto.userCount || 0,
});

export const muessiselerAPI = {
  getAll: async () => request("/muessiseler"),
  getById: async (id: string) => request(`/muessiseler/${id}`),
  create: async (dto: any) =>
    request("/muessiseler", { method: "POST", body: JSON.stringify(dto) }),
  delete: async (id: string) =>
    request(`/muessiseler/${id}`, { method: "DELETE" }),
};

export const bolmelerAPI = {
  getAll: async (muessiseId?: string) =>
    request(muessiseId ? `/bolmeler?muessiseId=${muessiseId}` : "/bolmeler"),
  create: async (dto: any) =>
    request("/bolmeler", { method: "POST", body: JSON.stringify(dto) }),
  delete: async (id: string) =>
    request(`/bolmeler/${id}`, { method: "DELETE" }),
};

// AKTİVLİK JURNALI
export const logsAPI = {
  getAll: async () => request("/activitylog"),
  create: async (log: any) =>
    request("/activitylog", { method: "POST", body: JSON.stringify(log) }),
};

// QEYDLƏR
const mapNoteDto = (dto: any) => ({
  id: (dto.Id || dto.id || "").toString(),
  metn: dto.Metn || dto.metn || "",
  notlar: dto.Notlar || dto.notlar || "",
  tamamlanib: dto.Tamamlanib ?? dto.tamamlanib ?? false,
  yaranmaTarixi: dto.YaranmaTarixi || dto.yaranmaTarixi || "",
  tarixAktiv: dto.TarixAktiv ?? dto.tarixAktiv ?? false,
  saatAktiv: dto.SaatAktiv ?? dto.saatAktiv ?? false,
  tarix: dto.Tarix || dto.tarix || undefined,
  saat: dto.Saat || dto.saat || undefined,
});

export const notesAPI = {
  getAll: async (_login: string) => {
    const data = await request("/notes");
    return (data || []).map(mapNoteDto);
  },
  create: async (_login: string, note: any) => {
    const dto = {
      Metn: note.metn || "",
      Notlar: note.notlar || "",
      Tamamlanib: note.tamamlanib ?? false,
      TarixAktiv: note.tarixAktiv ?? false,
      SaatAktiv: note.saatAktiv ?? false,
      Tarix: note.tarix || null,
      Saat: note.saat || null,
    };
    const result = await request("/notes", {
      method: "POST",
      body: JSON.stringify(dto),
    });
    return mapNoteDto(result);
  },
  update: async (_login: string, id: string, data: any) => {
    const dto = {
      Metn: data.metn || "",
      Notlar: data.notlar || "",
      Tamamlanib: data.tamamlanib ?? false,
      TarixAktiv: data.tarixAktiv ?? false,
      SaatAktiv: data.saatAktiv ?? false,
      Tarix: data.tarix || null,
      Saat: data.saat || null,
    };
    const result = await request(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(dto),
    });
    return result ? mapNoteDto(result) : null;
  },
  delete: async (_login: string, id: string) => {
    await request(`/notes/${id}`, { method: "DELETE" });
    return null;
  },
};
