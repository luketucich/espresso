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
  const [notes, setNotes] = useState([]);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState(null);

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
    <div className="app">
      <aside className="sidebar">
        <h2 className="sidebar__title">
          <Coffee className="logo" strokeWidth={2} />
          <span className="sidebar__title-text">Espresso</span>
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
                onClick={(e) => {
                  e.stopPropagation();
                  DeleteNote(note.id).then(() => {
                    const updatedNotes = notes.filter((_, i) => i !== index);
                    setNotes(updatedNotes);
                    if (selectedNoteIndex === index) {
                      setSelectedNoteIndex(null);
                    } else if (selectedNoteIndex > index) {
                      setSelectedNoteIndex(selectedNoteIndex - 1);
                    }
                  });
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
                  UpdateNoteTitle(selectedNote.id, e.target.value);
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
                UpdateNoteContent(selectedNote.id, e.target.value);
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
          <p className="note-editor__placeholder">Create a note to begin</p>
        )}
      </main>
    </div>
  );
}

export default App;
