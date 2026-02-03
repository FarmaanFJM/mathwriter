// Type declarations for window.electronAPI
import type { Note, NoteIndex } from './index';

declare global {
  interface Window {
    electronAPI: {
      loadNotes: () => Promise<NoteIndex>;
      loadNote: (id: string) => Promise<Note | null>;
      saveNote: (note: Note) => Promise<void>;
      deleteNote: (id: string) => Promise<void>;
      createNote: (title: string) => Promise<Note>;
      getAppPath: () => Promise<string>;
    };
  }
}

export {};
