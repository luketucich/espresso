import { Coffee, NotebookPen, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CreateNote,
  DeleteNote,
  GetNotes,
  UpdateNoteContent,
  UpdateNoteTitle,
} from "../wailsjs/go/main/App";
import "./App.css";

function App() {
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState([]);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Create note with Ctrl/Cmd + N
      if (ctrlOrCmd && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleCreate();
      }

      // Delete note with Ctrl/Cmd + Backspace
      if (
        ctrlOrCmd &&
        (e.key === "Backspace" || e.key === "Delete") &&
        selectedNoteIndex !== null
      ) {
        e.preventDefault();
        setShowModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [notes, selectedNoteIndex]);

  useEffect(() => {
    async function fetchNotes() {
      try {
        const data = await GetNotes();
        setNotes(data);
        if (data.length > 0 && selectedNoteIndex === null) {
          setSelectedNoteIndex(0);
        }
      } catch (err) {
        console.error("Error fetching notes:", err);
      }
    }

    fetchNotes();
  }, []);

  const handleCreate = async () => {
    await CreateNote("", "");
    const updatedNotes = await GetNotes();
    setNotes(updatedNotes);
    setSelectedNoteIndex(updatedNotes.length - 1);
  };

  const selectedNote = notes[selectedNoteIndex] || null;

  const formatTime = (timeString) => {
    const date = new Date(timeString);

    if (isNaN(date.getTime())) {
      console.error("Invalid time format:", timeString);
      return "Invalid date";
    }

    return date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });
  };

  return (
    <>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <p>Are you sure you want to delete this note?</p>
            <div className="modal-buttons">
              <button
                onClick={() => {
                  DeleteNote(selectedNoteIndex);
                  setNotes((prevNotes) =>
                    prevNotes.filter((_, index) => index !== selectedNoteIndex)
                  );

                  if (selectedNoteIndex >= notes.length - 1) {
                    setSelectedNoteIndex(notes.length - 2);
                  } else {
                    setSelectedNoteIndex(null);
                  }

                  setShowModal(false);
                }}
              >
                Yup!
              </button>
              <button onClick={() => setShowModal(false)}>
                Wait, nevermind.
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="app">
        <aside className="sidebar">
          <h2 className="sidebar__title">
            <Coffee className="logo" strokeWidth={2.25} />
            <span className="sidebar__title-text">espresso</span>
          </h2>
          <button className="sidebar__new-button" onClick={handleCreate}>
            <span className="sidebar__new-button-text">New</span>
            <NotebookPen className="icon" />
          </button>
          <ul className="note-list">
            {notes.map((note, index) => (
              <li
                key={index}
                className={`note-list__item ${
                  index === selectedNoteIndex ? "note-list__item--active" : ""
                }`}
                onClick={() => setSelectedNoteIndex(index)}
              >
                <span className="note-list__title">
                  {note.title || "Untitled"}
                </span>
                <Trash2
                  className="icon icon--delete"
                  onClick={(index) => {
                    setSelectedNoteIndex(index);
                    setShowModal(true);
                  }}
                />
              </li>
            ))}
          </ul>
        </aside>

        <main className="note-editor">
          {selectedNote ? (
            <>
              <header className="note-editor__header">
                <input
                  className="note-editor__title"
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) => {
                    UpdateNoteTitle(selectedNoteIndex, e.target.value);
                    const updatedNotes = notes.map((note, index) =>
                      index === selectedNoteIndex
                        ? {
                            ...note,
                            title: e.target.value,
                            last_updated: new Date().toISOString(),
                          }
                        : note
                    );
                    setNotes(updatedNotes);
                  }}
                  placeholder="Untitled"
                />
                <p className="note-editor__date">
                  Last Updated {formatTime(selectedNote.last_updated)}
                </p>
              </header>
              <textarea
                className="note-editor__content"
                placeholder="Type here to begin..."
                value={selectedNote.content}
                onChange={(e) => {
                  UpdateNoteContent(selectedNoteIndex, e.target.value);
                  const updatedNotes = notes.map((note, index) =>
                    index === selectedNoteIndex
                      ? {
                          ...note,
                          content: e.target.value,
                          last_updated: new Date().toISOString(),
                        }
                      : note
                  );
                  setNotes(updatedNotes);
                }}
              ></textarea>
            </>
          ) : (
            <div style={{ textAlign: "center", color: "#666" }}>
              <p
                className="note-editor__placeholder"
                style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}
              >
                Welcome to espresso!
              </p>
              <p
                className="note-editor__placeholder"
                style={{ fontSize: "1rem" }}
              >
                Press{" "}
                <span className="shortcut" style={{ fontWeight: "bold" }}>
                  Ctrl/Cmd + N
                </span>{" "}
                to create a new note
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default App;
