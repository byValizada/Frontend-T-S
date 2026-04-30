import { useState, useEffect, useRef } from "react";
import { usersAPI, mapUserDto, bolmelerAPI, mapBolmeDto } from "../../services/api";
import {
  FaTimes,
  FaRegCircle,
  FaCheckCircle,
  FaCalendarAlt,
  FaPaperclip,
  FaTrash,
  FaPaperPlane,
  FaPlus,
  FaSearch,
  FaPencilAlt,
  FaCheckDouble,
} from "react-icons/fa";
import type {
  NewTask,
  ShexsStatus,
  Mesaj,
  SubTask,
} from "../TaskModal/TaskModal";
import "./TaskSidePanel.css";

interface User {
  login: string;
  parol: string;
  rol: string;
  adSoyad: string;
  companyId?: string;
  bolmeId?: string;
}

interface TaskSidePanelProps {
  task: NewTask;
  currentUser: User;
  onClose: () => void;
  onUpdateTask: (task: NewTask) => void;
  onDeleteTask: (taskId: string) => void;
}

function getMyStatus(task: NewTask, login: string): string {
  const s = task.secilmisShexsler.find((s) => s.login === login);
  return (s as any)?.status || "gozlenir";
}

function TaskSidePanel({
  task,
  currentUser,
  onClose,
  onUpdateTask,
  onDeleteTask,
}: TaskSidePanelProps) {
  const [editingName, setEditingName] = useState(false);
  const [taskName, setTaskName] = useState(task.tapsirigAdi);
  const [deadline, setDeadline] = useState(task.deadline);
  const [qeyd, setQeyd] = useState(task.qeyd);
  const [mesaj, setMesaj] = useState("");
  const [yeniSubTask, setYeniSubTask] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [bolmeler, setBolmeler] = useState<{ id: string; ad: string }[]>([]);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [icraModal, setIcraModal] = useState(false);
  const [icraModalTip, setIcraModalTip] = useState<"icra" | "tamamla">("icra");
  const [icraFayl, setIcraFayl] = useState<{
    name: string;
    size: number;
    type: string;
    base64: string;
  } | null>(null);
  const icraFileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgFileInputRef = useRef<HTMLInputElement>(null);
  const msgInputRef = useRef<HTMLInputElement>(null);

  const isOwner = task.verenLogin === currentUser.login;
  const isIcraci = task.secilmisShexsler.some(
    (s) => s.login === currentUser.login,
  );
  const isNezaretci = task.secilmisShexsler.some(
    (s) => s.login === currentUser.login && (s as any).nezaretci,
  );
  const myStatus = getMyStatus(task, currentUser.login);

  useEffect(() => {
    setTaskName(task.tapsirigAdi);
    setDeadline(task.deadline);
    setQeyd(task.qeyd);
    if (task.yeniMesaj) {
      onUpdateTask({ ...task, yeniMesaj: false });
    }
  }, [task.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [task.mesajlar]);

  useEffect(() => {
    bolmelerAPI.getAll().then((data: any[]) => {
      setBolmeler((data || []).map(mapBolmeDto).map((b: any) => ({ id: b.id, ad: b.ad })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    usersAPI.getAll().then((data: any[]) => {
      const users: User[] = (data || []).map(mapUserDto);
      const filtered = users.filter((u) => {
        if (u.login === currentUser.login) return false;
        if (u.rol === "SuperAdmin") return false;
        if (currentUser.bolmeId) return u.bolmeId === currentUser.bolmeId;
        if (currentUser.companyId) return u.companyId === currentUser.companyId;
        return false;
      });
      setAllUsers(filtered);
    }).catch(() => setAllUsers([]));
  }, [currentUser]);

  const filteredUsers = allUsers.filter((u) => {
    if (!userSearch.trim()) return true;
    return u.adSoyad.toLowerCase().includes(userSearch.toLowerCase());
  });

  const handleNameSave = () => {
    if (taskName.trim() && taskName !== task.tapsirigAdi) {
      onUpdateTask({ ...task, tapsirigAdi: taskName.trim() });
    }
    setEditingName(false);
  };

  const handleDeadlineChange = (value: string) => {
    setDeadline(value);
    onUpdateTask({ ...task, deadline: value });
  };

  const handleQeydSave = () => {
    if (qeyd !== task.qeyd) onUpdateTask({ ...task, qeyd });
  };

  const handleTeciliToggle = () => {
    if (!isOwner) return;
    onUpdateTask({ ...task, tecili: !task.tecili });
  };

  const handleComplete = () => {
    if (!isOwner) return;
    onUpdateTask({
      ...task,
      tamamlanib: true,
      tamamlanmaTarixi: new Date().toLocaleDateString("az-AZ"),
    });
    onClose();
  };

  const toggleIcraci = (user: User) => {
    if (!isOwner && !isNezaretci) return;
    const exists = task.secilmisShexsler.some((s) => s.login === user.login);
    let updated: ShexsStatus[];
    if (exists) {
      updated = task.secilmisShexsler.filter((s) => s.login !== user.login);
    } else {
      updated = [
        ...task.secilmisShexsler,
        { login: user.login, adSoyad: user.adSoyad, icraEdilib: false },
      ];
    }
    onUpdateTask({ ...task, secilmisShexsler: updated });
  };

  const handleIcraFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Fayl 5MB-dan böyükdür");
      return;
    }
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    setIcraFayl({ name: file.name, size: file.size, type: file.type, base64 });
    e.target.value = "";
  };

  const handleIcraTesdiq = () => {
    const yeniStatus: "gozlenir" | "icrada" | "tamamlandi" =
      icraModalTip === "tamamla" ? "tamamlandi" : "icrada";
    const updatedShexsler: ShexsStatus[] = task.secilmisShexsler.map((s) =>
      s.login === currentUser.login
        ? { ...s, status: yeniStatus as "gozlenir" | "icrada" | "tamamlandi" }
        : s,
    );
    let updatedFayllar = [...task.fayllar];
    if (icraFayl) updatedFayllar = [...updatedFayllar, icraFayl];
    const statusMetn =
      yeniStatus === "icrada"
        ? `✅ ${currentUser.adSoyad} tapşırığı icraya götürdü`
        : `🏁 ${currentUser.adSoyad} tapşırığı tamamladı`;
    const statusMsg: Mesaj = {
      id: Date.now().toString(),
      yazanLogin: currentUser.login,
      yazanAd: currentUser.adSoyad,
      metn: statusMetn,
      tarix: new Date().toLocaleString("az-AZ"),
    };
    onUpdateTask({
      ...task,
      secilmisShexsler: updatedShexsler,
      fayllar: updatedFayllar,
      mesajlar: [...(task.mesajlar || []), statusMsg],
    });
    setIcraModal(false);
    setIcraFayl(null);
  };

  const handleFileAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Fayl 2MB-dan böyükdür");
      return;
    }
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    onUpdateTask({
      ...task,
      fayllar: [
        ...task.fayllar,
        { name: file.name, size: file.size, type: file.type, base64 },
      ],
    });
    e.target.value = "";
  };

  const handleFileRemove = (index: number) => {
    onUpdateTask({
      ...task,
      fayllar: task.fayllar.filter((_, i) => i !== index),
    });
  };

  const handleSendMessage = () => {
    if (!mesaj.trim()) return;
    if (editingMsgId) {
      const updated = (task.mesajlar || []).map((m) =>
        m.id === editingMsgId ? { ...m, metn: mesaj.trim(), redakte: true } : m,
      );
      onUpdateTask({ ...task, mesajlar: updated });
      setEditingMsgId(null);
      setMesaj("");
    } else {
      const newMsg: Mesaj = {
        id: Date.now().toString(),
        yazanLogin: currentUser.login,
        yazanAd: currentUser.adSoyad,
        metn: mesaj.trim(),
        tarix: new Date().toLocaleString("az-AZ"),
      };
      onUpdateTask({ ...task, mesajlar: [...(task.mesajlar || []), newMsg], yeniMesaj: true });
      setMesaj("");
    }
  };

  const handleStartEdit = (m: Mesaj) => {
    setEditingMsgId(m.id);
    setMesaj(m.metn);
    setTimeout(() => msgInputRef.current?.focus(), 50);
  };

  const handleCancelEdit = () => {
    setEditingMsgId(null);
    setMesaj("");
  };

  const handleMsgFileAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Fayl 5MB-dan böyükdür");
      return;
    }
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    const newMsg: Mesaj = {
      id: Date.now().toString(),
      yazanLogin: currentUser.login,
      yazanAd: currentUser.adSoyad,
      metn: `📎 ${file.name}`,
      tarix: new Date().toLocaleString("az-AZ"),
      fayl: { name: file.name, size: file.size, type: file.type, base64 },
    };
    onUpdateTask({ ...task, mesajlar: [...(task.mesajlar || []), newMsg] });
    e.target.value = "";
  };

  const handleAddSubTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && yeniSubTask.trim()) {
      const newSub: SubTask = {
        id: Date.now().toString(),
        ad: yeniSubTask.trim(),
        tamamlanib: false,
      };
      onUpdateTask({
        ...task,
        altTapsiriglar: [...(task.altTapsiriglar || []), newSub],
      });
      setYeniSubTask("");
    }
  };

  const toggleSubTask = (subId: string) => {
    onUpdateTask({
      ...task,
      altTapsiriglar: (task.altTapsiriglar || []).map((s) =>
        s.id === subId ? { ...s, tamamlanib: !s.tamamlanib } : s,
      ),
    });
  };

  const deleteSubTask = (subId: string) => {
    onUpdateTask({
      ...task,
      altTapsiriglar: (task.altTapsiriglar || []).filter((s) => s.id !== subId),
    });
  };

  const handleDelete = () => {
    if (window.confirm("Bu tapşırığı silmək istəyirsiniz?")) {
      onDeleteTask(task.id);
      onClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getBolmeName = (bolmeId?: string) =>
    !bolmeId ? "" : bolmeler.find((b) => b.id === bolmeId)?.ad ?? "";

  // YALNIZ OXUMA MESAJLAR
  const renderReadonlyMessages = () => (
    <div className="tsp-col-right">
      <div className="tsp-col-header">💬 Mesajlar</div>
      <div className="tsp-col-messages">
        {!task.mesajlar || task.mesajlar.length === 0 ? (
          <p className="tsp-empty">Mesaj yoxdur</p>
        ) : (
          task.mesajlar.map((m) => (
            <div
              key={m.id}
              className={`tsp-msg${m.yazanLogin === currentUser.login ? " mine" : " other"}`}
            >
              <span className="tsp-msg-ad">{m.yazanAd}</span>
              {m.fayl ? (
                <a
                  className="tsp-msg-fayl"
                  href={m.fayl.base64}
                  download={m.fayl.name}
                  onClick={(e) => e.stopPropagation()}
                >
                  📎 {m.fayl.name}
                  <span className="tsp-msg-fayl-size">
                    ({formatFileSize(m.fayl.size)})
                  </span>
                </a>
              ) : (
                <span className="tsp-msg-metn">{m.metn}</span>
              )}
              <span className="tsp-msg-tarix">{m.tarix}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );

  // YAZILA BİLƏN MESAJLAR
  const renderMessages = () => (
    <div className="tsp-col-right">
      <div className="tsp-col-header">💬 Mesajlar</div>
      <div className="tsp-col-messages">
        {!task.mesajlar || task.mesajlar.length === 0 ? (
          <p className="tsp-empty">Hələ mesaj yoxdur</p>
        ) : (
          task.mesajlar.map((m) => (
            <div
              key={m.id}
              className={`tsp-msg${m.yazanLogin === currentUser.login ? " mine" : " other"}`}
            >
              <span className="tsp-msg-ad">{m.yazanAd}</span>
              {m.fayl ? (
                <a
                  className="tsp-msg-fayl"
                  href={m.fayl.base64}
                  download={m.fayl.name}
                  onClick={(e) => e.stopPropagation()}
                >
                  📎 {m.fayl.name}
                  <span className="tsp-msg-fayl-size">
                    ({formatFileSize(m.fayl.size)})
                  </span>
                </a>
              ) : (
                <div className="tsp-msg-metn-row">
                  <span className="tsp-msg-metn">
                    {m.metn}
                    {(m as any).redakte && (
                      <span className="tsp-msg-redakte"> ✎</span>
                    )}
                  </span>
                  {m.yazanLogin === currentUser.login && (
                    <button
                      className="tsp-msg-edit-btn"
                      onClick={() => handleStartEdit(m)}
                      title="Redaktə et"
                    >
                      <FaPencilAlt />
                    </button>
                  )}
                </div>
              )}
              <span className="tsp-msg-tarix">{m.tarix}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className={`tsp-col-msg-input${editingMsgId ? " editing" : ""}`}>
        {editingMsgId && (
          <div className="tsp-msg-edit-indicator">
            <span>✎ Redaktə rejimi</span>
            <button onClick={handleCancelEdit}>
              <FaTimes />
            </button>
          </div>
        )}
        <div className="tsp-col-msg-input-row">
          <input
            ref={msgInputRef}
            type="text"
            placeholder={editingMsgId ? "Mesajı düzəldin..." : "Mesaj yazın..."}
            value={mesaj}
            onChange={(e) => setMesaj(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
              if (e.key === "Escape" && editingMsgId) handleCancelEdit();
            }}
          />
          {!editingMsgId && (
            <>
              <button
                className="tsp-msg-attach"
                onClick={() => msgFileInputRef.current?.click()}
                title="Fayl göndər"
              >
                <FaPaperclip />
              </button>
              <input
                ref={msgFileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={handleMsgFileAdd}
              />
            </>
          )}
          <button className="tsp-msg-send-btn" onClick={handleSendMessage}>
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );

  // İCRA MODAL
  const renderIcraModal = () => {
    if (!icraModal) return null;
    const isIcrada = icraModalTip === "tamamla";
    return (
      <div
        className="tsp-icra-modal-overlay"
        onClick={() => setIcraModal(false)}
      >
        <div className="tsp-icra-modal" onClick={(e) => e.stopPropagation()}>
          <div className="tsp-icra-modal-header">
            {isIcrada ? (
              <FaCheckDouble className="tsp-icra-modal-icon tamamla" />
            ) : (
              <FaCheckCircle className="tsp-icra-modal-icon icra" />
            )}
            <h3>{isIcrada ? "Tapşırığı tamamla" : "İcraya götür"}</h3>
          </div>
          <p className="tsp-icra-modal-metn">
            {isIcrada
              ? "Tapşırığı tamamladığınızı təsdiqləyirsiniz?"
              : "Tapşırığı icraya götürdüyünüzü təsdiqləyirsiniz?"}
          </p>
          {isIcrada && (
            <div className="tsp-icra-modal-fayl">
              <div className="tsp-icra-modal-fayl-label">
                <FaPaperclip /> Sənəd əlavə et{" "}
                <span className="tsp-icra-optional">(istəyə görə)</span>
              </div>
              {icraFayl ? (
                <div className="tsp-icra-fayl-item">
                  <span>📎 {icraFayl.name}</span>
                  <span className="tsp-icra-fayl-size">
                    {formatFileSize(icraFayl.size)}
                  </span>
                  <button onClick={() => setIcraFayl(null)}>
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <button
                  className="tsp-icra-fayl-btn"
                  onClick={() => icraFileRef.current?.click()}
                >
                  <FaPaperclip /> Fayl seç
                </button>
              )}
              <input
                ref={icraFileRef}
                type="file"
                style={{ display: "none" }}
                onChange={handleIcraFileSelect}
              />
            </div>
          )}
          <div className="tsp-icra-modal-btns">
            <button
              className="tsp-icra-modal-cancel"
              onClick={() => {
                setIcraModal(false);
                setIcraFayl(null);
              }}
            >
              Ləğv et
            </button>
            <button
              className={`tsp-icra-modal-confirm ${isIcrada ? "tamamla" : "icra"}`}
              onClick={handleIcraTesdiq}
            >
              {isIcrada ? (
                <>
                  <FaCheckDouble /> Tamamladım
                </>
              ) : (
                <>
İcraya götürdüm
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // 1. TAMAMLANMIŞ
  // ============================================
  if (task.tamamlanib) {
    return (
      <div className="tsp-overlay" onClick={onClose}>
        <div className="tsp-panel" onClick={(e) => e.stopPropagation()}>
          <div className="tsp-header">
            <div className="tsp-header-left">
              <div className="tsp-checkbox">
                <FaCheckCircle className="tsp-check-icon done" />
              </div>
              <h3
                className="tsp-name"
                style={{ textDecoration: "line-through", opacity: 0.7 }}
              >
                {task.tapsirigAdi}
              </h3>
            </div>
            <div className="tsp-header-right">
              <button className="tsp-close" onClick={onClose}>
                <FaTimes />
              </button>
            </div>
          </div>
          <div className="tsp-columns">
            <div className="tsp-col-left">
              <div className="tsp-col-scroll">
                <div className="tsp-section">
                  <div className="tsp-section-header">
                    <span>👤 İcraçılar ({task.secilmisShexsler.length})</span>
                  </div>
                  {task.secilmisShexsler.length > 0 && (
                    <div className="tsp-icracilar">
                      {task.secilmisShexsler.map((s) => (
                        <div
                          key={s.login}
                          className={`tsp-icraci status-${(s as any).status || "tamamlandi"}`}
                        >
                          <span className="tsp-icraci-ad">{s.adSoyad}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {task.deadline && (
                  <div className="tsp-section">
                    <div className="tsp-section-header">
                      <FaCalendarAlt className="tsp-section-icon" />
                      <span>Son tarix</span>
                    </div>
                    <span className="tsp-date-text">{task.deadline}</span>
                  </div>
                )}
                {(task.altTapsiriglar || []).length > 0 && (
                  <div className="tsp-section">
                    <div className="tsp-section-header">
                      <span>📋 Alt tapşırıqlar</span>
                    </div>
                    <div className="tsp-sub-list">
                      {(task.altTapsiriglar || []).map((sub) => (
                        <div
                          key={sub.id}
                          className={`tsp-sub-item${sub.tamamlanib ? " done" : ""}`}
                        >
                          <div className="tsp-sub-check">
                            {sub.tamamlanib ? (
                              <FaCheckCircle className="tsp-sub-check-icon done" />
                            ) : (
                              <FaRegCircle className="tsp-sub-check-icon" />
                            )}
                          </div>
                          <span
                            className={`tsp-sub-ad${sub.tamamlanib ? " done" : ""}`}
                          >
                            {sub.ad}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {task.fayllar.length > 0 && (
                  <div className="tsp-section">
                    <div className="tsp-section-header">
                      <FaPaperclip className="tsp-section-icon" />
                      <span>Fayllar</span>
                    </div>
                    <div className="tsp-files">
                      {task.fayllar.map((f, i) => (
                        <div key={i} className="tsp-file-item">
                          <a
                            href={f.base64}
                            download={f.name}
                            className="tsp-file-name"
                          >
                            📎 {f.name}
                          </a>
                          <span className="tsp-file-size">
                            {formatFileSize(f.size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {task.qeyd && (
                  <div className="tsp-section">
                    <div className="tsp-section-header">
                      <span>📝 Qeyd</span>
                    </div>
                    <p className="tsp-icraci-qeyd">{task.qeyd}</p>
                  </div>
                )}
                {task.tamamlanmaTarixi && (
                  <div className="tsp-section">
                    <div className="tsp-section-header">
                      <span>✅ Tamamlanma tarixi</span>
                    </div>
                    <span className="tsp-date-text">
                      {task.tamamlanmaTarixi}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {renderReadonlyMessages()}
          </div>
          <div className="tsp-footer">
            <div className="tsp-footer-info">
              <span>
                Tapşırığı verən: <strong>{task.veren}</strong>
              </span>
              <span>Yaranma: {task.tarix}</span>
            </div>
            {isOwner && (
              <button className="tsp-delete-btn" onClick={handleDelete}>
                <FaTrash /> Sil
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // 2. NƏZARƏTÇİ GÖRÜNÜŞÜ
  // ============================================
  if (isNezaretci && !isOwner) {
    return (
      <div className="tsp-overlay" onClick={onClose}>
        <div className="tsp-panel" onClick={(e) => e.stopPropagation()}>
          {renderIcraModal()}
          <div className="tsp-header">
            <div className="tsp-header-left">
              <div className="tsp-checkbox">
                <FaRegCircle className="tsp-check-icon" />
              </div>
              {editingName ? (
                <input
                  className="tsp-name-input"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                  autoFocus
                />
              ) : (
                <h3
                  className="tsp-name"
                  onClick={() => setEditingName(true)}
                  title="Klikləyib adı dəyişin"
                >
                  {task.tapsirigAdi}
                </h3>
              )}
            </div>
            <div className="tsp-header-right">
  <div className="tsp-icra-header-btns">
    <button
      className={`tsp-icra-header-btn${myStatus === "gozlenir" ? " icra" : " passiv"}`}
      onClick={() => {
        if (myStatus === "gozlenir") {
          setIcraModalTip("icra");
          setIcraModal(true);
        }
      }}
    >
       İcraya götür
    </button>
    <button
      className={`tsp-icra-header-btn${myStatus === "tamamlandi" ? " done" : " tamamla"}`}
      onClick={() => {
        if (myStatus !== "tamamlandi") {
          setIcraModalTip("tamamla");
          setIcraModal(true);
        }
      }}
    >
      <FaCheckDouble /> Tamamladım
    </button>
  </div>
  <span
    className={`tsp-star${task.tecili ? " aktiv" : ""} disabled`}
  >
    {task.tecili ? "★" : "☆"}
  </span>
  <button className="tsp-close" onClick={onClose}>
    <FaTimes />
  </button>
</div>
          </div>
          <div className="tsp-columns">
            <div className="tsp-col-left">
              <div className="tsp-col-scroll">
                <div className="tsp-section">
                  <div className="tsp-sub-add">
                    <FaPlus className="tsp-sub-add-icon" />
                    <input
                      type="text"
                      className="tsp-sub-add-input"
                      placeholder="Alt tapşırıq əlavə et..."
                      value={yeniSubTask}
                      onChange={(e) => setYeniSubTask(e.target.value)}
                      onKeyDown={handleAddSubTask}
                    />
                  </div>
                  {(task.altTapsiriglar || []).length > 0 && (
                    <div className="tsp-sub-list">
                      {(task.altTapsiriglar || []).map((sub) => (
                        <div
                          key={sub.id}
                          className={`tsp-sub-item${sub.tamamlanib ? " done" : ""}`}
                        >
                          <div
                            className="tsp-sub-check"
                            onClick={() => toggleSubTask(sub.id)}
                          >
                            {sub.tamamlanib ? (
                              <FaCheckCircle className="tsp-sub-check-icon done" />
                            ) : (
                              <FaRegCircle className="tsp-sub-check-icon" />
                            )}
                          </div>
                          <span
                            className={`tsp-sub-ad${sub.tamamlanib ? " done" : ""}`}
                          >
                            {sub.ad}
                          </span>
                          <FaTimes
                            className="tsp-sub-del"
                            onClick={() => deleteSubTask(sub.id)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="tsp-section">
                  <div className="tsp-section-header">
                    <span>👤 İcraçılar ({task.secilmisShexsler.length})</span>
                  </div>
                  {task.secilmisShexsler.length > 0 && (
                    <div className="tsp-icracilar">
                      {task.secilmisShexsler.map((s) => (
                        <div
                          key={s.login}
                          className={`tsp-icraci status-${(s as any).status || "gozlenir"}`}
                        >
                          {(s as any).nezaretci && (
                            <span className="tsp-nezaretci-n">N</span>
                          )}
                          {/* NƏZARƏTÇİ GÖRÜNÜŞÜNDƏ NƏZARƏTÇI TƏYİN ETMƏK OLMAZ */}
                          <span className="tsp-icraci-ad">
                            {s.adSoyad}
                          </span>
                          <FaTimes
                            className="tsp-icraci-sil"
                            onClick={() =>
                              onUpdateTask({
                                ...task,
                                secilmisShexsler: task.secilmisShexsler.filter(
                                  (x) => x.login !== s.login,
                                ),
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="tsp-section tsp-row-section">
                  <div className="tsp-row-item">
                    <div className="tsp-section-header">
                      <FaCalendarAlt className="tsp-section-icon" />
                      <span>Son tarix</span>
                    </div>
                    <input
                      type="date"
                      className="tsp-date-input"
                      value={deadline}
                      onChange={(e) => handleDeadlineChange(e.target.value)}
                    />
                  </div>
                  <div className="tsp-row-item">
                    <div
                      className="tsp-section-header"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FaPaperclip className="tsp-section-icon" />
                      <span>Fayl əlavə et</span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      style={{ display: "none" }}
                      onChange={handleFileAdd}
                    />
                    {task.fayllar.length > 0 && (
                      <div className="tsp-files">
                        {task.fayllar.map((f, i) => (
                          <div key={i} className="tsp-file-item">
                            <span className="tsp-file-name">📎 {f.name}</span>
                            <span className="tsp-file-size">
                              {formatFileSize(f.size)}
                            </span>
                            <FaTrash
                              className="tsp-file-del"
                              onClick={() => handleFileRemove(i)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="tsp-section">
                  <textarea
                    className="tsp-qeyd"
                    placeholder="Qeyd əlavə et..."
                    value={qeyd}
                    onChange={(e) => setQeyd(e.target.value)}
                    onBlur={handleQeydSave}
                    rows={2}
                  />
                </div>
                <div className="tsp-section tsp-user-section">
                  <div className="tsp-section-header">
                    <span>👥 İstifadəçilər</span>
                  </div>
                  <div className="tsp-user-search">
                    <FaSearch className="tsp-user-search-icon" />
                    <input
                      type="text"
                      placeholder="Ad axtar..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                  <div className="tsp-user-list">
                    {filteredUsers.length === 0 ? (
                      <p className="tsp-empty-sm">İstifadəçi tapılmadı</p>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSelected = task.secilmisShexsler.some(
                          (s) => s.login === u.login,
                        );
                        const bolmeAd = getBolmeName(u.bolmeId);
                        return (
                          <div
                            key={u.login}
                            className={`tsp-user-card-sm${isSelected ? " selected" : ""}`}
                            onClick={() => toggleIcraci(u)}
                          >
                            <div className="tsp-user-card-sm-avatar">
                              {u.adSoyad.charAt(0).toUpperCase()}
                            </div>
                            <div className="tsp-user-card-sm-info">
                              <span className="tsp-user-card-sm-name">
                                {u.adSoyad}
                              </span>
                              <span className="tsp-user-card-sm-meta">
                                {u.rol}
                                {bolmeAd ? ` • ${bolmeAd}` : ""}
                              </span>
                            </div>
                            <div
                              className={`tsp-user-card-sm-check${isSelected ? " active" : ""}`}
                            >
                              {isSelected ? <FaCheckCircle /> : <FaRegCircle />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
            {renderMessages()}
          </div>
          <div className="tsp-footer">
            <div className="tsp-footer-info">
              <span>
                Tapşırığı verən: <strong>{task.veren}</strong>
              </span>
              <span>Yaranma: {task.tarix}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // 3. İCRAÇI GÖRÜNÜŞÜ
  // ============================================
  if (isIcraci && !isOwner) {
    return (
      <div className="tsp-overlay" onClick={onClose}>
        <div className="tsp-panel" onClick={(e) => e.stopPropagation()}>
          {renderIcraModal()}
          <div className="tsp-header">
            <div className="tsp-header-left">
              <div className="tsp-checkbox">
                <FaRegCircle className="tsp-check-icon" />
              </div>
              <h3 className="tsp-name">{task.tapsirigAdi}</h3>
            </div>
            <div className="tsp-header-right">
              {/* HƏMİŞƏ İKİ DÜYMƏ YAN YANA */}
              <div className="tsp-icra-header-btns">
                <button
                  className={`tsp-icra-header-btn${myStatus === "gozlenir" ? " icra" : " passiv"}`}
                  onClick={() => {
                    if (myStatus === "gozlenir") {
                      setIcraModalTip("icra");
                      setIcraModal(true);
                    }
                  }}
                >
                   İcraya götür
                </button>
                <button
                  className={`tsp-icra-header-btn${myStatus === "tamamlandi" ? " done" : " tamamla"}`}
                  onClick={() => {
                    if (myStatus !== "tamamlandi") {
                      setIcraModalTip("tamamla");
                      setIcraModal(true);
                    }
                  }}
                >
                  <FaCheckDouble /> Tamamladım
                </button>
              </div>

              <span
                className={`tsp-star${task.tecili ? " aktiv" : ""} disabled`}
              >
                {task.tecili ? "★" : "☆"}
              </span>
              <button className="tsp-close" onClick={onClose}>
                <FaTimes />
              </button>
            </div>
          </div>
          <div className="tsp-columns">
            <div className="tsp-col-left">
              <div className="tsp-col-scroll">
                {(task.altTapsiriglar || []).length > 0 && (
                  <div className="tsp-section">
                    <div className="tsp-section-header">
                      <span>📋 Alt tapşırıqlar</span>
                    </div>
                    <div className="tsp-sub-list">
                      {(task.altTapsiriglar || []).map((sub) => (
                        <div
                          key={sub.id}
                          className={`tsp-sub-item${sub.tamamlanib ? " done" : ""}`}
                        >
                          <div
                            className="tsp-sub-check"
                            onClick={() => toggleSubTask(sub.id)}
                          >
                            {sub.tamamlanib ? (
                              <FaCheckCircle className="tsp-sub-check-icon done" />
                            ) : (
                              <FaRegCircle className="tsp-sub-check-icon" />
                            )}
                          </div>
                          <span
                            className={`tsp-sub-ad${sub.tamamlanib ? " done" : ""}`}
                          >
                            {sub.ad}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="tsp-section">
                  <div className="tsp-section-header">
                    <span>👤 İcraçılar ({task.secilmisShexsler.length})</span>
                  </div>
                  {task.secilmisShexsler.length > 0 && (
                    <div className="tsp-icracilar">
                      {task.secilmisShexsler.map((s) => (
                        <div
                          key={s.login}
                          className={`tsp-icraci status-${(s as any).status || "gozlenir"}`}
                        >
                          <span className="tsp-icraci-ad">{s.adSoyad}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {deadline && (
                  <div className="tsp-section">
                    <div className="tsp-section-header">
                      <FaCalendarAlt className="tsp-section-icon" />
                      <span>Son tarix</span>
                    </div>
                    <span className="tsp-date-text">{deadline}</span>
                  </div>
                )}
                {task.fayllar.length > 0 && (
                  <div className="tsp-section">
                    <div className="tsp-section-header">
                      <FaPaperclip className="tsp-section-icon" />
                      <span>Fayllar</span>
                    </div>
                    <div className="tsp-files">
                      {task.fayllar.map((f, i) => (
                        <div key={i} className="tsp-file-item">
                          <a
                            href={f.base64}
                            download={f.name}
                            className="tsp-file-name"
                          >
                            📎 {f.name}
                          </a>
                          <span className="tsp-file-size">
                            {formatFileSize(f.size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {task.qeyd && (
                  <div className="tsp-section">
                    <div className="tsp-section-header">
                      <span>📝 Qeyd</span>
                    </div>
                    <p className="tsp-icraci-qeyd">{task.qeyd}</p>
                  </div>
                )}
              </div>
            </div>
            {renderMessages()}
          </div>
          <div className="tsp-footer">
            <div className="tsp-footer-info">
              <span>
                Tapşırığı verən: <strong>{task.veren}</strong>
              </span>
              <span>Yaranma: {task.tarix}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // 4. OWNER GÖRÜNÜŞÜ
  // ============================================
  return (
    <div className="tsp-overlay" onClick={onClose}>
      <div className="tsp-panel" onClick={(e) => e.stopPropagation()}>
        <div className="tsp-header">
          <div className="tsp-header-left">
            <div className="tsp-checkbox" onClick={handleComplete}>
              <FaRegCircle className="tsp-check-icon clickable" />
            </div>
            {editingName ? (
              <input
                className="tsp-name-input"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                autoFocus
              />
            ) : (
              <h3
                className="tsp-name"
                onClick={() => setEditingName(true)}
                title="Klikləyib adı dəyişin"
              >
                {task.tapsirigAdi}
              </h3>
            )}
          </div>
          <div className="tsp-header-right">
            <span
              className={`tsp-star${task.tecili ? " aktiv" : ""}`}
              onClick={handleTeciliToggle}
            >
              {task.tecili ? "★" : "☆"}
            </span>
            <button className="tsp-close" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </div>
        <div className="tsp-columns">
          <div className="tsp-col-left">
            <div className="tsp-col-scroll">
              <div className="tsp-section">
                <div className="tsp-sub-add">
                  <FaPlus className="tsp-sub-add-icon" />
                  <input
                    type="text"
                    className="tsp-sub-add-input"
                    placeholder="Alt tapşırıq əlavə et..."
                    value={yeniSubTask}
                    onChange={(e) => setYeniSubTask(e.target.value)}
                    onKeyDown={handleAddSubTask}
                  />
                </div>
                {(task.altTapsiriglar || []).length > 0 && (
                  <div className="tsp-sub-list">
                    {(task.altTapsiriglar || []).map((sub) => (
                      <div
                        key={sub.id}
                        className={`tsp-sub-item${sub.tamamlanib ? " done" : ""}`}
                      >
                        <div
                          className="tsp-sub-check"
                          onClick={() => toggleSubTask(sub.id)}
                        >
                          {sub.tamamlanib ? (
                            <FaCheckCircle className="tsp-sub-check-icon done" />
                          ) : (
                            <FaRegCircle className="tsp-sub-check-icon" />
                          )}
                        </div>
                        <span
                          className={`tsp-sub-ad${sub.tamamlanib ? " done" : ""}`}
                        >
                          {sub.ad}
                        </span>
                        <FaTimes
                          className="tsp-sub-del"
                          onClick={() => deleteSubTask(sub.id)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="tsp-section">
                <div className="tsp-section-header">
                  <span>👤 İcraçılar ({task.secilmisShexsler.length})</span>
                </div>
                {task.secilmisShexsler.length > 0 && (
                  <div className="tsp-icracilar">
                    {task.secilmisShexsler.map((s) => (
                      <div
                        key={s.login}
                        className={`tsp-icraci status-${(s as any).status || "gozlenir"}${(s as any).nezaretci ? " nezaretci" : ""}`}
                      >
                        {(s as any).nezaretci && (
                          <span className="tsp-nezaretci-n">N</span>
                        )}
                        <span
                          className="tsp-icraci-ad"
                          onClick={() => {
  const isNezaretciNow = (s as any).nezaretci;
  const updated = task.secilmisShexsler.map((x) =>
    x.login === s.login
      ? { ...x, nezaretci: !isNezaretciNow }
      : x,
  );
  const sorted = [
    ...updated.filter((x) => (x as any).nezaretci),
    ...updated.filter((x) => !(x as any).nezaretci),
  ];
  onUpdateTask({
    ...task,
    secilmisShexsler: sorted,
  });
}}
                          title={
                            (s as any).nezaretci
                              ? "Nəzarətçilikdən çıxart"
                              : "Nəzarətçi təyin et"
                          }
                        >
                          {s.adSoyad}
                        </span>
                        <FaTimes
                          className="tsp-icraci-sil"
                          onClick={() =>
                            onUpdateTask({
                              ...task,
                              secilmisShexsler: task.secilmisShexsler.filter(
                                (x) => x.login !== s.login,
                              ),
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="tsp-section tsp-row-section">
                <div className="tsp-row-item">
                  <div className="tsp-section-header">
                    <FaCalendarAlt className="tsp-section-icon" />
                    <span>Son tarix</span>
                  </div>
                  <input
                    type="date"
                    className="tsp-date-input"
                    value={deadline}
                    onChange={(e) => handleDeadlineChange(e.target.value)}
                  />
                </div>
                <div className="tsp-row-item">
                  <div
                    className="tsp-section-header"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FaPaperclip className="tsp-section-icon" />
                    <span>Fayl əlavə et</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: "none" }}
                    onChange={handleFileAdd}
                  />
                  {task.fayllar.length > 0 && (
                    <div className="tsp-files">
                      {task.fayllar.map((f, i) => (
                        <div key={i} className="tsp-file-item">
                          <span className="tsp-file-name">📎 {f.name}</span>
                          <span className="tsp-file-size">
                            {formatFileSize(f.size)}
                          </span>
                          <FaTrash
                            className="tsp-file-del"
                            onClick={() => handleFileRemove(i)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="tsp-section">
                <textarea
                  className="tsp-qeyd"
                  placeholder="Qeyd əlavə et..."
                  value={qeyd}
                  onChange={(e) => setQeyd(e.target.value)}
                  onBlur={handleQeydSave}
                  rows={2}
                />
              </div>
              <div className="tsp-section tsp-user-section">
                <div className="tsp-section-header">
                  <span>👥 İstifadəçilər</span>
                </div>
                <div className="tsp-user-search">
                  <FaSearch className="tsp-user-search-icon" />
                  <input
                    type="text"
                    placeholder="Ad axtar..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <div className="tsp-user-list">
                  {filteredUsers.length === 0 ? (
                    <p className="tsp-empty-sm">İstifadəçi tapılmadı</p>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelected = task.secilmisShexsler.some(
                        (s) => s.login === u.login,
                      );
                      const bolmeAd = getBolmeName(u.bolmeId);
                      return (
                        <div
                          key={u.login}
                          className={`tsp-user-card-sm${isSelected ? " selected" : ""}`}
                          onClick={() => toggleIcraci(u)}
                        >
                          <div className="tsp-user-card-sm-avatar">
                            {u.adSoyad.charAt(0).toUpperCase()}
                          </div>
                          <div className="tsp-user-card-sm-info">
                            <span className="tsp-user-card-sm-name">
                              {u.adSoyad}
                            </span>
                            <span className="tsp-user-card-sm-meta">
                              {u.rol}
                              {bolmeAd ? ` • ${bolmeAd}` : ""}
                            </span>
                          </div>
                          <div
                            className={`tsp-user-card-sm-check${isSelected ? " active" : ""}`}
                          >
                            {isSelected ? <FaCheckCircle /> : <FaRegCircle />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
          {renderMessages()}
        </div>
        <div className="tsp-footer">
          <div className="tsp-footer-info">
            <span>
              Tapşırığı verən: <strong>{task.veren}</strong>
            </span>
            <span>Yaranma: {task.tarix}</span>
          </div>
          <button className="tsp-delete-btn" onClick={handleDelete}>
            <FaTrash /> Sil
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskSidePanel;