import EmojiPicker from "emoji-picker-react";
import { NotebookPen, SmilePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  CreateNote,
  DeleteNote,
  GetNotes,
  UpdateNoteContent,
  UpdateNoteTitle,
} from "../wailsjs/go/main/App";
import "./App.css";

function App() {
  const [showEmoji, setShowEmoji] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState([]);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState(null);
  const selectedNoteIndexRef = useRef(null);
  const activeInputRef = useRef(null);

  // Handle sidebar resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const minWidth = 16 * 8; // 8rem in pixels
      const maxWidth = 16 * 20; // 16rem in pixels

      if (e.clientX < minWidth || e.clientX > maxWidth) return;

      const newWidth = e.clientX;
      document.documentElement.style.setProperty(
        "--sidebar-width",
        `${newWidth}px`
      );
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.userAgent.indexOf("Mac") !== -1;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Create note with Ctrl/Cmd + N
      if (ctrlOrCmd && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleCreate();
      }

      // Show/hide emoji menu with Ctrl/Cmd + E
      if (ctrlOrCmd && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setShowEmoji((prev) => !prev);
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

  // Fetch notes on initial load
  useEffect(() => {
    async function fetchNotes() {
      try {
        const data = await GetNotes();
        setNotes(data);
        if (data.length > 0 && selectedNoteIndex === null) {
          updateSelectedNoteIndex(0);
        }
      } catch (err) {
        console.error("Error fetching notes:", err);
      }
    }

    fetchNotes();
  }, []);

  const updateSelectedNoteIndex = (index) => {
    setSelectedNoteIndex(index);
    selectedNoteIndexRef.current = index;
  };

  const handleCreate = async () => {
    await CreateNote("", "");
    const updatedNotes = await GetNotes();
    setNotes(updatedNotes);
    updateSelectedNoteIndex(updatedNotes.length - 1);
  };

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

  const handleDeleteNote = () => {
    DeleteNote(selectedNoteIndex);
    setNotes((prevNotes) =>
      prevNotes.filter((_, index) => index !== selectedNoteIndex)
    );

    if (selectedNoteIndex >= notes.length - 1) {
      updateSelectedNoteIndex(notes.length - 2);
    } else {
      updateSelectedNoteIndex(null);
    }

    setShowModal(false);
  };

  const handleDeleteClick = (e, index) => {
    e.stopPropagation();
    updateSelectedNoteIndex(index);
    setShowModal(true);
  };

  const handleEmojiClick = (emoji) => {
    // Use ref for the current selected note index
    const currentNoteIndex = selectedNoteIndexRef.current;

    // Only proceed if we have a selected note and active input
    if (currentNoteIndex === null || !activeInputRef.current) return;

    const activeInput = activeInputRef.current;
    const fieldType = activeInput.dataset.fieldType;

    if (fieldType === "title") {
      setNotes((prevNotes) => {
        const newNotes = [...prevNotes];
        const updatedTitle = newNotes[currentNoteIndex].title + emoji.emoji;
        newNotes[currentNoteIndex] = {
          ...newNotes[currentNoteIndex],
          title: updatedTitle,
          last_updated: new Date().toISOString(),
        };
        UpdateNoteTitle(currentNoteIndex, updatedTitle);
        return newNotes;
      });
    } else if (fieldType === "content") {
      setNotes((prevNotes) => {
        const newNotes = [...prevNotes];
        const updatedContent = newNotes[currentNoteIndex].content + emoji.emoji;
        newNotes[currentNoteIndex] = {
          ...newNotes[currentNoteIndex],
          content: updatedContent,
          last_updated: new Date().toISOString(),
        };
        UpdateNoteContent(currentNoteIndex, updatedContent);
        return newNotes;
      });
    }
  };

  const selectedNote = notes[selectedNoteIndex] || null;

  return (
    <>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <p className="modal__text">
              Are you sure you want to delete this note?
            </p>
            <div className="modal__buttons">
              <button
                className="modal__button modal__button--confirm"
                onClick={handleDeleteNote}
              >
                Yup!
              </button>
              <button
                className="modal__button modal__button--cancel"
                onClick={() => setShowModal(false)}
              >
                Wait, never mind.
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="app">
        <aside className={`sidebar ${showEmoji ? "sidebar--emoji-open" : ""}`}>
          <header className="sidebar__header">
            <h2
              className="sidebar__title"
              onClick={() => updateSelectedNoteIndex(null)}
            >
              <span className="sidebar__title-text">espresso</span>
            </h2>
            <button
              className="sidebar__button sidebar__button--new"
              onClick={handleCreate}
            >
              <span className="sidebar__button-text">New</span>
              <NotebookPen className="sidebar__button-icon" />
            </button>
          </header>

          <nav className="sidebar__nav">
            <ul className="note-list">
              {notes.map((note, index) => (
                <li
                  key={index}
                  className={`note-list__item ${
                    index === selectedNoteIndex ? "note-list__item--active" : ""
                  }`}
                  onClick={() => updateSelectedNoteIndex(index)}
                >
                  <span className="note-list__title">
                    {note.title || "Untitled"}
                  </span>
                  <button
                    className="note-list__delete-button"
                    onClick={(e) => handleDeleteClick(e, index)}
                  >
                    <Trash2 className="note-list__delete-icon" />
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <footer className="sidebar__footer">
            {showEmoji && (
              <div className="sidebar__emoji-picker">
                <EmojiPicker
                  onMouseDown={(e) => e.preventDefault()}
                  width={"100%"}
                  skinTonesDisabled
                  previewConfig={{ showPreview: false }}
                  onEmojiClick={handleEmojiClick}
                />
              </div>
            )}
            <button
              className="sidebar__button sidebar__button--emoji"
              onClick={() => setShowEmoji((prev) => !prev)}
            >
              <SmilePlus className="sidebar__button-icon" />
            </button>
          </footer>

          <div
            className="sidebar__resizer"
            onMouseDown={() => setIsResizing(true)}
          />
        </aside>

        <main className="editor">
          {selectedNote ? (
            <>
              <header className="editor__header">
                <input
                  className="editor__title"
                  type="text"
                  value={selectedNote.title}
                  data-field-type="title"
                  onFocus={(e) => {
                    activeInputRef.current = e.target;
                  }}
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
                <p className="editor__date">
                  Last Updated {formatTime(selectedNote.last_updated)}
                </p>
              </header>

              <div className="editor__content-wrapper">
                <textarea
                  className="editor__content"
                  placeholder="Type here to begin..."
                  value={selectedNote.content}
                  data-field-type="content"
                  onFocus={(e) => {
                    activeInputRef.current = e.target;
                  }}
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
                />
              </div>
            </>
          ) : (
            <div className="editor__empty-state">
              <p className="editor__empty-text">
                Start by creating a new note or selecting an existing one.
              </p>
              <p className="editor__empty-text">
                You can also use shortcuts to help you speed up your workflow.
              </p>
              <p className="editor__empty-text">
                Press <span className="editor__shortcut">Ctrl/Cmd + N</span> to
                create a new note
              </p>
              <p className="editor__empty-text">
                Press{" "}
                <span className="editor__shortcut">Ctrl/Cmd + Backspace</span>{" "}
                to delete a note
              </p>
              <p className="editor__empty-text">
                Press <span className="editor__shortcut">Ctrl/Cmd + E</span> to
                toggle emoji picker
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default App;
