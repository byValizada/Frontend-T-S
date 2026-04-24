// VERİ STRUKTURLARı

export interface Company {
  id: string;
  ad: string;
  adminLogin: string;
  yaranmaTarixi: string;
}

export interface Bolme {
  id: string;
  ad: string;
  companyId: string;
  adminLogin?: string;
}

export interface User {
  login: string;
  parol: string;
  rol: "SuperAdmin" | "Admin" | "BolmeAdmin" | "Müavin" | "İşçi";
  adSoyad: string;
  companyId?: string;
  bolmeId?: string;
}

// OXUMA
export const getCompanies = (): Company[] => {
  const data = localStorage.getItem("companies");
  return data ? JSON.parse(data) : [];
};

export const getBolmeler = (companyId?: string): Bolme[] => {
  const data = localStorage.getItem("bolmeler");
  const all: Bolme[] = data ? JSON.parse(data) : [];
  return companyId ? all.filter((b) => b.companyId === companyId) : all;
};

export const getUsers = (companyId?: string): User[] => {
  const data = localStorage.getItem("users");
  const all: User[] = data ? JSON.parse(data) : [];
  return companyId ? all.filter((u) => u.companyId === companyId) : all;
};

export const getBolmeUsers = (bolmeId: string): User[] => {
  const data = localStorage.getItem("users");
  const all: User[] = data ? JSON.parse(data) : [];
  return all.filter((u) => u.bolmeId === bolmeId);
};

// YAZMA
export const saveCompanies = (companies: Company[]) => {
  localStorage.setItem("companies", JSON.stringify(companies));
};

export const saveBolmeler = (bolmeler: Bolme[]) => {
  localStorage.setItem("bolmeler", JSON.stringify(bolmeler));
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem("users", JSON.stringify(users));
};

// YOXLAMALAR
export const isSuperAdmin = (login: string): boolean => {
  return login === "Tural";
};

export const getCompanyByAdminLogin = (login: string): Company | undefined => {
  return getCompanies().find((c) => c.adminLogin === login);
};

export const getBolmeByAdminLogin = (login: string): Bolme | undefined => {
  return getBolmeler().find((b) => b.adminLogin === login);
};
