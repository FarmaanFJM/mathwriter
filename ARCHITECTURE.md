# MathWriter Architecture

This document provides a detailed technical overview of MathWriter's architecture, design decisions, and implementation details.

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Application Structure](#application-structure)
4. [Data Flow](#data-flow)
5. [Storage System](#storage-system)
6. [Math AST System](#math-ast-system)
7. [State Management](#state-management)
8. [Security Model](#security-model)
9. [Performance Considerations](#performance-considerations)

## Overview

MathWriter is a local-first desktop application built with Electron and Vue 3. The application follows a three-pane layout with clear separation of concerns:

- **Left Pane**: Note list and search
- **Center Pane**: Block-based editor
- **Right Pane**: Math tools and builders

### Design Principles

1. **Local-First**: All data stored locally, no cloud dependency
2. **No LaTeX Exposure**: Users interact with visual builders, not code
3. **Deterministic Rendering**: AST-based math representation ensures consistent re-editing
4. **Keyboard-Friendly**: Full keyboard navigation support
5. **Clean Separation**: Clear boundaries between UI, state, and storage layers

## Technology Stack

### Core Technologies

- **Electron 29.x**: Desktop application framework
- **Vue 3.5.x**: Reactive UI with Composition API
- **TypeScript 5.x**: Type-safe development
- **Vite 5.x**: Build tool and dev server
- **Pinia 3.x**: State management library
- **KaTeX 0.16.x**: Fast math rendering engine

### Build Tools

- **electron-builder**: Application packaging
- **vue-tsc**: TypeScript checking for Vue
- **vite-plugin-electron**: Electron integration with Vite

## Application Structure

### Process Architecture

```
┌─────────────────────────────────────────┐
│         Electron Main Process           │
│  ┌───────────────────────────────────┐  │
│  │   noteStorage.ts                  │  │
│  │   - File I/O operations           │  │
│  │   - Note CRUD operations          │  │
│  │   - Index management              │  │
│  └───────────────────────────────────┘  │
│              ↕ IPC                      │
│  ┌───────────────────────────────────┐  │
│  │   preload/index.ts                │  │
│  │   - Secure IPC bridge             │  │
│  │   - Context isolation             │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│      Electron Renderer Process          │
│  ┌───────────────────────────────────┐  │
│  │   Vue Application                 │  │
│  │   - Components                    │  │
│  │   - Stores (Pinia)                │  │
│  │   - Composables                   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Component Hierarchy

```
App.vue
├── NotesList.vue
│   └── Note items (dynamic)
├── Editor.vue
│   ├── Note title input
│   └── Content blocks
│       ├── ParagraphBlock (textarea)
│       └── MathBlock (KaTeX rendered)
└── MathTools.vue
    ├── Tab navigation
    └── Builder components
        ├── MatrixBuilder.vue
        ├── VectorBuilder.vue
        ├── SymbolsPanel.vue
        ├── CalculusBuilder.vue
        └── TemplatesBuilder.vue
```

## Data Flow

### Note Loading Flow

```
User clicks note
    ↓
NotesList.vue calls notesStore.loadNote(id)
    ↓
Store calls window.electronAPI.loadNote(id)
    ↓
IPC to main process
    ↓
noteStorage.loadNote(id) reads file
    ↓
Returns Note object
    ↓
Store updates currentNote
    ↓
Editor.vue reactively updates
```

### Math Insertion Flow

```
User builds math in MathTools
    ↓
User clicks "Insert Block"
    ↓
mathBuilderStore.buildCurrentAst()
    ↓
astToLatex(ast) generates LaTeX
    ↓
notesStore.addMathBlock({ ast, latex, inline: false })
    ↓
Block added to currentNote.content
    ↓
Auto-save triggered
    ↓
window.electronAPI.saveNote(note)
    ↓
File written to disk
```

### Math Editing Flow

```
User clicks math block in Editor
    ↓
Editor.vue calls selectMathBlock(block)
    ↓
editorStore.selectBlock(block.id)
mathBuilderStore.enterEditMode(block.id, block.ast)
    ↓
Builder loads AST data
    ↓
User modifies values
    ↓
User clicks "Update"
    ↓
notesStore.updateBlock(blockId, { ast, latex })
    ↓
Auto-save triggered
```

## Storage System

### File Structure

```
userData/notes/
├── index.json              # Note index
├── note-<timestamp>-<id>.json
├── note-<timestamp>-<id>.json
└── ...
```

### index.json Format

```json
{
  "notes": [
    {
      "id": "note-1234567890-abc123",
      "title": "My First Note",
      "updatedAt": 1234567890000
    }
  ]
}
```

### Note File Format

```json
{
  "id": "note-1234567890-abc123",
  "title": "My First Note",
  "content": [
    {
      "type": "paragraph",
      "id": "block-1234567890-xyz789",
      "text": "This is a paragraph."
    },
    {
      "type": "math",
      "id": "block-1234567891-xyz790",
      "inline": false,
      "ast": {
        "kind": "matrix",
        "rows": 2,
        "cols": 2,
        "cells": [["1", "0"], ["0", "1"]]
      },
      "latex": "\\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}"
    }
  ],
  "createdAt": 1234567890000,
  "updatedAt": 1234567891000
}
```

### Storage Operations

#### Create Note

1. Generate unique ID: `note-${timestamp}-${random}`
2. Create Note object with default paragraph block
3. Write to `<id>.json`
4. Update `index.json`

#### Save Note

1. Update `updatedAt` timestamp
2. Write to `<id>.json` (atomic write)
3. Update entry in `index.json`
4. Sort index by `updatedAt` descending

#### Delete Note

1. Delete `<id>.json` file
2. Remove entry from `index.json`
3. Clear currentNote if it was deleted

#### Load Notes Index

1. Read `index.json`
2. If not exists, create empty index
3. Return sorted list

## Math AST System

### Why AST?

The AST (Abstract Syntax Tree) approach provides several benefits:

1. **Re-editability**: Math blocks can be opened and edited with the same visual tools
2. **Deterministic**: Same AST always produces same LaTeX
3. **Extensible**: Easy to add new math types
4. **Portable**: AST can be converted to different formats (LaTeX, MathML, etc.)

### AST Types

#### Symbol Node

```typescript
{
  kind: 'symbol',
  value: '\\pi'  // LaTeX representation
}
```

#### Matrix Node

```typescript
{
  kind: 'matrix',
  rows: 3,
  cols: 3,
  cells: [
    ['a', 'b', 'c'],
    ['d', 'e', 'f'],
    ['g', 'h', 'i']
  ]
}
```

#### Vector Node

```typescript
{
  kind: 'vector',
  orientation: 'col',  // or 'row'
  cells: ['x', 'y', 'z']
}
```

#### Integral Node

```typescript
{
  kind: 'integral',
  from: '0',
  to: '\\infty',
  body: 'x^2',
  d: 'x'
}
```

### AST to LaTeX Conversion

The `astToLatex()` function in `src/utils/mathConverter.ts` converts AST nodes to LaTeX:

```typescript
export function astToLatex(ast: MathAst): string {
  switch (ast.kind) {
    case 'matrix':
      const rows = ast.cells
        .map(row => row.join(' & '))
        .join(' \\\\ ');
      return `\\begin{bmatrix} ${rows} \\end{bmatrix}`;
    
    case 'integral':
      let latex = '\\int';
      if (ast.from && ast.to) {
        latex += `_{${ast.from}}^{${ast.to}}`;
      }
      latex += ` ${ast.body}`;
      if (ast.d) {
        latex += ` \\, d${ast.d}`;
      }
      return latex;
    
    // ... other cases
  }
}
```

## State Management

### Pinia Stores

#### notesStore

**Responsibilities:**
- Load and manage notes list
- CRUD operations on notes
- Current note state
- Block-level operations

**Key Actions:**
- `loadNotes()`: Load notes index
- `loadNote(id)`: Load specific note
- `saveCurrentNote()`: Save current note
- `createNote(title)`: Create new note
- `deleteNote(id)`: Delete note
- `updateBlock(blockId, updates)`: Update block content
- `insertBlock(block, position)`: Insert new block
- `deleteBlock(blockId)`: Delete block

#### editorStore

**Responsibilities:**
- Caret position tracking
- Selected block state
- Search query
- Theme management

**Key Actions:**
- `setCaretPosition(position)`: Update caret position
- `selectBlock(blockId)`: Select a block
- `setSearchQuery(query)`: Update search
- `toggleTheme()`: Switch light/dark theme
- `initTheme()`: Initialize theme from localStorage

#### mathBuilderStore

**Responsibilities:**
- Math builder state (create/edit mode)
- Builder-specific state (matrix, vector, etc.)
- AST generation from builder state

**Key Actions:**
- `enterEditMode(blockId, ast)`: Load AST for editing
- `exitEditMode()`: Return to create mode
- `buildCurrentAst()`: Generate AST from current builder state
- `setMatrixSize(rows, cols)`: Update matrix dimensions
- `updateMatrixCell(row, col, value)`: Update cell value
- `buildMatrixAst()`: Generate matrix AST

### Reactive Data Flow

```
User Input
    ↓
Component Event Handler
    ↓
Store Action
    ↓
State Mutation
    ↓
Vue Reactivity System
    ↓
Component Re-render
```

## Security Model

### Context Isolation

The renderer process runs with context isolation enabled, preventing direct access to Node.js APIs.

### IPC Bridge

The preload script exposes a secure API via `contextBridge`:

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  loadNotes: () => ipcRenderer.invoke('load-notes'),
  loadNote: (id: string) => ipcRenderer.invoke('load-note', id),
  saveNote: (note: Note) => ipcRenderer.invoke('save-note', note),
  // ...
});
```

### No Remote Content

All resources (HTML, CSS, JS, fonts) are bundled with the application. No external network requests are made.

### File System Access

Only the main process has file system access. The renderer must use IPC to request file operations.

## Performance Considerations

### Auto-save Debouncing

Notes are auto-saved on every change, but the save operation could be debounced to reduce disk I/O:

```typescript
// Future enhancement
const debouncedSave = debounce(() => {
  notesStore.saveCurrentNote();
}, 500);
```

### KaTeX Rendering

KaTeX is fast, but rendering many math blocks can be expensive. Optimizations:

1. **Lazy rendering**: Only render visible blocks (future)
2. **Caching**: Cache rendered HTML (future)
3. **Error handling**: `throwOnError: false` prevents crashes

### Large Notes

For notes with many blocks:

1. **Virtual scrolling**: Render only visible blocks (future)
2. **Block pagination**: Split very large notes (future)
3. **Incremental saving**: Save only changed blocks (future)

### Memory Management

- Notes are loaded on-demand
- Only one note is kept in memory at a time
- Index is lightweight (id, title, updatedAt only)

## Future Enhancements

### Planned Features

1. **Full LaTeX Parser**: Import existing LaTeX documents
2. **Export Options**: PDF, LaTeX, Markdown, HTML
3. **Search in Content**: Full-text search across all notes
4. **Tags and Categories**: Organize notes
5. **Attachments**: Embed images and files
6. **Version History**: Track note changes over time
7. **Plugins**: Extend functionality with custom math builders

### Technical Improvements

1. **Offline-first Sync**: Optional cloud backup
2. **Conflict Resolution**: Handle concurrent edits
3. **Performance**: Virtual scrolling, lazy loading
4. **Accessibility**: Screen reader support, keyboard navigation
5. **Testing**: Unit tests, integration tests, e2e tests

## Conclusion

MathWriter's architecture prioritizes simplicity, security, and user experience. The AST-based math system ensures reliable re-editing, while the local-first approach guarantees data ownership and privacy.

For questions or contributions, please refer to the main README or open an issue on GitHub.
