import { useState, useEffect } from "react";
import {
  FaPlus,
  FaTrash,
  FaSignOutAlt,
  FaUsers,
  FaEye,
  FaEyeSlash,
  FaKey,
  FaTasks,
  FaChartBar,
  FaBullhorn
} from "react-icons/fa";
import {
  getBolmeByAdminLogin,
  getCompanies,
  getUsers,
  saveUsers,
} from "../../services/dataService";
import type { Bolme, User, Company } from "../../services/dataService";
import "./BolmeAdminPanel.css";
import StatsCards from "../shared/StatsCards";
import PerformansPanel from "../shared/PerformansPanel";
import ElanPanel from "../shared/ElanPanel";
import { addLog } from "../shared/logHelper";
interface Props {
  currentUser: User;
  onLogout: () => void;
  onGoToDashboard: () => void;
}

function BolmeAdminPanel({ currentUser, onLogout, onGoToDashboard }: Props) {
  const [bolme, setBolme] = useState<Bolme | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const [newUserLogin, setNewUserLogin] = useState("");
  const [newUserParol, setNewUserParol] = useState("");
  const [newUserAdSoyad, setNewUserAdSoyad] = useState("");
  const [newUserRol, setNewUserRol] = useState("İşçi");

  const [xeta, setXeta] = useState("");
  const [ugurlu, setUgurlu] = useState("");
  type PageType = "users" | "performans" | "elanlar"
  const [activePage, setActivePage] = useState<PageType>("users");

  // Parol göstərmə/gizlətmə
  const [gorunenParollar, setGorunenParollar] = useState<string[]>([]);

  // Parol dəyişdirmə
  const [parolDeyisenLogin, setParolDeyisenLogin] = useState<string | null>(
    null,
  );
  const [yeniParol, setYeniParol] = useState("");
  useEffect(() => {
    const b = getBolmeByAdminLogin(currentUser.login);
    if (b) {
      setBolme(b);
      const companies = getCompanies();
      const c = companies.find((c) => c.id === b.companyId);
      if (c) setCompany(c);
      const allUsers = getUsers();
      setUsers(allUsers.filter((u) => u.bolmeId === b.id));
    }
  }, [currentUser.login]);

  const showUgurlu = (msg: string) => {
    setUgurlu(msg);
    setXeta("");
    setTimeout(() => setUgurlu(""), 3000);
  };

  const refreshUsers = (bolmeId: string) => {
    const allUsers = getUsers();
    setUsers(allUsers.filter((u) => u.bolmeId === bolmeId));
  };

  const handleAddUser = () => {
    if (!bolme) return;
    if (
      !newUserLogin.trim() ||
      !newUserParol.trim() ||
      !newUserAdSoyad.trim()
    ) {
      setXeta("Bütün sahələri doldurun");
      return;
    }

    const allUsers = getUsers();
    if (allUsers.find((u) => u.login === newUserLogin)) {
      setXeta("Bu login artıq mövcuddur");
      return;
    }

    const newUser: User = {
      login: newUserLogin.trim(),
      parol: newUserParol.trim(),
      rol: newUserRol as User["rol"],
      adSoyad: newUserAdSoyad.trim(),
      companyId: bolme.companyId,
      bolmeId: bolme.id,
    };

    const updatedUsers = [...allUsers, newUser];
    saveUsers(updatedUsers);
    refreshUsers(bolme.id);

    setNewUserLogin("");
    setNewUserParol("");
    setNewUserAdSoyad("");
    setNewUserRol("İşçi");
    addLog('istifadeci_yarat', currentUser.adSoyad, currentUser.login, `"${newUserAdSoyad}" istifadəçisini yaratdı`);
    showUgurlu("İstifadəçi uğurla yaradıldı");
  };

  const handleDeleteUser = (login: string) => {
    const allUsers = getUsers();
    const silinən = allUsers.find(u => u.login === login);
    const updatedUsers = allUsers.filter((u) => u.login !== login);
    saveUsers(updatedUsers);
    if (bolme) refreshUsers(bolme.id);
    addLog('istifadeci_sil', currentUser.adSoyad, currentUser.login, `"${silinən?.adSoyad || login}" istifadəçisini sildi`);
    showUgurlu("İstifadəçi silindi");
  };
  // PAROL GÖSTƏR/GİZLƏT
  const toggleParol = (login: string) => {
    setGorunenParollar((prev) =>
      prev.includes(login) ? prev.filter((l) => l !== login) : [...prev, login],
    );
  };

  // PAROLU DƏYİŞDİR
  const handleChangeParol = (login: string) => {
    if (!yeniParol.trim()) {
      setXeta("Yeni parolu daxil edin");
      return;
    }

    const allUsers = getUsers();
    const updatedUsers = allUsers.map((u) =>
      u.login === login ? { ...u, parol: yeniParol.trim() } : u,
    );
    saveUsers(updatedUsers);
    if (bolme) refreshUsers(bolme.id);
    setParolDeyisenLogin(null);
    setYeniParol("");
    setXeta("");
    showUgurlu("Parol uğurla dəyişdirildi");
  };
  if (!bolme) {
    return (
      <div className="bap-container">
        <p style={{ color: "#ff6b6b", padding: 20 }}>Bölmə tapılmadı</p>
      </div>
    );
  }

  return (
    <div className="bap-container">
      {/* SIDEBAR */}
      <div className="bap-sidebar">
        <div className="bap-logo">TİS</div>
        {company && <div className="bap-company-name">{company.ad}</div>}
        <div className="bap-bolme-name">{bolme.ad}</div>
        <div className="bap-logo-sub">Bölmə Admin</div>

        <div className="bap-nav">
          <div
            className={`bap-nav-btn ${activePage === "users" ? "aktiv" : ""}`}
            onClick={() => setActivePage("users")}
          >
            <FaUsers /> İşçilər
          </div>
          <div
            className={`bap-nav-btn ${activePage === "performans" ? "aktiv" : ""}`}
            onClick={() => setActivePage("performans")}
          >
            <FaChartBar /> Performans
          </div>
          <div
            className={`bap-nav-btn ${activePage === "elanlar" ? "aktiv" : ""}`}
            onClick={() => setActivePage("elanlar")}
          >
            <FaBullhorn /> Elanlar
          </div>
        </div>

        <button className="bap-nav-btn bap-dashboard-btn" onClick={onGoToDashboard}>
          <FaTasks /> Tapşırıq pəncərəsi
        </button>

        <button className="bap-logout" onClick={onLogout}>
          <FaSignOutAlt /> Çıxış
        </button>
      </div>

      {/* MƏZMUN */}
      <div className="bap-content">
        {/* İŞÇİLƏR */}
        {activePage === "users" && (
        <div className="bap-page">
          <h2 className="bap-page-title">İşçilər - {bolme.ad}</h2>

          <StatsCards
            currentUser={currentUser}
            allowedLogins={[...users.map(u => u.login), currentUser.login]}
          />

          <div className="bap-card">
            <h3 className="bap-card-title">Yeni işçi əlavə et</h3>
            <div className="bap-form-grid">
              <div className="bap-form-group">
                <label>Ad Soyad *</label>
                <input
                  type="text"
                  value={newUserAdSoyad}
                  onChange={(e) => setNewUserAdSoyad(e.target.value)}
                  placeholder="Ad Soyad"
                />
              </div>
              <div className="bap-form-group">
                <label>Login *</label>
                <input
                  type="text"
                  value={newUserLogin}
                  onChange={(e) => setNewUserLogin(e.target.value)}
                  placeholder="Login"
                />
              </div>
              <div className="bap-form-group">
                <label>Parol *</label>
                <input
                  type="password"
                  value={newUserParol}
                  onChange={(e) => setNewUserParol(e.target.value)}
                  placeholder="Parol"
                />
              </div>
              <div className="bap-form-group">
                <label>Rol *</label>
                <select
                  value={newUserRol}
                  onChange={(e) => setNewUserRol(e.target.value)}
                >
                  <option value="Müavin">Müavin</option>
                  <option value="İşçi">İşçi</option>
                </select>
              </div>
            </div>
            {xeta && <p className="bap-xeta">{xeta}</p>}
            {ugurlu && <p className="bap-ugurlu">{ugurlu}</p>}
            <button className="bap-btn-primary" onClick={handleAddUser}>
              <FaPlus /> İşçi əlavə et
            </button>
          </div>

          <div className="bap-list">
            {users.length === 0 ? (
              <p className="bap-bos">Hələ işçi yoxdur</p>
            ) : (
              users.map((u) => (
                <div key={u.login} className="bap-list-item">
                  <div className="bap-list-item-info">
                    <span className="bap-list-item-ad">{u.adSoyad}</span>
                    <span className="bap-list-item-meta">
                      {u.login} • {u.rol}
                    </span>
                    <span className="bap-list-item-parol">
                      🔑 Parol:{" "}
                      <span className="parol-text">
                        {gorunenParollar.includes(u.login) ? u.parol : "••••••••"}
                      </span>
                      <button
                        className="bap-btn-icon"
                        onClick={() => toggleParol(u.login)}
                        title={gorunenParollar.includes(u.login) ? "Gizlət" : "Göstər"}
                      >
                        {gorunenParollar.includes(u.login) ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      <button
                        className="bap-btn-icon"
                        onClick={() => {
                          setParolDeyisenLogin(u.login);
                          setYeniParol("");
                        }}
                        title="Parolu dəyişdir"
                      >
                        <FaKey />
                      </button>
                    </span>
                    {parolDeyisenLogin === u.login && (
                      <div className="parol-deyisdir-row">
                        <input
                          type="text"
                          placeholder="Yeni parol"
                          value={yeniParol}
                          onChange={(e) => setYeniParol(e.target.value)}
                          autoFocus
                        />
                        <button
                          className="bap-btn-primary bap-btn-sm"
                          onClick={() => handleChangeParol(u.login)}
                        >
                          Təsdiqlə
                        </button>
                        <button
                          className="bap-btn-cancel bap-btn-sm"
                          onClick={() => {
                            setParolDeyisenLogin(null);
                            setYeniParol("");
                            setXeta("");
                          }}
                        >
                          Ləğv et
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    className="bap-btn-delete"
                    onClick={() => handleDeleteUser(u.login)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        )}

        {/* PERFORMANS */}
        {activePage === "performans" && (
          <div className="bap-page">
            <h2 className="bap-page-title">Performans</h2>
            <PerformansPanel
              users={users}
              currentUser={currentUser}
            />
          </div>
        )}

        {/* ELANLAR */}
        {activePage === "elanlar" && (
          <div className="bap-page">
            <h2 className="bap-page-title">Elanlar</h2>
            <ElanPanel
              users={users}
              currentUser={currentUser}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default BolmeAdminPanel;
