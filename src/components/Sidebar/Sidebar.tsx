import { FaTasks, FaStickyNote, FaSignOutAlt } from "react-icons/fa";
import "./Sidebar.css";
interface User {
  login: string;
  parol: string;
  rol: string;
  adSoyad: string;
}

interface SidebarProps {
  currentUser: User;
  onLogout: () => void;
  activePage: "tasks" | "notes";
  onPageChange: (page: "tasks" | "notes") => void;
  onGoToAdminPanel?: () => void;
}

function Sidebar({
  currentUser,
  onLogout,
  activePage,
  onPageChange,
  onGoToAdminPanel,
}: SidebarProps) {
  return (
    <div className="sidebar">
      {/* YUXARI - TİS */}
      <div className="sidebar-logo">
        <span className="sidebar-logo-text">TİS</span>
      </div>

      {/* NAVIQASIYA */}
      <nav className="sidebar-nav">
        <div
          className={`sidebar-nav-item ${activePage === "tasks" ? "aktiv" : ""}`}
          onClick={() => onPageChange("tasks")}
        >
          <FaTasks className="sidebar-nav-icon" />
          <span>Ümumi tapşırıqlar</span>
        </div>
        <div
          className={`sidebar-nav-item ${activePage === "notes" ? "aktiv" : ""}`}
          onClick={() => onPageChange("notes")}
        >
          <FaStickyNote className="sidebar-nav-icon" />
          <span>Şəxsi qeydlərim</span>
        </div>
      </nav>

      {/* AŞAĞI - İSTİFADƏÇİ */}
      <div className="sidebar-bottom">
        {(currentUser.rol === "Admin" || currentUser.rol === "BolmeAdmin") &&
          onGoToAdminPanel && (
            <button className="sidebar-admin-btn" onClick={onGoToAdminPanel}>
              İdarəetmə
            </button>
          )}

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {currentUser.adSoyad.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{currentUser.adSoyad}</span>
            <span className="sidebar-user-rol">{currentUser.rol}</span>
          </div>
        </div>
        
        <button className="sidebar-cixis-btn" onClick={onLogout}>
          <FaSignOutAlt />
          <span>Çıxış</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
