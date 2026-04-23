import { useState, useEffect } from "react";
import {
  FaTrash,
  FaPlus,
  FaTimes,
  FaEdit,
  FaSearch,
  FaSave,
  FaEye,
  FaEyeSlash,
  FaChartBar,
} from "react-icons/fa";
import "./AdminPanel.css";
import StatsCards from "./StatsCards";
import PerformansPanel from "./PerformansPanel";
import ActivityLog from "./ActivityLog";
import ElanPanel from "./ElanPanel";

// İstifadəçi tipi
interface User {
  login: string;
  parol: string;
  rol: string;
  adSoyad: string;
}

// Props tipi
interface AdminPanelProps {
  currentUser: User;
  onLogout: () => void;
  onGoToDashboard: () => void;
}

function AdminPanel({
  currentUser,
  onLogout,
  onGoToDashboard,
}: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [gorunenParollar, setGorunenParollar] = useState<string[]>([]);
  const [isPerformansOpen, setIsPerformansOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isElanOpen, setIsElanOpen] = useState(false)
  const [silModalUser, setSilModalUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Yeni istifadəçi forması
  const [newLogin, setNewLogin] = useState("");
  const [newParol, setNewParol] = useState("");
  const [newRol, setNewRol] = useState("İşçi");
  const [newAdSoyad, setNewAdSoyad] = useState("");
  const [formXeta, setFormXeta] = useState("");

  // Redaktə edilən istifadəçi
  const [editingLogin, setEditingLogin] = useState<string | null>(null);
  const [editAdSoyad, setEditAdSoyad] = useState("");
  const [editParol, setEditParol] = useState("");
  const [editRol, setEditRol] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const data = localStorage.getItem("users");
    if (data) {
      setUsers(JSON.parse(data));
    }
  };
  // Parolu göstər/gizlət
  const toggleParol = (login: string) => {
    setGorunenParollar((prev) => {
      if (prev.includes(login)) {
        return prev.filter((l) => l !== login);
      } else {
        return [...prev, login];
      }
    });
  };

  // Axtarışa görə filtrlənmiş istifadəçilər
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.login.toLowerCase().includes(query) ||
      user.adSoyad.toLowerCase().includes(query) ||
      user.rol.toLowerCase().includes(query)
    );
  });

  // MODAL
  const openModal = () => {
    setNewLogin("");
    setNewParol("");
    setNewRol("İşçi");
    setNewAdSoyad("");
    setFormXeta("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // YENİ İSTİFADƏÇİ ƏLAVƏ ET
  const handleAddUser = () => {
    if (!newLogin || !newParol || !newAdSoyad) {
      setFormXeta("Bütün sahələri doldurun");
      return;
    }

    const existsUser = users.find((u) => u.login === newLogin);
    if (existsUser) {
      setFormXeta("Bu login artıq istifadə olunub");
      return;
    }

    if (newRol === "Admin") {
      setFormXeta("Bu rolu seçə bilməzsiniz");
      return;
    }

    const newUser: User = {
      login: newLogin,
      parol: newParol,
      rol: newRol,
      adSoyad: newAdSoyad,
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    closeModal();
  };

  // İSTİFADƏÇİNİ SİL
  const handleDeleteUser = (loginToDelete: string) => {
    if (loginToDelete === currentUser.login) {
      alert("Özünüzü silə bilməzsiniz");
      return;
    }
    const userToDelete = users.find(u => u.login === loginToDelete)
    if (userToDelete) setSilModalUser(userToDelete)
  };

  const confirmDelete = () => {
    if (!silModalUser) return
    const updatedUsers = users.filter((u) => u.login !== silModalUser.login);
    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setSilModalUser(null)
  }

  // REDAKTƏNİ BAŞLAT
  const startEdit = (user: User) => {
    // Özünü redaktə edə bilməz
    if (user.login === currentUser.login) {
      alert("Özünüzü redaktə edə bilməzsiniz");
      return;
    }

    setEditingLogin(user.login);
    setEditAdSoyad(user.adSoyad);
    setEditParol(user.parol);
    setEditRol(user.rol);
  };

  // REDAKTƏNİ LƏĞV ET
  const cancelEdit = () => {
    setEditingLogin(null);
    setEditAdSoyad("");
    setEditParol("");
    setEditRol("");
  };

  // REDAKTƏNİ YADDA SAXLA
  const saveEdit = () => {
    if (!editAdSoyad || !editParol) {
      alert("Ad Soyad və Parol boş ola bilməz");
      return;
    }

    if (editRol === "Admin") {
      alert("Bu rolu seçə bilməzsiniz");
      return;
    }

    const updatedUsers = users.map((u) => {
      if (u.login === editingLogin) {
        return {
          ...u,
          adSoyad: editAdSoyad,
          parol: editParol,
          rol: editRol,
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    cancelEdit();
  };

  return (
    <div className="admin-panel">
      {/* NAVBAR */}
      <nav className="admin-navbar">
        <div className="navbar-left">
          <h2>Admin Panel</h2>
        </div>
        <div className="navbar-right">
          <span className="user-info">
            {currentUser.adSoyad} ({currentUser.rol})
          </span>
          <button
            className="nav-btn"
            onClick={() => setIsPerformansOpen(!isPerformansOpen)}
          >
            <FaChartBar style={{ marginRight: 6 }} /> Performans
          </button>
          <button className="nav-btn" onClick={() => setIsActivityLogOpen(!isActivityLogOpen)}>
            Aktivlik
          </button>
           <button className="nav-btn" onClick={() => setIsElanOpen(!isElanOpen)}>
            Elanlar
          </button>
          <button className="nav-btn" onClick={onGoToDashboard}>
            Tapşırıq pəncərəsi
          </button>
          <button className="nav-btn logout-btn" onClick={onLogout}>
            Çıxış
          </button>
        </div>
      </nav>

      {/* ƏSAS İÇƏRİK */}
      <div className="admin-content">
        <StatsCards />
        {isPerformansOpen && (
          <PerformansPanel
            users={users}
            onClose={() => setIsPerformansOpen(false)}
          />
        )}
        {isActivityLogOpen && (
          <ActivityLog
            onClose={() => setIsActivityLogOpen(false)}
          />
        )}
        {isElanOpen && (
          <ElanPanel
            users={users}
            currentUser={currentUser}
            onClose={() => setIsElanOpen(false)}
          />
        )}
        <div className="content-header">
          <h3>İstifadəçilər ({users.length})</h3>

          <div className="header-actions">
            {/* AXTARIŞ */}
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Axtar (ad, login, rol)..."
              />
            </div>

            <button className="add-user-btn" onClick={openModal}>
              <FaPlus /> Yeni istifadəçi
            </button>
          </div>
        </div>

        {/* İSTİFADƏÇİLƏR CƏDVƏLİ */}
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>Login</th>
                <th>Ad Soyad</th>
                <th>Parol</th>
                <th>Tapşırıqlar</th>
                <th>Rol</th>
                <th>Son giriş</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "30px",
                      opacity: 0.6,
                    }}
                  >
                    {searchQuery
                      ? "Axtarış nəticəsi tapılmadı"
                      : "Heç bir istifadəçi yoxdur"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.login}>
                    <td>{index + 1}</td>

                    <td>{user.login}</td>

                    {/* AD SOYAD */}
                    <td>
                      {editingLogin === user.login ? (
                        <input
                          className="edit-input"
                          type="text"
                          value={editAdSoyad}
                          onChange={(e) => setEditAdSoyad(e.target.value)}
                        />
                      ) : (
                        user.adSoyad
                      )}
                    </td>

                    {/* PAROL */}
                    <td>
                      {editingLogin === user.login ? (
                        <input
                          className="edit-input"
                          type="text"
                          value={editParol}
                          onChange={(e) => setEditParol(e.target.value)}
                        />
                      ) : (
                        <div className="parol-wrapper">
                          <span className="parol-metn">
                            {gorunenParollar.includes(user.login)
                              ? user.parol
                              : "••••••"}
                          </span>
                          <button
                            className="parol-goz-btn"
                            onClick={() => toggleParol(user.login)}
                            title={
                              gorunenParollar.includes(user.login)
                                ? "Gizlət"
                                : "Göstər"
                            }
                          >
                            {gorunenParollar.includes(user.login) ? (
                              <FaEyeSlash />
                            ) : (
                              <FaEye />
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                    {/* TAPŞIRIQ YÜKÜ */}
                    <td>
                      {(() => {
                        const data = localStorage.getItem("tasks");
                        const allTasks = data ? JSON.parse(data) : [];
                        const aktiv = allTasks.filter(
                          (t: any) =>
                            t.secilmisShexsler.some(
                              (s: any) => s.login === user.login,
                            ) && !t.tamamlanib,
                        ).length;
                        const tamamlandi = allTasks.filter(
                          (t: any) =>
                            t.secilmisShexsler.some(
                              (s: any) => s.login === user.login,
                            ) && t.tamamlanib,
                        ).length;
                        return (
                          <div className="tapsirig-yuku">
                            <span className="yuk-aktiv" title="Aktiv tapşırıq">
                              {aktiv} aktiv
                            </span>
                            <span
                              className="yuk-tamamlandi"
                              title="Tamamlanmış tapşırıq"
                            >
                              {tamamlandi} tamamlandı
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    {/* ROL */}
                    <td>
                      {editingLogin === user.login ? (
                        <select
                          className="edit-select"
                          value={editRol}
                          onChange={(e) => setEditRol(e.target.value)}
                        >
                          <option value="Rəhbər">Rəhbər</option>
                          <option value="Müavin">Müavin</option>
                          <option value="İşçi">İşçi</option>
                        </select>
                      ) : (
                        <span
                          className={`rol-badge rol-${user.rol.toLowerCase()}`}
                        >
                          {user.rol}
                        </span>
                      )}
                    </td>
                    {/* SON GİRİŞ TARİXİ */}
                    <td>
                      {(user as any).sonGirisTarixi ? (
                        <span className="son-giris-tarixi">
                          {(user as any).sonGirisTarixi}
                        </span>
                      ) : (
                        <span className="son-giris-yox">—</span>
                      )}
                    </td>
                    {/* ƏMƏLİYYATLAR */}
                    <td>
                      {user.login === currentUser.login ? (
                        <span className="self-label">Siz</span>
                      ) : editingLogin === user.login ? (
                        <div className="edit-actions">
                          <button
                            className="save-edit-btn"
                            onClick={saveEdit}
                            title="Yadda saxla"
                          >
                            <FaSave />
                          </button>
                          <button
                            className="cancel-edit-btn"
                            onClick={cancelEdit}
                            title="Ləğv et"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button
                            className="edit-btn"
                            onClick={() => startEdit(user)}
                            title="Redaktə et"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteUser(user.login)}
                            title="Sil"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
{/* SİLMƏ TƏSDİQ MODALI */}
      {silModalUser && (
        <div className="sil-modal-overlay" onClick={() => setSilModalUser(null)}>
          <div className="sil-modal-box" onClick={e => e.stopPropagation()}>
            <p className="sil-modal-metn">
              <strong>{silModalUser.adSoyad}</strong> istifadəçisini silmək istədiyinizə əminsiniz?
            </p>
            <div className="sil-modal-buttons">
              <button className="sil-modal-legv" onClick={() => setSilModalUser(null)}>
                Ləğv et
              </button>
              <button className="sil-modal-təsdiq" onClick={confirmDelete}>
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
      {/* YENİ İSTİFADƏÇİ MODALI */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Yeni istifadəçi əlavə et</h3>
              <button className="close-btn" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Ad Soyad</label>
                <input
                  type="text"
                  value={newAdSoyad}
                  onChange={(e) => setNewAdSoyad(e.target.value)}
                  placeholder="Məsələn: Əli Məmmədov"
                />
              </div>

              <div className="form-group">
                <label>Login</label>
                <input
                  type="text"
                  value={newLogin}
                  onChange={(e) => setNewLogin(e.target.value)}
                  placeholder="Login daxil edin"
                />
              </div>

              <div className="form-group">
                <label>Parol</label>
                <input
                  type="text"
                  value={newParol}
                  onChange={(e) => setNewParol(e.target.value)}
                  placeholder="Parol daxil edin"
                />
              </div>

              <div className="form-group">
                <label>Rol</label>
                <select
                  value={newRol}
                  onChange={(e) => setNewRol(e.target.value)}
                >
                  <option value="Rəhbər">Rəhbər</option>
                  <option value="Müavin">Müavin</option>
                  <option value="İşçi">İşçi</option>
                </select>
              </div>

              {formXeta && <p className="form-error">{formXeta}</p>}

              <div className="modal-footer">
                <button className="cancel-btn" onClick={closeModal}>
                  Ləğv et
                </button>
                <button className="save-btn" onClick={handleAddUser}>
                  Əlavə et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
