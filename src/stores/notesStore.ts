import { defineStore } from 'pinia';
import type { Note, DocumentContent, TextLine } from '../types/editor';

export interface NotesStoreState {
  notes: Note[];
  activeNoteId: string | null;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createEmptyNote(title: string = 'Untitled Note'): Note {
  const emptyLine: TextLine = {
    id: generateId(),
    type: 'text',
    content: [{ type: 'text', value: '' }]
  };

  return {
    id: generateId(),
    title,
    content: [emptyLine],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

export const useNotesStore = defineStore('notes', {
  state: (): NotesStoreState => ({
    notes: [createEmptyNote('My First Note')],
    activeNoteId: null,
  }),

  getters: {
    activeNote(state): Note | null {
      return state.notes.find(n => n.id === state.activeNoteId) || null;
    },

    document(state): DocumentContent {
      const note = state.notes.find(n => n.id === state.activeNoteId);
      return note?.content || [];
    }
  },

  actions: {
    init() {
      // Set first note as active if none selected
      if (!this.activeNoteId && this.notes.length > 0) {
        this.activeNoteId = this.notes[0].id;
      }
    },

    createNote(title: string = 'Untitled Note') {
      const newNote = createEmptyNote(title);
      this.notes.push(newNote);
      this.activeNoteId = newNote.id;
    },

    selectNote(id: string) {
      this.activeNoteId = id;
    },

    deleteNote(id: string) {
      const index = this.notes.findIndex(n => n.id === id);
      if (index !== -1) {
        this.notes.splice(index, 1);
        
        // Select another note if we deleted the active one
        if (this.activeNoteId === id) {
          this.activeNoteId = this.notes.length > 0 ? this.notes[0].id : null;
        }
      }
    },

    updateNoteTitle(id: string, title: string) {
      const note = this.notes.find(n => n.id === id);
      if (note) {
        note.title = title;
        note.updatedAt = Date.now();
      }
    },

    updateNoteContent(id: string, content: DocumentContent) {
      const note = this.notes.find(n => n.id === id);
      if (note) {
        note.content = content;
        note.updatedAt = Date.now();
      }
    },

    // Helper to get line by ID
    getLineById(lineId: string): any | null {
      if (!this.activeNote) return null;
      return this.activeNote.content.find(line => line.id === lineId) || null;
    },

    // Helper to get line index
    getLineIndex(lineId: string): number {
      if (!this.activeNote) return -1;
      return this.activeNote.content.findIndex(line => line.id === lineId);
    }
  },
});
