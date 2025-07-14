package main

import (
	"context"
	"espresso/notes"
)

// App struct
type App struct {
	ctx context.Context
	Notes []notes.Note
}

// NewApp creates a new App application struct
func NewApp() *App {
  return &App{
        Notes: []notes.Note{}, // initialize as empty slice — no longer nil
    }
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Functions to perform CRUD operations on notes
func (a *App) CreateNote(title, content string) {
	a.Notes = notes.CreateNote(a.Notes, title, content)
}

func (a *App) DeleteNote(index int){
	a.Notes = notes.DeleteNote(a.Notes, index)
}
func (a *App) UpdateNoteTitle(index int, newTitle string) {
	a.Notes = notes.UpdateNoteTitle(a.Notes, index, newTitle)
}

func (a *App) UpdateNoteContent(index int, newContent string) {
	a.Notes = notes.UpdateNoteContent(a.Notes, index, newContent)
}

func (a *App) GetNotes() []notes.Note {
	return a.Notes
}