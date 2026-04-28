import { useState, useEffect } from "react";
import {
  FaPlus, FaRegCircle, FaCheckCircle, FaTrash, FaCircle,
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
import ChatWidget from '../shared/ChatWidget'
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

const getAllTasks = (): NewTask[] => {
  try {
    const data = localStorage.getItem("tasks");
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

const saveAllTasks = (tasks: NewTask[]) => {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

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

  const loadMyTasks = () => {
    const all = getAllTasks();
    const mine = all.filter(task => {
      const meneQoyulan = task.secilmisShexsler.some(s => s.login === currentUser.login);
      const menimQoydugum = task.verenLogin === currentUser.login;
      return meneQoyulan || menimQoydugum;
    });
    setMyTasks(mine);
  };

  useEffect(() => {
    loadMyTasks();
    const notesData = localStorage.getItem(`notes_${currentUser.login}`);
    if (notesData) setNotes(JSON.parse(notesData));
  }, [currentUser.login]);

  const handleQuickAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      const all = getAllTasks();
      saveAllTasks([...all, newTask]);
      setMyTasks(prev => [...prev, newTask]);
      addLog("tapsirig_yarat", currentUser.adSoyad, currentUser.login, `"${newTask.tapsirigAdi}" tapşırığını yaratdı`);
      setYeniTapsirig("");
    }
  };

  const handleSaveTask = (task: NewTask) => {
    const all = getAllTasks();
    saveAllTasks([...all, task]);
    setMyTasks(prev => [...prev, task]);
    addLog("tapsirig_yarat", currentUser.adSoyad, currentUser.login, `"${task.tapsirigAdi}" tapşırığını yaratdı`);
  };

  const handleUpdateTask = (updatedTask: NewTask) => {
    const all = getAllTasks();
    saveAllTasks(all.map(t => t.id === updatedTask.id ? updatedTask : t));
    setMyTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSidePanelTask(updatedTask);
  };

  const handleDeleteTask = (taskId: string) => {
    const all = getAllTasks();
    saveAllTasks(all.filter(t => t.id !== taskId));
    setMyTasks(prev => prev.filter(t => t.id !== taskId));
    addLog("tapsirig_sil", currentUser.adSoyad, currentUser.login, "Tapşırıq silindi");
  };

  const handleCheckboxClick = (e: React.MouseEvent, task: NewTask) => {
    e.stopPropagation();
    if (task.verenLogin !== currentUser.login) return;
    if (task.tamamlanib) return;
    setCheckingTaskId(task.id);
    setTimeout(() => {
      const updatedTask = { ...task, tamamlanib: true, tamamlanmaTarixi: new Date().toLocaleDateString("az-AZ") };
      handleUpdateTask(updatedTask);
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
      const updatedNotes = notes.map((n) => n.id === id ? { ...n, tamamlanib: true } : n);
      setNotes(updatedNotes);
      localStorage.setItem(`notes_${currentUser.login}`, JSON.stringify(updatedNotes));
      setFadingNoteId(null);
    }, 500);
  };

  const handleRestoreNote = (id: string) => {
    const updatedNotes = notes.map((n) => n.id === id ? { ...n, tamamlanib: false } : n);
    setNotes(updatedNotes);
    localStorage.setItem(`notes_${currentUser.login}`, JSON.stringify(updatedNotes));
  };

  const handleAddNote = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && yeniQeyd.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        metn: yeniQeyd.trim(),
        notlar: "",
        tamamlanib: false,
        yaranmaTarixi: new Date().toLocaleString("az-AZ"),
      };
      const updatedNotes = [newNote, ...notes];
      setNotes(updatedNotes);
      localStorage.setItem(`notes_${currentUser.login}`, JSON.stringify(updatedNotes));
      setYeniQeyd("");
    }
  };

  const handleNoteSave = (updatedNote: Note) => {
    const updatedNotes = notes.map((n) => n.id === updatedNote.id ? updatedNote : n);
    setNotes(updatedNotes);
    localStorage.setItem(`notes_${currentUser.login}`, JSON.stringify(updatedNotes));
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setIsNoteDetailOpen(true);
  };

  const handleNoteDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedNotes = notes.filter((n) => n.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem(`notes_${currentUser.login}`, JSON.stringify(updatedNotes));
  };

  const myActiveTasks = myTasks
    .filter(task => !task.tamamlanib)
    .sort((a, b) => {
      if (a.tecili && !b.tecili) return -1;
      if (!a.tecili && b.tecili) return 1;
      return Number(b.id) - Number(a.id);
    });

  const myCompletedTasks = myTasks.filter(task => task.tamamlanib);
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
              <h2>Ümumi tapşırıqlar</h2>
              {myActiveTasks.length > 0 && (
                <span className="baslig-say">{myActiveTasks.length}</span>
              )}
              <div className="baslig-toggle">
                <ThemeToggle />
              </div>
            </div>

            <div className="content">
              {myActiveTasks.length === 0 ? (
                <p className="empty-message">Hələ tapşırıq yoxdur</p>
              ) : (
                myActiveTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`task-item${checkingTaskId === task.id ? " checking" : ""}${task.tecili ? " tecili" : ""}`}
                    onClick={() => setSidePanelTask(task)}
                  >
                    <div className="task-header">
                      <div className="checkbox-wrapper" onClick={(e) => handleCheckboxClick(e, task)}>
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
                                {s.adSoyad}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="task-header-right">
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
                        >
                          {task.tecili ? "★" : "☆"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* TAMAMLANMIŞ */}
              {myCompletedTasks.length > 0 && (
                <div className="completed-section">
                  <div className="completed-toggle" onClick={() => setCompletedOpen(!completedOpen)}>
                    <span className="completed-arrow">{completedOpen ? "▼" : "▶"}</span>
                    <span>Tamamlanmış</span>
                    <span className="completed-badge">{myCompletedTasks.length}</span>
                  </div>
                  {completedOpen && (
                    <div className="completed-list">
                      {myCompletedTasks.map((task) => (
                        <div key={task.id} className="task-item completed" onClick={() => setSidePanelTask(task)}>
                          <div className="task-header">
                            <div className="checkbox-wrapper">
                              <FaRegCircle className="checkbox-icon done" />
                            </div>
                            <div className="task-main">
                              <span className="task-title completed-title">{task.tapsirigAdi}</span>
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

            <div className="footer">
            </div>
          </section>
        )}

      </main>

      <ElanBildirisi currentUser={currentUser} />

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