import { useEffect, useState } from "react";
import {
  CreateNote,
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

  return (
    <div className="wrapper">
      <div className="sidebar">
        <h2 className="sidebar-title">matcha</h2>
        <button className="new-button" onClick={handleCreate}>
          ➕ New
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
              {note.title || "Untitled"}
            </li>
          ))}
        </ul>
      </div>

      <div className="main">
        {selectedNote ? (
          <>
            <input
              className="note-title"
              type="text"
              value={selectedNote.title}
              onChange={(e) => {
                UpdateNoteTitle(selectedNote.id, e.target.value);
                const updatedNotes = notes.map((note, index) =>
                  index === selectedNoteIndex
                    ? { ...note, title: e.target.value }
                    : note
                );
                setNotes(updatedNotes);
              }}
              placeholder="Untitled"
            ></input>
            <textarea
              className="note-content"
              placeholder="Write your note here..."
              value={selectedNote.content}
              onChange={(e) => {
                UpdateNoteContent(selectedNote.id, e.target.value);
                const updatedNotes = notes.map((note, index) =>
                  index === selectedNoteIndex
                    ? { ...note, content: e.target.value }
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
