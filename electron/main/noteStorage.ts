// Note storage service for Electron main process
// Handles file-based persistence of notes in the app data directory
import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Note, NoteIndex } from '../../src/types';

/**
 * Get the notes directory path in the app data folder
 */
export function getNotesDir(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'notes');
}

/**
 * Get the path to the notes index file
 */
function getIndexPath(): string {
  return path.join(getNotesDir(), 'index.json');
}

/**
 * Get the path to a specific note file
 */
function getNotePath(id: string): string {
  return path.join(getNotesDir(), `${id}.json`);
}

/**
 * Ensure the notes directory exists
 */
async function ensureNotesDir(): Promise<void> {
  const notesDir = getNotesDir();
  try {
    await fs.access(notesDir);
  } catch {
    await fs.mkdir(notesDir, { recursive: true });
  }
}

/**
 * Load the notes index
 */
export async function loadNotesIndex(): Promise<NoteIndex> {
  await ensureNotesDir();
  const indexPath = getIndexPath();
  
  try {
    const data = await fs.readFile(indexPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    // If index doesn't exist, create empty one
    const emptyIndex: NoteIndex = { notes: [] };
    await fs.writeFile(indexPath, JSON.stringify(emptyIndex, null, 2));
    return emptyIndex;
  }
}

/**
 * Save the notes index
 */
async function saveNotesIndex(index: NoteIndex): Promise<void> {
  await ensureNotesDir();
  const indexPath = getIndexPath();
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
}

/**
 * Load a specific note by ID
 */
export async function loadNote(id: string): Promise<Note | null> {
  const notePath = getNotePath(id);
  
  try {
    const data = await fs.readFile(notePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Save a note to disk and update the index
 */
export async function saveNote(note: Note): Promise<void> {
  await ensureNotesDir();
  
  // Save the note file
  const notePath = getNotePath(note.id);
  await fs.writeFile(notePath, JSON.stringify(note, null, 2));
  
  // Update the index
  const index = await loadNotesIndex();
  const existingIndex = index.notes.findIndex(n => n.id === note.id);
  
  const indexEntry = {
    id: note.id,
    title: note.title,
    updatedAt: note.updatedAt,
  };
  
  if (existingIndex >= 0) {
    index.notes[existingIndex] = indexEntry;
  } else {
    index.notes.push(indexEntry);
  }
  
  // Sort by updatedAt descending (most recent first)
  index.notes.sort((a, b) => b.updatedAt - a.updatedAt);
  
  await saveNotesIndex(index);
}

/**
 * Delete a note from disk and remove from index
 */
export async function deleteNote(id: string): Promise<void> {
  const notePath = getNotePath(id);
  
  // Delete the note file
  try {
    await fs.unlink(notePath);
  } catch {
    // File might not exist, ignore error
  }
  
  // Update the index
  const index = await loadNotesIndex();
  index.notes = index.notes.filter(n => n.id !== id);
  await saveNotesIndex(index);
}

/**
 * Create a new note with default content
 */
export async function createNote(title: string): Promise<Note> {
  const now = Date.now();
  const id = `note-${now}-${Math.random().toString(36).substr(2, 9)}`;
  
  const note: Note = {
    id,
    title,
    content: [
      {
        type: 'paragraph',
        id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: '',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  
  await saveNote(note);
  return note;
}

/**
 * Initialize with seed notes if no notes exist
 */
export async function initializeSeedNotes(): Promise<void> {
  const index = await loadNotesIndex();
  
  if (index.notes.length === 0) {
    // Create welcome note
    const welcomeNote = await createNote('Welcome to MathWriter');
    welcomeNote.content = [
      {
        type: 'paragraph',
        id: 'block-welcome-1',
        text: 'Welcome to MathWriter! This is a local-first notes app with integrated math tools.',
      },
      {
        type: 'paragraph',
        id: 'block-welcome-2',
        text: 'Use the right panel to insert mathematical notation without writing LaTeX.',
      },
    ];
    await saveNote(welcomeNote);
    
    // Create example note with math
    const exampleNote = await createNote('Example: Linear Algebra');
    exampleNote.content = [
      {
        type: 'paragraph',
        id: 'block-example-1',
        text: 'Here are some examples of math notation:',
      },
      {
        type: 'paragraph',
        id: 'block-example-2',
        text: 'A 2×2 identity matrix:',
      },
      {
        type: 'math',
        id: 'block-example-3',
        inline: false,
        ast: {
          kind: 'matrix',
          rows: 2,
          cols: 2,
          cells: [['1', '0'], ['0', '1']],
        },
        latex: '\\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}',
      },
      {
        type: 'paragraph',
        id: 'block-example-4',
        text: 'A column vector:',
      },
      {
        type: 'math',
        id: 'block-example-5',
        inline: false,
        ast: {
          kind: 'vector',
          orientation: 'col',
          cells: ['x', 'y', 'z'],
        },
        latex: '\\begin{bmatrix} x \\\\ y \\\\ z \\end{bmatrix}',
      },
    ];
    await saveNote(exampleNote);
  }
}
