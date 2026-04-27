import { useState, useEffect } from "react";
import {
  FaPlus,
  FaInfoCircle,
  FaRegCircle,
  FaCheckCircle,
  FaTrash,
  FaCircle,
} from "react-icons/fa";
import Sidebar from "../Sidebar/Sidebar";
import TaskModal from "../TaskModal/TaskModal";
import type { NewTask } from "../TaskModal/TaskModal";
import TaskSidePanel from "../shared/TaskSidePanel";
import CompletedNotesModal from "../CompletedModal/CompletedNotesModal";
import NoteDetailModal from "../TaskDetailModal/NoteDetailModal";
import ElanBildirisi from "./ElanBildirisi";
import { addLog } from "../shared/logHelper";
import "./Dashboard.css";

interface User {
  login: string;
  parol: string;
  rol: string;
  adSoyad: string;
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
  const [tasks, setTasks] = useState<NewTask[]>([]);
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

  useEffect(() => {
    const data = localStorage.getItem("tasks");
    if (data) setTasks(JSON.parse(data));
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
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      localStorage.setItem("tasks", JSON.stringify(updatedTasks));
      addLog("tapsirig_yarat", currentUser.adSoyad, currentUser.login, `"${newTask.tapsirigAdi}" tapşırığını yaratdı`);
      setYeniTapsirig("");
    }
  };

  const handleSaveTask = (task: NewTask) => {
    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    addLog("tapsirig_yarat", currentUser.adSoyad, currentUser.login, `"${task.tapsirigAdi}" tapşırığını yaratdı`);
  };

  const handleUpdateTask = (updatedTask: NewTask) => {
    const updatedTasks = tasks.map((t) => t.id === updatedTask.id ? updatedTask : t);
    setTasks(updatedTasks);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    setSidePanelTask(updatedTask);
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(updatedTasks);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    addLog("tapsirig_sil", currentUser.adSoyad, currentUser.login, "Tapşırıq silindi");
  };

  const handleCheckboxClick = (e: React.MouseEvent, task: NewTask) => {
    e.stopPropagation();
    if (task.verenLogin !== currentUser.login) return;
    if (task.tamamlanib) return;
    setCheckingTaskId(task.id);
    setTimeout(() => {
      const updatedTasks = tasks.map((t) => {
        if (t.id === task.id) {
          return { ...t, tamamlanib: true, tamamlanmaTarixi: new Date().toLocaleDateString("az-AZ") };
        }
        return t;
      });
      setTasks(updatedTasks);
      localStorage.setItem("tasks", JSON.stringify(updatedTasks));
      addLog("tapsirig_tamamla", currentUser.adSoyad, currentUser.login, `"${task.tapsirigAdi}" tapşırığını tamamladı`);
      setCheckingTaskId(null);
    }, 800);
  };

  const handleToggleNote = (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    if (!note.tamamlanib) {
      setFadingNoteId(id);
      setTimeout(() => {
        const updatedNotes = notes.map((n) => n.id === id ? { ...n, tamamlanib: true } : n);
        setNotes(updatedNotes);
        localStorage.setItem(`notes_${currentUser.login}`, JSON.stringify(updatedNotes));
        setFadingNoteId(null);
      }, 500);
    }
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

  const myActiveTasks = tasks
    .filter((task) => {
      const meneQoyulan = task.secilmisShexsler.some((s) => s.login === currentUser.login);
      const menimQoydugum = task.verenLogin === currentUser.login;
      return (meneQoyulan || menimQoydugum) && !task.tamamlanib;
    })
    .sort((a, b) => {
      if (a.tecili && !b.tecili) return -1;
      if (!a.tecili && b.tecili) return 1;
      return Number(b.id) - Number(a.id);
    });

  const myCompletedTasks = tasks.filter((task) => {
    const meneQoyulan = task.secilmisShexsler.some((s) => s.login === currentUser.login);
    const menimQoydugum = task.verenLogin === currentUser.login;
    return (meneQoyulan || menimQoydugum) && task.tamamlanib;
  });

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
            </div>

            <div className="content">

              {/* AKTİV TAPŞIRIQLAR */}
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
                      <div
                        className="checkbox-wrapper"
                        onClick={(e) => handleCheckboxClick(e, task)}
                      >
                        {checkingTaskId === task.id ? (
                          <FaCheckCircle className="checkbox-icon checking-anim" />
                        ) : (
                          <FaRegCircle
                            className={`checkbox-icon${task.verenLogin === currentUser.login ? " clickable-check" : ""}`}
                          />
                        )}
                      </div>

                      <div className="task-main">
                        <span className="task-title">{task.tapsirigAdi}</span>
                        {task.secilmisShexsler.length > 0 && (
                          <div className="task-icracilar">
                            {task.secilmisShexsler.map((s) => (
                              <span
                                key={s.login}
                                className={`task-icraci-tag status-${s.status || "gozlenir"}`}
                              >
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
                            const updated = tasks.map((t) =>
                              t.id === task.id ? { ...t, tecili: !t.tecili } : t
                            );
                            setTasks(updated);
                            localStorage.setItem("tasks", JSON.stringify(updated));
                          }}
                        >
                          {task.tecili ? "★" : "☆"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* TAMAMLANMIŞ BÖLMƏ */}
              {myCompletedTasks.length > 0 && (
                <div className="completed-section">
                  <div
                    className="completed-toggle"
                    onClick={() => setCompletedOpen(!completedOpen)}
                  >
                    <span className="completed-arrow">{completedOpen ? "▼" : "▶"}</span>
                    <span>Tamamlanmış</span>
                    <span className="completed-badge">{myCompletedTasks.length}</span>
                  </div>
                  {completedOpen && (
                    <div className="completed-list">
                      {myCompletedTasks.map((task) => (
                        <div
                          key={task.id}
                          className="task-item completed"
                          onClick={() => setSidePanelTask(task)}
                        >
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

            {/* FOOTER */}
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
                >
                  <div className="note-check" onClick={() => handleToggleNote(note.id)}>
                    <FaRegCircle className="note-circle" />
                  </div>
                  <span className="note-metn">{note.metn}</span>
                  <div className="note-item-actions">
                    <FaInfoCircle
                      className="note-info-icon"
                      onClick={() => {
                        setSelectedNote(note);
                        setIsNoteDetailOpen(true);
                      }}
                    />
                    <FaTrash
                      className="note-delete-icon"
                      onClick={() => {
                        const updatedNotes = notes.filter((n) => n.id !== note.id);
                        setNotes(updatedNotes);
                        localStorage.setItem(`notes_${currentUser.login}`, JSON.stringify(updatedNotes));
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="footer">
              <button className="tamamlanmis-btn" onClick={() => setIsCompletedNotesOpen(true)}>
                tamamlanmış qeydlər
                {completedNotes.length > 0 && (
                  <span className="completed-count">{completedNotes.length}</span>
                )}
              </button>
            </div>
          </section>
        )}

      </main>

      <ElanBildirisi currentUser={currentUser} />

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

      <CompletedNotesModal
        isOpen={isCompletedNotesOpen}
        onClose={() => setIsCompletedNotesOpen(false)}
        notes={completedNotes}
        onRestore={handleRestoreNote}
      />

      <NoteDetailModal
        isOpen={isNoteDetailOpen}
        onClose={() => {
          setIsNoteDetailOpen(false);
          setSelectedNote(null);
        }}
        note={selectedNote}
        onSave={handleNoteSave}
      />
    </div>
  );
}

export default Dashboard;