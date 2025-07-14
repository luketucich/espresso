import { useEffect, useState } from "react";
import { CreateNote, GetNotes } from "../wailsjs/go/main/App";
import "./App.css"; // Import the CSS

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
    await CreateNote("Untitled", "Empty note");
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
            <h2 className="note-title">{selectedNote.title}</h2>
            <p className="note-content">{selectedNote.content}</p>
          </>
        ) : (
          <p className="placeholder">Create a note to begin</p>
        )}
      </div>
    </div>
  );
}

export default App;
