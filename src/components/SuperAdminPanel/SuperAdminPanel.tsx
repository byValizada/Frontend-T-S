import { useState, useEffect } from "react";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaSignOutAlt,
  FaBuilding,
  FaUsers,
  FaLayerGroup,
} from "react-icons/fa";
import {
  getCompanies,
  saveCompanies,
  getUsers,
  saveUsers,
  getBolmeler,
  saveBolmeler,
} from "../../services/dataService";
import type { Company, User, Bolme } from "../../services/dataService";
import "./SuperAdminPanel.css";
interface SuperAdminPanelProps {
  currentUser: User;
  onLogout: () => void;
}

function SuperAdminPanel({ currentUser, onLogout }: SuperAdminPanelProps) {
  const [activePage, setActivePage] = useState<
    "companies" | "users" | "bolmeler"
  >("companies");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [bolmeler, setBolmeler] = useState<Bolme[]>([]);

  // Müəssisə formu
  const [newCompanyAd, setNewCompanyAd] = useState("");
  const [newCompanyAdminLogin, setNewCompanyAdminLogin] = useState("");
  const [newCompanyAdminParol, setNewCompanyAdminParol] = useState("");
  const [newCompanyAdminAdSoyad, setNewCompanyAdminAdSoyad] = useState("");

  // Bölmə formu
  const [newBolmeAd, setNewBolmeAd] = useState("");
  const [newBolmeCompanyId, setNewBolmeCompanyId] = useState("");
  const [newBolmeAdminLogin, setNewBolmeAdminLogin] = useState("");
  const [newBolmeAdminParol, setNewBolmeAdminParol] = useState("");
  const [newBolmeAdminAdSoyad, setNewBolmeAdminAdSoyad] = useState("");

  // İstifadəçi formu
  const [newUserLogin, setNewUserLogin] = useState("");
  const [newUserParol, setNewUserParol] = useState("");
  const [newUserAdSoyad, setNewUserAdSoyad] = useState("");
  const [newUserRol, setNewUserRol] = useState("İşçi");
  const [newUserCompanyId, setNewUserCompanyId] = useState("");
  const [newUserBolmeId, setNewUserBolmeId] = useState("");

  const [xeta, setXeta] = useState("");
  const [ugurlu, setUgurlu] = useState("");

  useEffect(() => {
    setCompanies(getCompanies());
    setUsers(getUsers());
    setBolmeler(getBolmeler());
  }, []);

  const showUgurlu = (msg: string) => {
    setUgurlu(msg);
    setTimeout(() => setUgurlu(""), 3000);
  };

  // MÜƏSSİSƏ YARAT
  const handleAddCompany = () => {
    if (
      !newCompanyAd.trim() ||
      !newCompanyAdminLogin.trim() ||
      !newCompanyAdminParol.trim() ||
      !newCompanyAdminAdSoyad.trim()
    ) {
      setXeta("Bütün sahələri doldurun");
      return;
    }

    const allUsers = getUsers();
    if (allUsers.find((u) => u.login === newCompanyAdminLogin)) {
      setXeta("Bu login artıq mövcuddur");
      return;
    }

    const companyId = Date.now().toString();

    const newCompany: Company = {
      id: companyId,
      ad: newCompanyAd.trim(),
      adminLogin: newCompanyAdminLogin.trim(),
      yaranmaTarixi: new Date().toLocaleDateString("az-AZ"),
    };

    const adminUser: User = {
      login: newCompanyAdminLogin.trim(),
      parol: newCompanyAdminParol.trim(),
      rol: "Admin",
      adSoyad: newCompanyAdminAdSoyad.trim(),
      companyId,
    };

    const updatedCompanies = [...companies, newCompany];
    const updatedUsers = [...allUsers, adminUser];

    saveCompanies(updatedCompanies);
    saveUsers(updatedUsers);
    setCompanies(updatedCompanies);
    setUsers(updatedUsers);

    setNewCompanyAd("");
    setNewCompanyAdminLogin("");
    setNewCompanyAdminParol("");
    setNewCompanyAdminAdSoyad("");
    setXeta("");
    showUgurlu("Müəssisə uğurla yaradıldı");
  };

  // MÜƏSSİSƏ SİL
  const handleDeleteCompany = (companyId: string) => {
    const updatedCompanies = companies.filter((c) => c.id !== companyId);
    const updatedUsers = users.filter((u) => u.companyId !== companyId);
    const updatedBolmeler = bolmeler.filter((b) => b.companyId !== companyId);

    saveCompanies(updatedCompanies);
    saveUsers(updatedUsers);
    saveBolmeler(updatedBolmeler);

    setCompanies(updatedCompanies);
    setUsers(updatedUsers);
    setBolmeler(updatedBolmeler);
    showUgurlu("Müəssisə silindi");
  };

  //// BÖLMƏ YARAT
  const handleAddBolme = () => {
    if (
      !newBolmeAd.trim() ||
      !newBolmeCompanyId ||
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
      companyId: newBolmeCompanyId,
      adminLogin: newBolmeAdminLogin.trim(),
    };

    const adminUser: User = {
      login: newBolmeAdminLogin.trim(),
      parol: newBolmeAdminParol.trim(),
      rol: "BolmeAdmin",
      adSoyad: newBolmeAdminAdSoyad.trim(),
      companyId: newBolmeCompanyId,
      bolmeId,
    };

    const updatedBolmeler = [...bolmeler, newBolme];
    const updatedUsers = [...allUsers, adminUser];

    saveBolmeler(updatedBolmeler);
    saveUsers(updatedUsers);
    setBolmeler(updatedBolmeler);
    setUsers(updatedUsers);

    setNewBolmeAd("");
    setNewBolmeCompanyId("");
    setNewBolmeAdminLogin("");
    setNewBolmeAdminParol("");
    setNewBolmeAdminAdSoyad("");
    setXeta("");
    showUgurlu("Bölmə və bölmə admini uğurla yaradıldı");
  };

  // BÖLMƏ SİL
  const handleDeleteBolme = (bolmeId: string) => {
    const updatedBolmeler = bolmeler.filter((b) => b.id !== bolmeId);
    saveBolmeler(updatedBolmeler);
    setBolmeler(updatedBolmeler);
    showUgurlu("Bölmə silindi");
  };

  // İSTİFADƏÇİ YARAT
  // İSTİFADƏÇİ YARAT
  const handleAddUser = () => {
    if (
      !newUserLogin.trim() ||
      !newUserParol.trim() ||
      !newUserAdSoyad.trim() ||
      !newUserCompanyId
    ) {
      setXeta("Bütün məcburi sahələri doldurun");
      return;
    }

    // Rol yoxlaması: yalnız Müavin və İşçi yaradıla bilər.
    // Admin və BolmeAdmin rolları müvafiq Müəssisə/Bölmə yaratma formaları ilə avtomatik təyin edilir.
    if (newUserRol !== "Müavin" && newUserRol !== "İşçi") {
      setXeta(
        "Bu rolu seçə bilməzsiniz. Admin yalnız Müəssisə yaradılanda təyin edilir.",
      );
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
      companyId: newUserCompanyId,
      bolmeId: newUserBolmeId || undefined,
    };

    const updatedUsers = [...allUsers, newUser];
    saveUsers(updatedUsers);
    setUsers(updatedUsers);

    setNewUserLogin("");
    setNewUserParol("");
    setNewUserAdSoyad("");
    setNewUserRol("İşçi");
    setNewUserCompanyId("");
    setNewUserBolmeId("");
    setXeta("");
    showUgurlu("İstifadəçi uğurla yaradıldı");
  };

  // İSTİFADƏÇİ SİL
  const handleDeleteUser = (login: string) => {
    const updatedUsers = users.filter((u) => u.login !== login);
    saveUsers(updatedUsers);
    setUsers(updatedUsers);
    showUgurlu("İstifadəçi silindi");
  };

  return (
    <div className="sa-container">
      {/* SIDEBAR */}
      <div className="sa-sidebar">
        <div className="sa-logo">TİS</div>
        <div className="sa-logo-sub">Super Admin</div>

        <nav className="sa-nav">
          <button
            className={`sa-nav-btn ${activePage === "companies" ? "aktiv" : ""}`}
            onClick={() => setActivePage("companies")}
          >
            <FaBuilding /> Müəssisələr
          </button>
          <button
            className={`sa-nav-btn ${activePage === "bolmeler" ? "aktiv" : ""}`}
            onClick={() => setActivePage("bolmeler")}
          >
            <FaLayerGroup /> Bölmələr
          </button>
          <button
            className={`sa-nav-btn ${activePage === "users" ? "aktiv" : ""}`}
            onClick={() => setActivePage("users")}
          >
            <FaUsers /> İstifadəçilər
          </button>
        </nav>

        <button className="sa-logout" onClick={onLogout}>
          <FaSignOutAlt /> Çıxış
        </button>
      </div>

      {/* MƏZMUN */}
      <div className="sa-content">
        {/* MÜƏSSİSƏLƏR */}
        {activePage === "companies" && (
          <div className="sa-page">
            <h2 className="sa-page-title">Müəssisələr</h2>

            {/* YENI MÜƏSSİSƏ FORMU */}
            <div className="sa-card">
              <h3 className="sa-card-title">Yeni müəssisə yarat</h3>
              <div className="sa-form-grid">
                <div className="sa-form-group">
                  <label>Müəssisə adı *</label>
                  <input
                    type="text"
                    value={newCompanyAd}
                    onChange={(e) => setNewCompanyAd(e.target.value)}
                    placeholder="Müəssisənin adı"
                  />
                </div>
                <div className="sa-form-group">
                  <label>Admin adı soyadı *</label>
                  <input
                    type="text"
                    value={newCompanyAdminAdSoyad}
                    onChange={(e) => setNewCompanyAdminAdSoyad(e.target.value)}
                    placeholder="Ad Soyad"
                  />
                </div>
                <div className="sa-form-group">
                  <label>Admin login *</label>
                  <input
                    type="text"
                    value={newCompanyAdminLogin}
                    onChange={(e) => setNewCompanyAdminLogin(e.target.value)}
                    placeholder="Login"
                  />
                </div>
                <div className="sa-form-group">
                  <label>Admin parol *</label>
                  <input
                    type="password"
                    value={newCompanyAdminParol}
                    onChange={(e) => setNewCompanyAdminParol(e.target.value)}
                    placeholder="Parol"
                  />
                </div>
              </div>
              {xeta && activePage === "companies" && (
                <p className="sa-xeta">{xeta}</p>
              )}
              {ugurlu && <p className="sa-ugurlu">{ugurlu}</p>}
              <button className="sa-btn-primary" onClick={handleAddCompany}>
                <FaPlus /> Müəssisə yarat
              </button>
            </div>

            {/* MÜƏSSİSƏLƏR SİYAHISI */}
            <div className="sa-list">
              {companies.length === 0 ? (
                <p className="sa-bos">Hələ müəssisə yoxdur</p>
              ) : (
                companies.map((c) => (
                  <div key={c.id} className="sa-list-item">
                    <div className="sa-list-item-info">
                      <span className="sa-list-item-ad">{c.ad}</span>
                      <span className="sa-list-item-meta">
                        Admin: {c.adminLogin} • {c.yaranmaTarixi}
                      </span>
                      <span className="sa-list-item-meta">
                        {bolmeler.filter((b) => b.companyId === c.id).length}{" "}
                        bölmə •
                        {users.filter((u) => u.companyId === c.id).length}{" "}
                        istifadəçi
                      </span>
                    </div>
                    <button
                      className="sa-btn-delete"
                      onClick={() => handleDeleteCompany(c.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* BÖLMƏLƏR */}
        {activePage === "bolmeler" && (
          <div className="sa-page">
            <h2 className="sa-page-title">Bölmələr</h2>

            <div className="sa-card">
              <h3 className="sa-card-title">Yeni bölmə yarat</h3>
              <div className="sa-form-grid">
                <div className="sa-form-group">
                  <label>Müəssisə *</label>
                  <select
                    value={newBolmeCompanyId}
                    onChange={(e) => setNewBolmeCompanyId(e.target.value)}
                  >
                    <option value="">Müəssisə seçin</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.ad}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sa-form-group">
                  <label>Bölmə adı *</label>
                  <input
                    type="text"
                    value={newBolmeAd}
                    onChange={(e) => setNewBolmeAd(e.target.value)}
                    placeholder="Bölmənin adı"
                  />
                </div>
                <div className="sa-form-group">
                  <label>Bölmə admin adı soyadı *</label>
                  <input
                    type="text"
                    value={newBolmeAdminAdSoyad}
                    onChange={(e) => setNewBolmeAdminAdSoyad(e.target.value)}
                    placeholder="Ad Soyad"
                  />
                </div>
                <div className="sa-form-group">
                  <label>Bölmə admin login *</label>
                  <input
                    type="text"
                    value={newBolmeAdminLogin}
                    onChange={(e) => setNewBolmeAdminLogin(e.target.value)}
                    placeholder="Login"
                  />
                </div>
                <div className="sa-form-group">
                  <label>Bölmə admin parol *</label>
                  <input
                    type="password"
                    value={newBolmeAdminParol}
                    onChange={(e) => setNewBolmeAdminParol(e.target.value)}
                    placeholder="Parol"
                  />
                </div>
              </div>
              {xeta && activePage === "bolmeler" && (
                <p className="sa-xeta">{xeta}</p>
              )}
              {ugurlu && <p className="sa-ugurlu">{ugurlu}</p>}
              <button className="sa-btn-primary" onClick={handleAddBolme}>
                <FaPlus /> Bölmə yarat
              </button>
            </div>

            <div className="sa-list">
              {bolmeler.length === 0 ? (
                <p className="sa-bos">Hələ bölmə yoxdur</p>
              ) : (
                companies.map((c) => {
                  const cBolmeler = bolmeler.filter(
                    (b) => b.companyId === c.id,
                  );
                  if (cBolmeler.length === 0) return null;
                  return (
                    <div key={c.id} className="sa-group">
                      <p className="sa-group-title">{c.ad}</p>
                      {cBolmeler.map((b) => (
                        <div key={b.id} className="sa-list-item">
                          <div className="sa-list-item-info">
                            <span className="sa-list-item-ad">{b.ad}</span>
                            <span className="sa-list-item-meta">
                              {users.filter((u) => u.bolmeId === b.id).length}{" "}
                              istifadəçi
                            </span>
                          </div>
                          <button
                            className="sa-btn-delete"
                            onClick={() => handleDeleteBolme(b.id)}
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

        {/* İSTİFADƏÇİLƏR */}
        {activePage === "users" && (
          <div className="sa-page">
            <h2 className="sa-page-title">İstifadəçilər</h2>

            <div className="sa-card">
              <h3 className="sa-card-title">Yeni istifadəçi yarat</h3>
              <div className="sa-form-grid">
                <div className="sa-form-group">
                  <label>Ad Soyad *</label>
                  <input
                    type="text"
                    value={newUserAdSoyad}
                    onChange={(e) => setNewUserAdSoyad(e.target.value)}
                    placeholder="Ad Soyad"
                  />
                </div>
                <div className="sa-form-group">
                  <label>Login *</label>
                  <input
                    type="text"
                    value={newUserLogin}
                    onChange={(e) => setNewUserLogin(e.target.value)}
                    placeholder="Login"
                  />
                </div>
                <div className="sa-form-group">
                  <label>Parol *</label>
                  <input
                    type="password"
                    value={newUserParol}
                    onChange={(e) => setNewUserParol(e.target.value)}
                    placeholder="Parol"
                  />
                </div>
                <div className="sa-form-group">
                  <label>Rol *</label>
                  <select
                    value={newUserRol}
                    onChange={(e) => setNewUserRol(e.target.value)}
                  >
                    <option value="Müavin">Müavin</option>
                    <option value="İşçi">İşçi</option>
                  </select>
                </div>
                <div className="sa-form-group">
                  <label>Müəssisə *</label>
                  <select
                    value={newUserCompanyId}
                    onChange={(e) => {
                      setNewUserCompanyId(e.target.value);
                      setNewUserBolmeId("");
                    }}
                  >
                    <option value="">Müəssisə seçin</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.ad}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sa-form-group">
                  <label>Bölmə</label>
                  <select
                    value={newUserBolmeId}
                    onChange={(e) => setNewUserBolmeId(e.target.value)}
                    disabled={!newUserCompanyId}
                  >
                    <option value="">Bölmə seçin (istəyə görə)</option>
                    {getBolmeler(newUserCompanyId).map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.ad}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {xeta && activePage === "users" && (
                <p className="sa-xeta">{xeta}</p>
              )}
              {ugurlu && <p className="sa-ugurlu">{ugurlu}</p>}
              <button className="sa-btn-primary" onClick={handleAddUser}>
                <FaPlus /> İstifadəçi yarat
              </button>
            </div>

            <div className="sa-list">
              {users.filter((u) => u.rol !== "SuperAdmin").length === 0 ? (
                <p className="sa-bos">Hələ istifadəçi yoxdur</p>
              ) : (
                companies.map((c) => {
                  const cUsers = users.filter((u) => u.companyId === c.id);
                  if (cUsers.length === 0) return null;
                  return (
                    <div key={c.id} className="sa-group">
                      <p className="sa-group-title">{c.ad}</p>
                      {cUsers.map((u) => (
                        <div key={u.login} className="sa-list-item">
                          <div className="sa-list-item-info">
                            <span className="sa-list-item-ad">{u.adSoyad}</span>
                            <span className="sa-list-item-meta">
                              {u.login} • {u.rol}
                              {u.bolmeId &&
                                ` • ${bolmeler.find((b) => b.id === u.bolmeId)?.ad || ""}`}
                            </span>
                          </div>
                          <button
                            className="sa-btn-delete"
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

export default SuperAdminPanel;
