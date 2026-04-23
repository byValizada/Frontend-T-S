import { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaSignOutAlt, FaUsers } from "react-icons/fa";
import {
  getBolmeByAdminLogin,
  getCompanies,
  getUsers,
  saveUsers,
} from "../../services/dataService";
import type { Bolme, User, Company } from "../../services/dataService";
import "./BolmeAdminPanel.css";

interface Props {
  currentUser: User;
  onLogout: () => void;
}

function BolmeAdminPanel({ currentUser, onLogout }: Props) {
  const [bolme, setBolme] = useState<Bolme | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const [newUserLogin, setNewUserLogin] = useState("");
  const [newUserParol, setNewUserParol] = useState("");
  const [newUserAdSoyad, setNewUserAdSoyad] = useState("");
  const [newUserRol, setNewUserRol] = useState("İşçi");

  const [xeta, setXeta] = useState("");
  const [ugurlu, setUgurlu] = useState("");

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
    showUgurlu("İstifadəçi uğurla yaradıldı");
  };

  const handleDeleteUser = (login: string) => {
    const allUsers = getUsers();
    const updatedUsers = allUsers.filter((u) => u.login !== login);
    saveUsers(updatedUsers);
    if (bolme) refreshUsers(bolme.id);
    showUgurlu("İstifadəçi silindi");
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
          <div className="bap-nav-btn aktiv">
            <FaUsers /> İşçilər
          </div>
        </div>

        <button className="bap-logout" onClick={onLogout}>
          <FaSignOutAlt /> Çıxış
        </button>
      </div>

      {/* MƏZMUN */}
      <div className="bap-content">
        <div className="bap-page">
          <h2 className="bap-page-title">İşçilər - {bolme.ad}</h2>

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
      </div>
    </div>
  );
}

export default BolmeAdminPanel;
