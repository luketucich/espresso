package notes

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

func CreateNote(notes []Note, title, body string) []Note {
	newNote := Note{
		Title:       title,
		Content:     body,
		LastUpdated: time.Now(),
	}

	return append(notes, newNote)
}

func DeleteNote(notes []Note, index int) []Note {
	if index < 0 || index >= len(notes) {
		return notes
	}

	return append(notes[:index], notes[index+1:]...)
}

func UpdateNoteContent(notes []Note, index int, newBody string) []Note {
	if index < 0 || index >= len(notes) {
		return notes
	}

	notes[index].Content = newBody
	notes[index].LastUpdated = time.Now()

	return notes
}

func UpdateNoteTitle(notes []Note, index int, newTitle string) []Note {
	if index < 0 || index >= len(notes) {
		return notes
	}

	notes[index].Title = newTitle
	notes[index].LastUpdated = time.Now()

	return notes
}

func LoadNotesFromFile() []Note {
	notesFilePath := filepath.Join("notes", "notes.json")

	file, err := os.Open(notesFilePath)
	if err != nil {
		// File doesn't exist or can't be opened; return empty notes
		return []Note{}
	}
	defer file.Close()

	var notes []Note
	if err := json.NewDecoder(file).Decode(&notes); err != nil {
		// Failed to decode JSON; return empty notes
		return []Note{}
	}

	return notes
}

func SaveNotesToFile(notes []Note) {
	notesFilePath := filepath.Join("notes", "notes.json")

	file, err := os.Create(notesFilePath)
	if err != nil {
		// Could not create/write to file
		fmt.Println("Error saving notes:", err)
		return
	}
	defer file.Close()

encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")

if err := encoder.Encode(notes); err != nil {
		// Failed to encode notes to JSON
		fmt.Println("Error encoding notes:", err)
	}
}