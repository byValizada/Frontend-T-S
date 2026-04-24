import { useState, useEffect } from "react";
import {
  FaPlus,
  FaTrash,
  FaSignOutAlt,
  FaLayerGroup,
  FaUsers,
  FaEye,
  FaEyeSlash,
  FaKey,
  FaTasks,
  FaChartBar,
  FaBullhorn
} from "react-icons/fa";
import {
  getCompanyByAdminLogin,
  getBolmeler,
  saveBolmeler,
  getUsers,
  saveUsers,
} from "../../services/dataService";
import type { Company, Bolme, User } from "../../services/dataService";
import "./MuessiseAdminPanel.css";
import StatsCards from "../shared/StatsCards";
import PerformansPanel from "../shared/PerformansPanel";
import ElanPanel from "../shared/ElanPanel";
import { addLog } from "../shared/logHelper";
interface Props {
  currentUser: User;
  onLogout: () => void;
  onGoToDashboard: () => void;
}
function MuessiseAdminPanel({ currentUser, onLogout, onGoToDashboard }: Props) {
  const [activePage, setActivePage] = useState<"bolmeler" | "users">(
    "bolmeler",
  );
  const [company, setCompany] = useState<Company | null>(null);
  const [bolmeler, setBolmeler] = useState<Bolme[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isPerformansOpen, setIsPerformansOpen] = useState(false);
  const [isElanOpen, setIsElanOpen] = useState(false);
  // Bölmə formu
  const [newBolmeAd, setNewBolmeAd] = useState("");
  const [newBolmeAdminLogin, setNewBolmeAdminLogin] = useState("");
  const [newBolmeAdminParol, setNewBolmeAdminParol] = useState("");
  const [newBolmeAdminAdSoyad, setNewBolmeAdminAdSoyad] = useState("");

  // İstifadəçi formu
  const [newUserLogin, setNewUserLogin] = useState("");
  const [newUserParol, setNewUserParol] = useState("");
  const [newUserAdSoyad, setNewUserAdSoyad] = useState("");
  const [newUserRol, setNewUserRol] = useState("İşçi");
  const [newUserBolmeId, setNewUserBolmeId] = useState("");

  const [xeta, setXeta] = useState("");
  const [ugurlu, setUgurlu] = useState("");
  // Parol göstərmə/gizlətmə
  const [gorunenParollar, setGorunenParollar] = useState<string[]>([]);

  // Parol dəyişdirmə
  const [parolDeyisenLogin, setParolDeyisenLogin] = useState<string | null>(
    null,
  );
  const [yeniParol, setYeniParol] = useState("");
  useEffect(() => {
    const c = getCompanyByAdminLogin(currentUser.login);
    if (c) {
      setCompany(c);
      setBolmeler(getBolmeler(c.id));
      setUsers(getUsers(c.id));
    }
  }, [currentUser.login]);

  const showUgurlu = (msg: string) => {
    setUgurlu(msg);
    setXeta("");
    setTimeout(() => setUgurlu(""), 3000);
  };

  const refreshData = (companyId: string) => {
    setBolmeler(getBolmeler(companyId));
    setUsers(getUsers(companyId));
  };

  // BÖLMƏ YARAT
  const handleAddBolme = () => {
    if (!company) return;
    if (
      !newBolmeAd.trim() ||
      !newBolmeAdminLogin.trim() ||
      !newBolmeAdminParol.trim() ||
      !newBolmeAdminAdSoyad.trim()
    ) {
      setXeta("Bütün sahələri doldurun");
      return;
    }

    const allUsers = getUsers();
    if (allUsers.find((u) => u.login === newBolmeAdminLogin)) {
      setXeta("Bu login artıq mövcuddur");
      return;
    }

    const bolmeId = Date.now().toString();

    const newBolme: Bolme = {
      id: bolmeId,
      ad: newBolmeAd.trim(),
      companyId: company.id,
      adminLogin: newBolmeAdminLogin.trim(),
    };

    const adminUser: User = {
      login: newBolmeAdminLogin.trim(),
      parol: newBolmeAdminParol.trim(),
      rol: "BolmeAdmin",
      adSoyad: newBolmeAdminAdSoyad.trim(),
      companyId: company.id,
      bolmeId,
    };

    const allBolmeler = getBolmeler();
    const updatedBolmeler = [...allBolmeler, newBolme];
    const updatedUsers = [...allUsers, adminUser];

    saveBolmeler(updatedBolmeler);
    saveUsers(updatedUsers);
    refreshData(company.id);

    setNewBolmeAd("");
    setNewBolmeAdminLogin("");
    setNewBolmeAdminParol("");
    setNewBolmeAdminAdSoyad("");
    addLog('istifadeci_yarat', currentUser.adSoyad, currentUser.login, `"${newBolmeAd}" bölməsini və admini yaratdı`);
    showUgurlu("Bölmə uğurla yaradıldı");
  };

  // BÖLMƏ SİL
  const handleDeleteBolme = (bolmeId: string) => {
    const allBolmeler = getBolmeler();
    const silinen = allBolmeler.find(b => b.id === bolmeId);
    const updatedBolmeler = allBolmeler.filter((b) => b.id !== bolmeId);
    const allUsers = getUsers();
    const updatedUsers = allUsers.filter((u) => u.bolmeId !== bolmeId);
    saveBolmeler(updatedBolmeler);
    saveUsers(updatedUsers);
    if (company) refreshData(company.id);
    addLog('istifadeci_sil', currentUser.adSoyad, currentUser.login, `"${silinen?.ad || bolmeId}" bölməsini sildi`);
    showUgurlu("Bölmə silindi");
  };

  // İSTİFADƏÇİ YARAT
  const handleAddUser = () => {
    if (!company) return;
    if (
      !newUserLogin.trim() ||
      !newUserParol.trim() ||
      !newUserAdSoyad.trim() ||
      !newUserBolmeId
    ) {
      setXeta("Bütün məcburi sahələri doldurun");
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
      companyId: company.id,
      bolmeId: newUserBolmeId,
    };

    const updatedUsers = [...allUsers, newUser];
    saveUsers(updatedUsers);
    refreshData(company.id);

    setNewUserLogin("");
    setNewUserParol("");
    setNewUserAdSoyad("");
    setNewUserRol("İşçi");
    setNewUserBolmeId("");
    addLog('istifadeci_yarat', currentUser.adSoyad, currentUser.login, `"${newUserAdSoyad}" istifadəçisini yaratdı`);
    showUgurlu("İstifadəçi uğurla yaradıldı");
  };

  // İSTİFADƏÇİ SİL
  const handleDeleteUser = (login: string) => {
    const allUsers = getUsers();
    const silinən = allUsers.find(u => u.login === login);
    const updatedUsers = allUsers.filter((u) => u.login !== login);
    saveUsers(updatedUsers);
    if (company) refreshData(company.id);
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
    if (company) refreshData(company.id);
    setParolDeyisenLogin(null);
    setYeniParol("");
    setXeta("");
    showUgurlu("Parol uğurla dəyişdirildi");
  };
  if (!company) {
    return (
      <div className="map-container">
        <p style={{ color: "#ff6b6b", padding: 20 }}>Müəssisə tapılmadı</p>
      </div>
    );
  }

  return (
    <div className="map-container">
      {/* SIDEBAR */}
      <div className="map-sidebar">
        <div className="map-logo">TİS</div>
        <div className="map-company-name">{company.ad}</div>
        <div className="map-logo-sub">Müəssisə Admin</div>

        <nav className="map-nav">
          <button
            className={`map-nav-btn ${activePage === "bolmeler" ? "aktiv" : ""}`}
            onClick={() => setActivePage("bolmeler")}
          >
            <FaLayerGroup /> Bölmələr
          </button>
          <button
            className={`map-nav-btn ${activePage === "users" ? "aktiv" : ""}`}
            onClick={() => setActivePage("users")}
          >
            <FaUsers /> İstifadəçilər
          </button>
        </nav>

       <button
          className="map-nav-btn"
          onClick={() => setIsPerformansOpen(!isPerformansOpen)}
        >
          <FaChartBar /> Performans
        </button>

        <button
          className="map-nav-btn"
          onClick={() => setIsElanOpen(!isElanOpen)}
        >
          <FaBullhorn /> Elanlar
        </button>

        <button className="map-nav-btn map-dashboard-btn" onClick={onGoToDashboard}>
          <FaTasks /> Tapşırıq pəncərəsi
        </button>

        <button className="map-logout" onClick={onLogout}>
          <FaSignOutAlt /> Çıxış
        </button>
      </div>

      {/* MƏZMUN */}
      <div className="map-content">
        {/* BÖLMƏLƏR */}
        {activePage === "bolmeler" && (
          <div className="map-page">
            <h2 className="map-page-title">Bölmələr</h2>
           <StatsCards
              currentUser={currentUser}
              allowedLogins={users.map(u => u.login)}
            />

            {isPerformansOpen && (
              <PerformansPanel
                users={users}
                currentUser={currentUser}
                onClose={() => setIsPerformansOpen(false)}
              />
            )}

            {isElanOpen && (
              <ElanPanel
                users={users}
                currentUser={currentUser}
                onClose={() => setIsElanOpen(false)}
              />
            )}

            <div className="map-card">
              <h3 className="map-card-title">Yeni bölmə yarat</h3>
              <div className="map-form-grid">
                <div className="map-form-group">
                  <label>Bölmə adı *</label>
                  <input
                    type="text"
                    value={newBolmeAd}
                    onChange={(e) => setNewBolmeAd(e.target.value)}
                    placeholder="Bölmənin adı"
                  />
                </div>
                <div className="map-form-group">
                  <label>Bölmə admin adı soyadı *</label>
                  <input
                    type="text"
                    value={newBolmeAdminAdSoyad}
                    onChange={(e) => setNewBolmeAdminAdSoyad(e.target.value)}
                    placeholder="Ad Soyad"
                  />
                </div>
                <div className="map-form-group">
                  <label>Bölmə admin login *</label>
                  <input
                    type="text"
                    value={newBolmeAdminLogin}
                    onChange={(e) => setNewBolmeAdminLogin(e.target.value)}
                    placeholder="Login"
                  />
                </div>
                <div className="map-form-group">
                  <label>Bölmə admin parol *</label>
                  <input
                    type="password"
                    value={newBolmeAdminParol}
                    onChange={(e) => setNewBolmeAdminParol(e.target.value)}
                    placeholder="Parol"
                  />
                </div>
              </div>
              {xeta && <p className="map-xeta">{xeta}</p>}
              {ugurlu && <p className="map-ugurlu">{ugurlu}</p>}
              <button className="map-btn-primary" onClick={handleAddBolme}>
                <FaPlus /> Bölmə yarat
              </button>
            </div>

            <div className="map-list">
              {bolmeler.length === 0 ? (
                <p className="map-bos">Hələ bölmə yoxdur</p>
              ) : (
                bolmeler.map((b) => (
                  <div key={b.id} className="map-list-item">
                    <div className="map-list-item-info">
                      <span className="map-list-item-ad">{b.ad}</span>
                      <span className="map-list-item-meta">
                        Admin: {b.adminLogin} •
                        {users.filter((u) => u.bolmeId === b.id).length} işçi
                      </span>
                    </div>
                    <button
                      className="map-btn-delete"
                      onClick={() => handleDeleteBolme(b.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* İSTİFADƏÇİLƏR */}
        {activePage === "users" && (
          <div className="map-page">
            <h2 className="map-page-title">İstifadəçilər</h2>

            <div className="map-card">
              <h3 className="map-card-title">Yeni istifadəçi yarat</h3>
              <div className="map-form-grid">
                <div className="map-form-group">
                  <label>Ad Soyad *</label>
                  <input
                    type="text"
                    value={newUserAdSoyad}
                    onChange={(e) => setNewUserAdSoyad(e.target.value)}
                    placeholder="Ad Soyad"
                  />
                </div>
                <div className="map-form-group">
                  <label>Login *</label>
                  <input
                    type="text"
                    value={newUserLogin}
                    onChange={(e) => setNewUserLogin(e.target.value)}
                    placeholder="Login"
                  />
                </div>
                <div className="map-form-group">
                  <label>Parol *</label>
                  <input
                    type="password"
                    value={newUserParol}
                    onChange={(e) => setNewUserParol(e.target.value)}
                    placeholder="Parol"
                  />
                </div>
                <div className="map-form-group">
                  <label>Rol *</label>
                  <select
                    value={newUserRol}
                    onChange={(e) => setNewUserRol(e.target.value)}
                  >
                    <option value="Müavin">Müavin</option>
                    <option value="İşçi">İşçi</option>
                  </select>
                </div>
                <div className="map-form-group">
                  <label>Bölmə *</label>
                  <select
                    value={newUserBolmeId}
                    onChange={(e) => setNewUserBolmeId(e.target.value)}
                  >
                    <option value="">Bölmə seçin</option>
                    {bolmeler.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.ad}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {xeta && <p className="map-xeta">{xeta}</p>}
              {ugurlu && <p className="map-ugurlu">{ugurlu}</p>}
              <button className="map-btn-primary" onClick={handleAddUser}>
                <FaPlus /> İstifadəçi yarat
              </button>
            </div>

            <div className="map-list">
              {users.filter((u) => u.rol !== "Admin").length === 0 ? (
                <p className="map-bos">Hələ istifadəçi yoxdur</p>
              ) : (
                bolmeler.map((b) => {
                  const bUsers = users.filter((u) => u.bolmeId === b.id);
                  if (bUsers.length === 0) return null;
                  return (
                    <div key={b.id} className="map-group">
                      <p className="map-group-title">{b.ad}</p>
                      {bUsers.map((u) => (
                        <div key={u.login} className="map-list-item">
                          <div className="map-list-item-info">
                            <span className="map-list-item-ad">
                              {u.adSoyad}
                            </span>
                            <span className="map-list-item-meta">
                              {u.login} • {u.rol}
                            </span>
                            <span className="map-list-item-parol">
                              🔑 Parol:{" "}
                              <span className="parol-text">
                                {gorunenParollar.includes(u.login)
                                  ? u.parol
                                  : "••••••••"}
                              </span>
                              <button
                                className="map-btn-icon"
                                onClick={() => toggleParol(u.login)}
                                title={
                                  gorunenParollar.includes(u.login)
                                    ? "Gizlət"
                                    : "Göstər"
                                }
                              >
                                {gorunenParollar.includes(u.login) ? (
                                  <FaEyeSlash />
                                ) : (
                                  <FaEye />
                                )}
                              </button>
                              <button
                                className="map-btn-icon"
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
                                  className="map-btn-primary map-btn-sm"
                                  onClick={() => handleChangeParol(u.login)}
                                >
                                  Təsdiqlə
                                </button>
                                <button
                                  className="map-btn-cancel map-btn-sm"
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
                            className="map-btn-delete"
                            onClick={() => handleDeleteUser(u.login)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MuessiseAdminPanel;
