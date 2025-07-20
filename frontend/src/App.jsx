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

  const updateSelectedNoteIndex = (index) => {
    setSelectedNoteIndex(index);
    selectedNoteIndexRef.current = index;
  };

  const updateNoteState = (index, updates) => {
    setNotes((prevNotes) => {
      const newNotes = [...prevNotes];
      newNotes[index] = {
        ...newNotes[index],
        ...updates,
        last_updated: new Date().toISOString(),
      };
      return newNotes;
    });
  };

  const handleBulletLogic = (e, input) => {
    const { selectionStart: cursorPos, value } = input;

    if (e.key === " ") {
      const textBeforeCursor = value.slice(0, cursorPos);
      const isLineStart =
        textBeforeCursor.length === 1 ||
        textBeforeCursor.charAt(textBeforeCursor.length - 2) === "\n";

      if (textBeforeCursor.endsWith("*") && isLineStart) {
        e.preventDefault();
        const newValue =
          value.slice(0, cursorPos - 1) + "◆ " + value.slice(cursorPos);
        input.value = newValue;
        input.setSelectionRange(cursorPos + 1, cursorPos + 1);
        updateNoteState(selectedNoteIndex, { content: newValue });
        UpdateNoteContent(selectedNoteIndex, newValue);
      }
    }

    if (e.key === "Enter") {
      const lines = value.slice(0, cursorPos).split("\n");
      const currentLine = lines[lines.length - 1];
      const trimmedLine = currentLine.trimStart();

      if (trimmedLine.startsWith("◆ ")) {
        e.preventDefault();

        if (trimmedLine === "◆ " || trimmedLine === "◆") {
          // Remove bullet and stay on current line
          const beforeBullet = value.slice(0, cursorPos - currentLine.length);
          const afterCursor = value.slice(cursorPos);
          const indent = currentLine.match(/^\s*/)[0];
          const newValue = beforeBullet + indent + afterCursor;

          input.value = newValue;
          const newCursorPos = cursorPos - (currentLine.length - indent.length);
          input.setSelectionRange(newCursorPos, newCursorPos);
        } else {
          // Add new bullet point
          const indent = currentLine.match(/^\s*/)[0];
          const newValue =
            value.slice(0, cursorPos) +
            "\n" +
            indent +
            "◆ " +
            value.slice(cursorPos);

          input.value = newValue;
          const newCursorPos = cursorPos + 1 + indent.length + 2;
          input.setSelectionRange(newCursorPos, newCursorPos);
        }

        updateNoteState(selectedNoteIndex, { content: input.value });
        UpdateNoteContent(selectedNoteIndex, input.value);
      }
    }
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const minWidth = 128;
      const maxWidth = 320;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
      document.documentElement.style.setProperty(
        "--sidebar-width",
        `${newWidth}px`
      );
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.userAgent.includes("Mac");
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlOrCmd && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleCreate();
      }

      if (ctrlOrCmd && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setShowEmoji((prev) => !prev);
      }

      if (
        ctrlOrCmd &&
        (e.key === "Backspace" || e.key === "Delete") &&
        selectedNoteIndex !== null
      ) {
        e.preventDefault();
        setShowModal(true);
      }

      if (activeInputRef.current?.dataset.fieldType === "content") {
        handleBulletLogic(e, activeInputRef.current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNoteIndex]);

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

  const handleCreate = async () => {
    await CreateNote("", "");
    const updatedNotes = await GetNotes();
    setNotes(updatedNotes);
    updateSelectedNoteIndex(updatedNotes.length - 1);
  };

  const formatTime = (timeString) => {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return "Invalid date";

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

    const newIndex =
      selectedNoteIndex >= notes.length - 1 ? notes.length - 2 : null;
    updateSelectedNoteIndex(newIndex);
    setShowModal(false);
  };

  const handleDeleteClick = (e, index) => {
    e.stopPropagation();
    updateSelectedNoteIndex(index);
    setShowModal(true);
  };

  const handleEmojiClick = (emoji) => {
    if (selectedNoteIndexRef.current === null || !activeInputRef.current)
      return;

    const activeInput = activeInputRef.current;
    const selectionStart = activeInput.selectionStart;
    const selectionEnd = activeInput.selectionEnd;
    const currentValue = activeInput.value;

    // Insert emoji, replacing selected text if any
    const newValue =
      currentValue.slice(0, selectionStart) +
      emoji.emoji +
      currentValue.slice(selectionEnd);
    activeInput.value = newValue;

    // Update cursor position to be after the inserted emoji
    const newCursorPos = selectionStart + emoji.emoji.length;
    activeInput.selectionStart = newCursorPos;
    activeInput.selectionEnd = newCursorPos;

    // Update React state based on which field is active
    if (activeInput.dataset.fieldType === "title") {
      UpdateNoteTitle(selectedNoteIndexRef.current, newValue);
      setNotes((prevNotes) =>
        prevNotes.map((note, index) =>
          index === selectedNoteIndexRef.current
            ? {
                ...note,
                title: newValue,
                last_updated: new Date().toISOString(),
              }
            : note
        )
      );
    } else if (activeInput.dataset.fieldType === "content") {
      UpdateNoteContent(selectedNoteIndexRef.current, newValue);
      setNotes((prevNotes) =>
        prevNotes.map((note, index) =>
          index === selectedNoteIndexRef.current
            ? {
                ...note,
                content: newValue,
                last_updated: new Date().toISOString(),
              }
            : note
        )
      );
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
                  width="100%"
                  skinTonesDisabled
                  previewConfig={{ showPreview: false }}
                  onEmojiClick={handleEmojiClick}
                  lazyLoadEmojis
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
                    const value = e.target.value;
                    UpdateNoteTitle(selectedNoteIndex, value);
                    updateNoteState(selectedNoteIndex, { title: value });
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
                    const value = e.target.value;
                    UpdateNoteContent(selectedNoteIndex, value);
                    updateNoteState(selectedNoteIndex, { content: value });
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
