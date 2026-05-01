import { useState, useEffect, useRef } from "react";
import { usersAPI, mapUserDto, muessiselerAPI, bolmelerAPI, mapMuessiseDto, mapBolmeDto } from "../../services/api";
import {
  FaComments,
  FaTimes,
  FaMinus,
  FaExpand,
  FaCompress,
  FaSearch,
  FaPaperPlane,
  FaArrowLeft,
  FaPaperclip,
  FaTrash,
  FaCheck,
  FaCheckDouble,
  FaCircle,
  FaPencilAlt,
} from "react-icons/fa";
import {
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  editMessage,
  getUnreadCount,
  getConversations,
  heartbeat,
  getOnlineUsers,
} from "./chatService";
import type { ChatMessage, Conversation } from "./chatService";
import "./ChatWidget.css";

interface User {
  login: string;
  parol: string;
  rol: string;
  adSoyad: string;
  companyId?: string;
  bolmeId?: string;
  rutbe?: string;
  vezife?: string;
}

interface ChatWidgetProps {
  currentUser: User;
  hidden?: boolean;
}

type ChatView = "closed" | "list" | "chat";
type ChatSize = "normal" | "minimized" | "maximized";

function ChatWidget({ currentUser, hidden }: ChatWidgetProps) {
  const [view, setView] = useState<ChatView>("closed");
  const [pos, setPos] = useState({ x: window.innerWidth - 25 - 56, y: window.innerHeight - 24 - 56 });
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const [size, setSize] = useState<ChatSize>("normal");
  const [search, setSearch] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [muessiseler, setMuessiseler] = useState<{ id: string; ad: string }[]>([]);
  const [bolmeler, setBolmeler] = useState<{ id: string; ad: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgInputRef = useRef<HTMLInputElement>(null);

  // Heartbeat + online users
  useEffect(() => {
    const tick = async () => {
      try {
        await heartbeat()
        setOnlineUsers(await getOnlineUsers())
      } catch { /* ignore */ }
    }
    tick()
    const interval = setInterval(tick, 30000)
    return () => clearInterval(interval)
  }, [currentUser.login]);

  useEffect(() => {
    usersAPI.getAll().then((data: any[]) => {
      setAllUsers(
        (data || []).map(mapUserDto).filter(
          (u: any) => u.login !== currentUser.login && u.rol !== "SuperAdmin",
        ) as User[],
      );
    }).catch(() => setAllUsers([]));

    muessiselerAPI.getAll().then((data: any[]) => {
      setMuessiseler((data || []).map(mapMuessiseDto).map((m: any) => ({ id: m.id, ad: m.ad })));
    }).catch(() => {});

    bolmelerAPI.getAll().then((data: any[]) => {
      setBolmeler((data || []).map(mapBolmeDto).map((b: any) => ({ id: b.id, ad: b.ad })));
    }).catch(() => {});
  }, [currentUser.login]);

  // Poll unread count + conversations + online users every 3s
  useEffect(() => {
    const update = async () => {
      try {
        const [count, convs, online] = await Promise.all([getUnreadCount(), getConversations(), getOnlineUsers()])
        setUnreadTotal(count)
        setConversations(convs)
        setOnlineUsers(online)
      } catch { /* ignore */ }
    }
    update()
    const interval = setInterval(update, 3000)
    return () => clearInterval(interval)
  }, [currentUser.login]);

  // Poll messages when chat is open
 const prevMsgCount = useRef(0);

const playNotificationSound = () => {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.frequency.setValueAtTime(880, ctx.currentTime);
  oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.3);
};

useEffect(() => {
  if (!selectedUser) return;
  const update = async () => {
    try {
      const msgs = await getMessages(currentUser.login, selectedUser.login)
      const last = msgs[msgs.length - 1];
      if (
        msgs.length > prevMsgCount.current &&
        last?.gonderenLogin !== currentUser.login
      ) {
        playNotificationSound();
      }
      prevMsgCount.current = msgs.length;
      setMessages(msgs)
      await markAsRead(currentUser.login, selectedUser.login)
    } catch { /* ignore */ }
  };
  update();
  const interval = setInterval(update, 2000);
  return () => clearInterval(interval);
}, [selectedUser, currentUser.login]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredUsers = allUsers.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.adSoyad.toLowerCase().includes(q) ||
      u.login.toLowerCase().includes(q) ||
      u.rol.toLowerCase().includes(q)
    );
  });

  const getUsersWithChats = () => {
    return conversations
      .map((conv) => ({
        user: allUsers.find((u) => u.login === conv.partnerLogin),
        lastMsg: conv.lastMessage,
        unread: conv.unreadCount,
      }))
      .filter((item): item is { user: User; lastMsg: ChatMessage; unread: number } => !!item.user)
      .sort((a, b) => new Date(b.lastMsg.createdAtIso).getTime() - new Date(a.lastMsg.createdAtIso).getTime());
  };

  const getUnreadFromConvs = (partnerLogin: string): number =>
    conversations.find((c) => c.partnerLogin === partnerLogin)?.unreadCount ?? 0;

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    if (editingMsgId) {
      try {
        await editMessage(editingMsgId, newMessage.trim())
        const msgs = await getMessages(currentUser.login, selectedUser.login)
        setMessages(msgs)
        setEditingMsgId(null)
        setNewMessage("")
      } catch { /* ignore */ }
    } else {
      try {
        await sendMessage({
          gonderenLogin: currentUser.login,
          gonderenAd: currentUser.adSoyad,
          alanLogin: selectedUser.login,
          alanAd: selectedUser.adSoyad,
          metn: newMessage.trim(),
        })
        setNewMessage("")
        const msgs = await getMessages(currentUser.login, selectedUser.login)
        setMessages(msgs)
      } catch { /* ignore */ }
    }
  };

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMsgId(msg.id);
    setNewMessage(msg.metn);
    setTimeout(() => msgInputRef.current?.focus(), 50);
  };

  const handleCancelEdit = () => {
    setEditingMsgId(null);
    setNewMessage("");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Fayl 2MB-dan böyükdür");
      return;
    }
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    try {
      await sendMessage({
        gonderenLogin: currentUser.login,
        gonderenAd: currentUser.adSoyad,
        alanLogin: selectedUser.login,
        alanAd: selectedUser.adSoyad,
        metn: `📎 ${file.name}`,
        fayl: { name: file.name, type: file.type, base64 },
      })
      e.target.value = "";
      const msgs = await getMessages(currentUser.login, selectedUser.login)
      setMessages(msgs)
    } catch { /* ignore */ }
  };

  const handleDelete = async (msgId: string) => {
    try {
      await deleteMessage(msgId)
      setMessages((prev) => prev.filter((m) => m.id !== msgId))
    } catch { /* ignore */ }
  };

  const getCompanyName = (companyId?: string) =>
    !companyId ? "" : muessiseler.find((m) => m.id === companyId)?.ad ?? "";

  const getBolmeName = (bolmeId?: string) =>
    !bolmeId ? "" : bolmeler.find((b) => b.id === bolmeId)?.ad ?? "";

  const getUserLine1 = (user: User) => {
    const parts = [user.rol];
    if (user.rutbe) parts.push(user.rutbe);
    if (user.vezife) parts.push(user.vezife);
    return parts.join(" • ");
  };

  const getUserLine2 = (user: User) => {
    const parts = [];
    const company = getCompanyName(user.companyId);
    const bolme = getBolmeName(user.bolmeId);
    if (company) parts.push(company);
    if (bolme) parts.push(bolme);
    return parts.join(" • ");
  };

  const openChat = async (user: User) => {
    setSelectedUser(user);
    setView("chat");
    try { await markAsRead(currentUser.login, user.login) } catch { /* ignore */ }
  };

  if (view === "closed") {
    if (hidden) return null;
    return (
      <div
        className="chat-fab"
        style={{ left: pos.x, top: pos.y, right: "auto", bottom: "auto" }}
        onMouseDown={(e) => {
          e.preventDefault();
          isDragging.current = false;
          hasDragged.current = false;
          const startX = e.clientX;
          const startY = e.clientY;
          const onMouseMove = (me: MouseEvent) => {
            const dx = Math.abs(me.clientX - startX);
            const dy = Math.abs(me.clientY - startY);
            if (dx > 5 || dy > 5) {
              isDragging.current = true;
              hasDragged.current = true;
            }
            if (isDragging.current) {
              setPos({ x: me.clientX - 28, y: me.clientY - 28 });
            }
          };
          const onMouseUp = () => {
            isDragging.current = false;
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
          };
          window.addEventListener("mousemove", onMouseMove);
          window.addEventListener("mouseup", onMouseUp);
        }}
        onClick={() => {
          if (!hasDragged.current) setView("list");
          hasDragged.current = false;
        }}
      >
        <FaComments />
        {unreadTotal > 0 && <span className="chat-fab-badge">{unreadTotal}</span>}
      </div>
    );
  }

  if (size === "minimized") {
    return (
      <div className="chat-minimized" onClick={() => setSize("normal")}>
        <FaComments style={{ marginRight: 8 }} />
        <span>Chat</span>
        {unreadTotal > 0 && <span className="chat-min-badge">{unreadTotal}</span>}
        <button
          className="chat-min-close"
          onClick={(e) => {
            e.stopPropagation();
            setView("closed");
            setSize("normal");
          }}
        >
          <FaTimes />
        </button>
      </div>
    );
  }

  return (
    <div className={`chat-widget ${size === "maximized" ? "chat-maximized" : "chat-normal"}`}>
      {/* BAŞLIQ */}
      <div className="chat-header">
        <div className="chat-header-left">
          {view === "chat" && (
            <button
              className="chat-back-btn"
              onClick={() => {
                setView("list");
                setSelectedUser(null);
                setEditingMsgId(null);
                setNewMessage("");
              }}
            >
              <FaArrowLeft />
            </button>
          )}
          {view === "chat" && selectedUser ? (
            <div className="chat-header-user">
              <span className="chat-header-name">{selectedUser.adSoyad}</span>
              <span className="chat-header-status">
                {onlineUsers.has(selectedUser.login) ? (
                  <><FaCircle className="online-dot" /> Online</>
                ) : (
                  <><FaCircle className="offline-dot" /> Offline</>
                )}
              </span>
            </div>
          ) : (
            <span className="chat-header-title">💬 Chat</span>
          )}
        </div>
        <div className="chat-header-btns">
          <button onClick={() => setSize("minimized")} title="Kiçilt"><FaMinus /></button>
          <button
            onClick={() => setSize(size === "maximized" ? "normal" : "maximized")}
            title={size === "maximized" ? "Normal" : "Tam ekran"}
          >
            {size === "maximized" ? <FaCompress /> : <FaExpand />}
          </button>
          <button
            onClick={() => { setView("closed"); setSize("normal"); setSelectedUser(null); setEditingMsgId(null); setNewMessage(""); }}
            title="Bağla"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* İSTİFADƏÇİ SİYAHISI */}
      {view === "list" && (
        <div className="chat-body">
          <div className="chat-search">
            <FaSearch className="chat-search-icon" />
            <input
              type="text"
              placeholder="Ad Soyad axtar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="chat-user-list">
            {!search.trim() && getUsersWithChats().length > 0 && (
              <>
                <p className="chat-section-title">Son yazışmalar</p>
                {getUsersWithChats().map(({ user, lastMsg, unread }) => (
                  <div key={user.login} className="chat-user-item" onClick={() => openChat(user)}>
                    <div className="chat-user-avatar">
                      {user.adSoyad.charAt(0).toUpperCase()}
                      <span className={`chat-user-dot ${onlineUsers.has(user.login) ? "online" : "offline"}`} />
                    </div>
                    <div className="chat-user-info">
                      <span className="chat-user-name">{user.adSoyad}</span>
                      <span className="chat-user-meta">{getUserLine1(user)}</span>
                      {getUserLine2(user) && <span className="chat-user-meta">{getUserLine2(user)}</span>}
                      <span className="chat-user-last">{lastMsg?.metn}</span>
                    </div>
                    {unread > 0 && <span className="chat-user-unread">{unread}</span>}
                  </div>
                ))}
              </>
            )}

            {search.trim() && (
              <>
                <p className="chat-section-title">Axtarış nəticəsi</p>
                {filteredUsers.length === 0 ? (
                  <p className="chat-empty">İstifadəçi tapılmadı</p>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.login} className="chat-user-item" onClick={() => openChat(user)}>
                      <div className="chat-user-avatar">
                        {user.adSoyad.charAt(0).toUpperCase()}
                        <span className={`chat-user-dot ${onlineUsers.has(user.login) ? "online" : "offline"}`} />
                      </div>
                      <div className="chat-user-info">
                        <span className="chat-user-name">{user.adSoyad}</span>
                        <span className="chat-user-meta">{getUserLine1(user)}</span>
                        {getUserLine2(user) && <span className="chat-user-meta">{getUserLine2(user)}</span>}
                      </div>
                      {getUnreadFromConvs(user.login) > 0 && (
                        <span className="chat-user-unread">{getUnreadFromConvs(user.login)}</span>
                      )}
                    </div>
                  ))
                )}
              </>
            )}

            {!search.trim() && getUsersWithChats().length === 0 && (
              <p className="chat-empty">Hələ yazışma yoxdur. Axtarışdan istifadəçi tapın.</p>
            )}
          </div>
        </div>
      )}

      {/* MESAJLAŞMA */}
      {view === "chat" && selectedUser && (
        <>
          <div className="chat-messages">
            {messages.length === 0 ? (
              <p className="chat-empty">Hələ mesaj yoxdur. İlk mesajı göndər!</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-msg ${msg.gonderenLogin === currentUser.login ? "chat-msg-mine" : "chat-msg-other"}`}
                >
                  {msg.fayl && msg.fayl.type.startsWith("image/") ? (
                    <img src={msg.fayl.base64} alt={msg.fayl.name} className="chat-msg-img" />
                  ) : msg.fayl ? (
                    <a href={msg.fayl.base64} download={msg.fayl.name} className="chat-msg-file">
                      📎 {msg.fayl.name}
                    </a>
                  ) : (
                    <div className="chat-msg-metn-row">
                      <span className="chat-msg-text">
                        {msg.metn}
                        {msg.redakte && <span className="chat-msg-redakte"> ✎</span>}
                      </span>
                      {msg.gonderenLogin === currentUser.login && (
                        <button
                          className="chat-msg-edit-btn"
                          onClick={() => handleStartEdit(msg)}
                          title="Redaktə et"
                        >
                          <FaPencilAlt />
                        </button>
                      )}
                    </div>
                  )}
                  <div className="chat-msg-footer">
                    <span className="chat-msg-time">{msg.tarix}</span>
                    {msg.gonderenLogin === currentUser.login && (
                      <>
                        {msg.oxundu ? (
                          <FaCheckDouble className="chat-msg-read" />
                        ) : (
                          <FaCheck className="chat-msg-unread" />
                        )}
                        <button className="chat-msg-del" onClick={() => handleDelete(msg.id)}>
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <div className={`chat-input-bar${editingMsgId ? " editing" : ""}`}>
            {editingMsgId && (
              <div className="chat-edit-indicator">
                <span>✎ Redaktə rejimi</span>
                <button onClick={handleCancelEdit}><FaTimes /></button>
              </div>
            )}
            <div className="chat-input-row">
              {!editingMsgId && (
                <>
                  <button className="chat-attach-btn" onClick={() => fileInputRef.current?.click()}>
                    <FaPaperclip />
                  </button>
                  <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelect} />
                </>
              )}
              <input
                ref={msgInputRef}
                type="text"
                className="chat-input"
                placeholder={editingMsgId ? "Mesajı düzəldin..." : "Mesaj yazın..."}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                  if (e.key === "Escape" && editingMsgId) handleCancelEdit();
                }}
              />
              <button className="chat-send-btn" onClick={handleSend}>
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ChatWidget;
