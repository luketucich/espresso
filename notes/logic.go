package notes

import "time"

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