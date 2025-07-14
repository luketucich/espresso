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
    <div className="wrapper">
      <div className="sidebar">
        <h2 className="sidebar-title">
          <Coffee className="logo" strokeWidth={2} />
          <span className="title-text">Espresso</span>
        </h2>
        <button className="new-button" onClick={handleCreate}>
          <span className="new-button-text">New</span>
          <NotebookPen className="icon" />
        </button>
        <ul className="note-list">
          {notes.map((note, index) => (
            <li
              key={index}
              className={`note-list-item ${
                index === selectedNoteIndex ? "active" : ""
              }`}
              onClick={() => setSelectedNoteIndex(index)}
            >
              <span className="note-list-title">
                {note.title || "Untitled"}
              </span>
              <Trash2
                className="icon delete-icon"
                onClick={(e) =>
                  DeleteNote(note.id).then(() => {
                    const updatedNotes = notes.filter((_, i) => i !== index);
                    setNotes(updatedNotes);
                  })
                }
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="main">
        {selectedNote ? (
          <>
            <div className="note-header">
              <input
                className="note-title"
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
              ></input>
              <p className="note-date">
                Last Updated {formatTime(selectedNote.last_updated)}
              </p>
            </div>
            <textarea
              className="note-content"
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
          <p className="placeholder">Create a note to begin</p>
        )}
      </div>
    </div>
  );
}

export default App;
