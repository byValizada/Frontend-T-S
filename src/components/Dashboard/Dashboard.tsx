import { useState, useEffect } from "react";
import {
  FaPlus, FaRegCircle, FaCheckCircle, FaTrash, FaCircle, FaSearch,FaComments,
} from "react-icons/fa";
import Sidebar from "../Sidebar/Sidebar";
import TaskModal from "../TaskModal/TaskModal";
import type { NewTask } from "../TaskModal/TaskModal";
import TaskSidePanel from "../shared/TaskSidePanel";
import NoteDetailModal from "../TaskDetailModal/NoteDetailModal";
import ElanBildirisi from "./ElanBildirisi";
import { addLog } from "../shared/logHelper";
import "./Dashboard.css";
import ThemeToggle from '../shared/ThemeToggle';
import ChatWidget from '../shared/ChatWidget';
import { tasksAPI, notesAPI } from "../../services/api";

interface User {
  login: string;
  parol: string;
  rol: string;
  adSoyad: string;
  companyId?: string;
  bolmeId?: string;
}

interface DashboardProps {
  currentUser: User;
  onLogout: () => void;
  onGoToAdminPanel: () => void;
}

interface Note {
  id: string;
  metn: string;
  notlar: string;
  tamamlanib: boolean;
  yaranmaTarixi: string;
  tarixAktiv?: boolean;
  saatAktiv?: boolean;
  tarix?: string;
  saat?: string;
}


function Dashboard({ currentUser, onLogout, onGoToAdminPanel }: DashboardProps) {
  const [activePage, setActivePage] = useState<"tasks" | "notes">("tasks");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [myTasks, setMyTasks] = useState<NewTask[]>([]);
  const [sidePanelTask, setSidePanelTask] = useState<NewTask | null>(null);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [checkingTaskId, setCheckingTaskId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [yeniQeyd, setYeniQeyd] = useState("");
  const [isCompletedNotesOpen, setIsCompletedNotesOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isNoteDetailOpen, setIsNoteDetailOpen] = useState(false);
  const [fadingNoteId, setFadingNoteId] = useState<string | null>(null);
  const [yeniTapsirig, setYeniTapsirig] = useState("");
  const [activeTasksOpen, setActiveTasksOpen] = useState(true);
  const [activeSearch, setActiveSearch] = useState("");
  const [completedSearch, setCompletedSearch] = useState("");

  const loadMyTasks = async () => {
    try {
      const all: NewTask[] = await tasksAPI.getAll();
      const mine = (all || []).filter((task: NewTask) => {
        const meneQoyulan = task.secilmisShexsler.some((s: any) => s.login === currentUser.login);
        const menimQoydugum = task.verenLogin === currentUser.login;
        const nezaretciyem = task.secilmisShexsler.some((s: any) => s.login === currentUser.login && s.nezaretci);
        return meneQoyulan || menimQoydugum || nezaretciyem;
      });
      setMyTasks(mine);
    } catch { setMyTasks([]); }
  };

  useEffect(() => {
    loadMyTasks();
    notesAPI.getAll(currentUser.login)
      .then(data => setNotes(data || []))
      .catch(() => setNotes([]));
  }, [currentUser.login]);

  // Poll only when the panel is closed to avoid overwriting optimistic updates.
  // No immediate refresh on close — tasksAPI.complete/update may still be in-flight.
  useEffect(() => {
    if (sidePanelTask) return;
    const interval = setInterval(loadMyTasks, 8000);
    return () => clearInterval(interval);
  }, [!!sidePanelTask]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQuickAddTask = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && yeniTapsirig.trim()) {
      const newTask: NewTask = {
        id: Date.now().toString(),
        tapsirigAdi: yeniTapsirig.trim(),
        qeyd: "",
        veren: currentUser.adSoyad,
        verenLogin: currentUser.login,
        secilmisShexsler: [],
        deadline: "",
        fayllar: [],
        tarix: new Date().toLocaleString("az-AZ"),
        tamamlanib: false,
      };
      try {
        const saved = await tasksAPI.create(newTask);
        setMyTasks(prev => [...prev, saved || newTask]);
      } catch { setMyTasks(prev => [...prev, newTask]); }
      addLog("tapsirig_yarat", currentUser.adSoyad, currentUser.login, `"${newTask.tapsirigAdi}" tapşırığını yaratdı`);
      setYeniTapsirig("");
    }
  };

  const handleSaveTask = async (task: NewTask) => {
    try {
      const saved = await tasksAPI.create(task);
      setMyTasks(prev => [...prev, saved || task]);
    } catch { setMyTasks(prev => [...prev, task]); }
    addLog("tapsirig_yarat", currentUser.adSoyad, currentUser.login, `"${task.tapsirigAdi}" tapşırığını yaratdı`);
  };

  const handleUpdateTask = async (updatedTask: NewTask, openPanel = false) => {
    setMyTasks(prev => prev.map((t: NewTask) => t.id === updatedTask.id ? updatedTask : t));
    if (openPanel) setSidePanelTask(updatedTask);
    else if (sidePanelTask?.id === updatedTask.id) setSidePanelTask(updatedTask);
    try { await tasksAPI.update(updatedTask.id, updatedTask); } catch {}
  };

  const handleDeleteTask = async (taskId: string) => {
    setMyTasks(prev => prev.filter((t: NewTask) => t.id !== taskId));
    addLog("tapsirig_sil", currentUser.adSoyad, currentUser.login, "Tapşırıq silindi");
    try { await tasksAPI.delete(taskId); } catch {}
  };

  const handleCheckboxClick = (e: React.MouseEvent, task: NewTask) => {
    e.stopPropagation();
    if (task.verenLogin !== currentUser.login) return;
    if (task.tamamlanib) return;
    setCheckingTaskId(task.id);
    setTimeout(() => {
      const updatedTask = { ...task, tamamlanib: true, tamamlanmaTarixi: new Date().toLocaleDateString("az-AZ") };
      setMyTasks(prev => prev.map((t: NewTask) => t.id === updatedTask.id ? updatedTask : t));
      tasksAPI.complete(task.id).catch(() => {});
      addLog("tapsirig_tamamla", currentUser.adSoyad, currentUser.login, `"${task.tapsirigAdi}" tapşırığını tamamladı`);
      setCheckingTaskId(null);
    }, 800);
  };

  const handleToggleNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const note = notes.find((n) => n.id === id);
    if (!note || note.tamamlanib) return;
    setFadingNoteId(id);
    setTimeout(() => {
      const updated = { ...note, tamamlanib: true };
      setNotes(prev => prev.map(n => n.id === id ? updated : n));
      notesAPI.update(currentUser.login, id, updated).catch(() => {});
      setFadingNoteId(null);
    }, 500);
  };


  const handleAddNote = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && yeniQeyd.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        metn: yeniQeyd.trim(),
        notlar: "",
        tamamlanib: false,
        yaranmaTarixi: new Date().toLocaleString("az-AZ"),
      };
      try {
        const saved = await notesAPI.create(currentUser.login, newNote);
        setNotes(prev => [saved || newNote, ...prev]);
      } catch { setNotes(prev => [newNote, ...prev]); }
      setYeniQeyd("");
    }
  };

  const handleNoteSave = (updatedNote: Note) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    notesAPI.update(currentUser.login, updatedNote.id, updatedNote).catch(() => {});
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setIsNoteDetailOpen(true);
  };

  const handleNoteDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotes(prev => prev.filter(n => n.id !== id));
    notesAPI.delete(currentUser.login, id).catch(() => {});
  };

  const sortByDeadline = (a: NewTask, b: NewTask) => {
  if (!a.deadline && !b.deadline) return Number(b.id) - Number(a.id);
  if (!a.deadline) return 1;
  if (!b.deadline) return -1;
  return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
};

const myActiveTasks = myTasks
  .filter(task => !task.tamamlanib)
  .filter(task => task.tapsirigAdi.toLowerCase().includes(activeSearch.toLowerCase()))
  .sort((a, b) => {
    if (a.tecili && !b.tecili) return -1;
    if (!a.tecili && b.tecili) return 1;
    return sortByDeadline(a, b);
  });

const myCompletedTasks = myTasks.filter(task => task.tamamlanib);

const filteredCompletedTasks = myCompletedTasks
  .filter(task => task.tapsirigAdi.toLowerCase().includes(completedSearch.toLowerCase()));
  const activeNotes = notes.filter((n) => !n.tamamlanib);
  const completedNotes = notes.filter((n) => n.tamamlanib);

  return (
    <div className="dashboard">
      <Sidebar
        currentUser={currentUser}
        onLogout={onLogout}
        onGoToAdminPanel={onGoToAdminPanel}
        activePage={activePage}
        onPageChange={setActivePage}
      />

      <main className="main-content">

        {/* ÜMUMİ TAPŞIRIQLAR */}
        {activePage === "tasks" && (
          <section className="bolme">
          <div className="baslig-sira">
  <h2 style={{ cursor: 'pointer' }} onClick={() => setActiveTasksOpen(!activeTasksOpen)}>
    {activeTasksOpen ? "▼" : "▶"} Tapşırıqlar
  </h2>
  {myActiveTasks.length > 0 && (
    <span className="baslig-say">{myActiveTasks.length}</span>
  )}
 <div className="baslig-search-wrapper">
  <FaSearch className="baslig-search-icon" />
  <input
    className="baslig-search"
    type="text"
    placeholder="Axtar..."
    value={activeSearch}
    onChange={(e) => setActiveSearch(e.target.value)}
  />
</div>
  <div className="baslig-toggle">
    <ThemeToggle />
  </div>
</div>

            <div className="content">

              {/* YALNIZ AKTİV TAPŞIRIQLAR SCROLL OLUR */}
              <div className="tasks-scroll">
                {activeTasksOpen && (myActiveTasks.length === 0 ? (
                  <p className="empty-message">Hələ tapşırıq yoxdur</p>
                ) : (
                  myActiveTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`task-item${checkingTaskId === task.id ? " checking" : ""}${task.tecili ? " tecili" : ""}`}
                      onDoubleClick={() => setSidePanelTask(task)}
                    >
                      <div className="task-header">
                        <div className="checkbox-wrapper" onClick={(e) => handleCheckboxClick(e, task)} onDoubleClick={(e) => e.stopPropagation()}>
                          {checkingTaskId === task.id ? (
                            <FaCheckCircle className="checkbox-icon checking-anim" />
                          ) : (
                            <FaRegCircle className={`checkbox-icon${task.verenLogin === currentUser.login ? " clickable-check" : ""}`} />
                          )}
                        </div>
                        <div className="task-main">
                          <span className="task-title">{task.tapsirigAdi}</span>
                          {task.secilmisShexsler.length > 0 && (
                            <div className="task-icracilar">
                              {task.secilmisShexsler.map((s) => (
                              <span key={s.login} className={`task-icraci-tag status-${(s as any).status || "gozlenir"}`}>
  {(s as any).nezaretci && <span className="nezaretci-n">N</span>}
  {s.adSoyad}
</span>
                            ))}
                            </div>
                          )}
                        </div>
                       <div className="task-header-right">
{task.yeniMesaj && (
  <FaComments className="task-yeni-mesaj-badge" />
)}
  {task.deadline && (
    <span className="task-deadline-badge">{task.deadline}</span>
  )}
                          <span
                            className={`task-star${task.tecili ? " aktiv" : ""}${task.verenLogin !== currentUser.login ? " disabled" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (task.verenLogin !== currentUser.login) return;
                              handleUpdateTask({ ...task, tecili: !task.tecili });
                            }}
                            onDoubleClick={(e) => e.stopPropagation()}
                          >
                            {task.tecili ? "★" : "☆"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )))
                )}
              {/* TAMAMLANMIŞ - SABİT QALIR */}
              {myCompletedTasks.length > 0 && (
                <div className="completed-section">
                  <div className="completed-toggle">
  <span className="completed-arrow" onClick={() => setCompletedOpen(!completedOpen)}>{completedOpen ? "▼" : "▶"}</span>
  <span onClick={() => setCompletedOpen(!completedOpen)}>Tamamlanmış</span>
  <span className="completed-badge">{myCompletedTasks.length}</span>
  <div className="baslig-search-wrapper" onClick={(e) => e.stopPropagation()}>
  <FaSearch className="baslig-search-icon" />
  <input
    className="baslig-search"
    type="text"
    placeholder="Axtar..."
    value={completedSearch}
    onChange={(e) => {
      setCompletedSearch(e.target.value);
      if (!completedOpen) setCompletedOpen(true);
    }}
  />
</div>
</div>
                  {completedOpen && (
                    <div className="completed-list">
                      {filteredCompletedTasks.map((task) => (
                        <div key={task.id} className="task-item completed" onDoubleClick={() => setSidePanelTask(task)}>
                          <div className="task-header">
                            <div
                              className="checkbox-wrapper"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (task.verenLogin !== currentUser.login) return;
                                const restored = { ...task, tamamlanib: false, tamamlanmaTarixi: undefined };
                                handleUpdateTask(restored);
                              }}
                              onDoubleClick={(e) => e.stopPropagation()}
                            >
                              <FaCheckCircle className="checkbox-icon done" />
                            </div>
                           <div className="task-main">
  <span className="task-title completed-title">{task.tapsirigAdi}</span>
  {task.secilmisShexsler.length > 0 && (
    <div className="task-icracilar">
      {task.secilmisShexsler.map((s) => (
        <span key={s.login} className={`task-icraci-tag status-${(s as any).status || "gozlenir"}`}>
          {(s as any).nezaretci && <span className="nezaretci-n">N</span>}
          {s.adSoyad}
        </span>
      ))}
    </div>
  )}
</div>
                            <div className="task-header-right">
                              {task.tamamlanmaTarixi && (
                                <span className="completed-date">{task.tamamlanmaTarixi}</span>
                              )}
                              <span className="task-star disabled">☆</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              </div>

              

            </div>

            <div className="footer">
              <div className="quick-add-row">
                <FaPlus className="quick-add-icon" />
                <input
                  type="text"
                  className="quick-add-input"
                  placeholder="Tapşırıq əlavə et..."
                  value={yeniTapsirig}
                  onChange={(e) => setYeniTapsirig(e.target.value)}
                  onKeyDown={handleQuickAddTask}
                />
              </div>
            </div>
          </section>
        )}

        {/* ŞƏXSİ QEYDLƏR */}
        {activePage === "notes" && (
          <section className="bolme">
            <div className="baslig-sira">
              <h2>Şəxsi qeydlərim</h2>
            </div>

            <div className="content notes-content">
              <div className="note-input-row">
                <FaCircle className="note-input-icon" />
                <input
                  type="text"
                  className="note-input"
                  placeholder="Yeni qeyd əlavə et..."
                  value={yeniQeyd}
                  onChange={(e) => setYeniQeyd(e.target.value)}
                  onKeyDown={handleAddNote}
                />
              </div>

              {activeNotes.map((note) => (
                <div
                  key={note.id}
                  className={`note-item${fadingNoteId === note.id ? " fading" : ""}`}
                  onClick={() => handleNoteClick(note)}
                >
                  <div className="note-check" onClick={(e) => handleToggleNote(e, note.id)}>
                    <FaRegCircle className="note-circle" />
                  </div>
                  <span className="note-metn">{note.metn}</span>
                  <div className="note-item-actions">
                    <FaTrash
                      className="note-delete-icon"
                      onClick={(e) => handleNoteDelete(e, note.id)}
                    />
                  </div>
                </div>
              ))}

              {/* TAMAMLANMIŞ QEYDLƏR */}
              {completedNotes.length > 0 && (
                <div className="completed-section">
                  <div className="completed-toggle" onClick={() => setIsCompletedNotesOpen(!isCompletedNotesOpen)}>
                    <span className="completed-arrow">{isCompletedNotesOpen ? "▼" : "▶"}</span>
                    <span>Tamamlanmış</span>
                    <span className="completed-badge">{completedNotes.length}</span>
                  </div>
                  {isCompletedNotesOpen && (
                    <div className="completed-list">
                      {completedNotes.map((note) => (
                        <div
                          key={note.id}
                          className="note-item completed"
                          onClick={() => handleNoteClick(note)}
                        >
                          <div className="note-check">
                            <FaCheckCircle className="note-circle done" />
                          </div>
                          <span className="note-metn completed-title">{note.metn}</span>
                          <div className="note-item-actions">
                            <FaTrash
                              className="note-delete-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNoteDelete(e, note.id);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="footer" />
          </section>
        )}

      </main>

      <ElanBildirisi currentUser={currentUser} />
      <ChatWidget currentUser={currentUser as any} hidden={!!sidePanelTask} />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        currentUser={currentUser}
        onSave={handleSaveTask}
      />

      {sidePanelTask && (
        <TaskSidePanel
          task={sidePanelTask}
          currentUser={currentUser as any}
          onClose={() => setSidePanelTask(null)}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
        />
      )}

      <NoteDetailModal
        isOpen={isNoteDetailOpen}
        onClose={() => { setIsNoteDetailOpen(false); setSelectedNote(null); }}
        note={selectedNote}
        onSave={handleNoteSave}
      />
    </div>
  );
}

export default Dashboard;