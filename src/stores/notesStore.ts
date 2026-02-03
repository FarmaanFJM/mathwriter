// Pinia store for managing notes state
import { defineStore } from 'pinia';
import type { Note, NoteIndex, ContentBlock } from '../types';
import { generateId } from '../utils/mathConverter';

interface NotesState {
  notes: NoteIndex['notes'];
  currentNote: Note | null;
  loading: boolean;
  error: string | null;
}

export const useNotesStore = defineStore('notes', {
  state: (): NotesState => ({
    notes: [],
    currentNote: null,
    loading: false,
    error: null,
  }),

  getters: {
    sortedNotes: (state) => {
      return [...state.notes].sort((a, b) => b.updatedAt - a.updatedAt);
    },
  },

  actions: {
    /**
     * Load all notes from storage
     */
    async loadNotes() {
      this.loading = true;
      this.error = null;
      try {
        const index = await window.electronAPI.loadNotes();
        this.notes = index.notes;
      } catch (error) {
        this.error = 'Failed to load notes';
        console.error('Error loading notes:', error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Load a specific note by ID
     */
    async loadNote(id: string) {
      this.loading = true;
      this.error = null;
      try {
        const note = await window.electronAPI.loadNote(id);
        if (note) {
          this.currentNote = note;
        } else {
          this.error = 'Note not found';
        }
      } catch (error) {
        this.error = 'Failed to load note';
        console.error('Error loading note:', error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Save the current note
     */
    async saveCurrentNote() {
      if (!this.currentNote) return;

      this.currentNote.updatedAt = Date.now();
      
      try {
        await window.electronAPI.saveNote(this.currentNote);
        
        // Update the note in the index
        const index = this.notes.findIndex(n => n.id === this.currentNote!.id);
        const noteEntry = {
          id: this.currentNote.id,
          title: this.currentNote.title,
          updatedAt: this.currentNote.updatedAt,
        };
        
        if (index >= 0) {
          this.notes[index] = noteEntry;
        } else {
          this.notes.push(noteEntry);
        }
      } catch (error) {
        this.error = 'Failed to save note';
        console.error('Error saving note:', error);
      }
    },

    /**
     * Create a new note
     */
    async createNote(title: string = 'Untitled Note') {
      this.loading = true;
      this.error = null;
      try {
        const note = await window.electronAPI.createNote(title);
        this.notes.push({
          id: note.id,
          title: note.title,
          updatedAt: note.updatedAt,
        });
        this.currentNote = note;
      } catch (error) {
        this.error = 'Failed to create note';
        console.error('Error creating note:', error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Delete a note
     */
    async deleteNote(id: string) {
      this.loading = true;
      this.error = null;
      try {
        await window.electronAPI.deleteNote(id);
        this.notes = this.notes.filter(n => n.id !== id);
        
        // If we deleted the current note, clear it
        if (this.currentNote?.id === id) {
          this.currentNote = null;
        }
      } catch (error) {
        this.error = 'Failed to delete note';
        console.error('Error deleting note:', error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Update the current note's title
     */
    updateTitle(title: string) {
      if (this.currentNote) {
        this.currentNote.title = title;
        this.saveCurrentNote();
      }
    },

    /**
     * Update a block's content
     */
    updateBlock(blockId: string, updates: Partial<ContentBlock>) {
      if (!this.currentNote) return;

      const blockIndex = this.currentNote.content.findIndex(b => b.id === blockId);
      if (blockIndex >= 0) {
        this.currentNote.content[blockIndex] = {
          ...this.currentNote.content[blockIndex],
          ...updates,
        } as ContentBlock;
        this.saveCurrentNote();
      }
    },

    /**
     * Insert a new block at a specific position
     */
    insertBlock(block: ContentBlock, position?: number) {
      if (!this.currentNote) return;

      if (position !== undefined && position >= 0 && position <= this.currentNote.content.length) {
        this.currentNote.content.splice(position, 0, block);
      } else {
        this.currentNote.content.push(block);
      }
      this.saveCurrentNote();
    },

    /**
     * Delete a block
     */
    deleteBlock(blockId: string) {
      if (!this.currentNote) return;

      this.currentNote.content = this.currentNote.content.filter(b => b.id !== blockId);
      this.saveCurrentNote();
    },

    /**
     * Add a paragraph block
     */
    addParagraphBlock(text: string = '', position?: number) {
      const block: ContentBlock = {
        type: 'paragraph',
        id: generateId(),
        text,
      };
      this.insertBlock(block, position);
    },

    /**
     * Add a math block
     */
    addMathBlock(mathBlock: Omit<ContentBlock & { type: 'math' }, 'id'>, position?: number) {
      const block: ContentBlock = {
        ...mathBlock,
        id: generateId(),
      };
      this.insertBlock(block, position);
    },
  },
});
