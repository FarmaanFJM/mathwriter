<template>
  <div class="math-writer">
    <!-- LEFT SIDEBAR: Notes Panel -->
    <div class="sidebar-left">
      <div class="sidebar-header">
        <h3>Notes</h3>
        <button class="btn-new-note" @click="createNewNote" title="New Note">+</button>
      </div>
      <div class="notes-list">
        <div
          v-for="note in notesStore.notes"
          :key="note.id"
          class="note-item"
          :class="{ active: notesStore.activeNoteId === note.id }"
          @click="notesStore.selectNote(note.id)"
        >
          <span class="note-title">{{ note.title }}</span>
          <span class="note-date">{{ formatDate(note.updatedAt) }}</span>
        </div>
      </div>
    </div>

    <!-- CENTER: Editor -->
    <div class="editor-container">
      <div class="editor-header">
        <input
          v-if="notesStore.activeNote"
          v-model="notesStore.activeNote.title"
          type="text"
          class="note-title-input"
          placeholder="Untitled Note"
          @input="updateNoteTitle"
        />
      </div>

      <div
        class="editor"
        @keydown="handleKeydown"
        @click="handleEditorClick"
        ref="editorRef"
        tabindex="0"
      >
        <!-- Document content rendered as strict blocks -->
        <div
          v-for="(line, lineIndex) in document"
          :key="line.id"
          class="container-line"
          :class="{ active: cursor.lineId === line.id }"
          :data-line-id="line.id"
          :data-line-index="lineIndex"
          :data-line-number="lineIndex + 1"
        >
          <!-- Text line -->
          <p v-if="line.type === 'text'" class="text-block">
            <template v-for="(segment, idx) in line.content" :key="`${line.id}-${idx}`">
              <template v-if="segment.type === 'text'">{{ segment.value }}</template>
              <span v-else class="symbol">{{ segment.display }}</span>
            </template>
          </p>

          <!-- Matrix line (INLINE) -->
          <MatrixBlock
            v-else-if="line.type === 'matrix'"
            :matrix-line="line"
            :is-active="cursor.zone === 'matrix' && cursor.lineId === line.id"
            :active-row="cursor.zone === 'matrix' && cursor.lineId === line.id ? cursor.row : -1"
            :active-col="cursor.zone === 'matrix' && cursor.lineId === line.id ? cursor.col : -1"
            @cell-update="updateMatrixCell(line.id, $event)"
            @cell-focus="focusMatrixCell(line.id, $event.row, $event.col)"
            @matrix-keydown="handleMatrixKeydown(line.id, $event)"
          />
        </div>

        <!-- INLINE Command Palette (VS Code style) -->
        <div
          v-if="showCommandPalette"
          class="command-palette-inline"
          :style="palettePosition"
        >
          <div class="palette-header-inline">
            <span class="palette-icon">/</span>
            <input
              v-model="commandQuery"
              type="text"
              class="palette-input"
              placeholder="matrix, sigma, sqrt..."
              @keydown="handlePaletteKeydown"
              ref="paletteInputRef"
            />
          </div>

          <div class="palette-list">
            <div
              v-for="(cmd, idx) in filteredCommands"
              :key="cmd.id"
              class="palette-item"
              :class="{ selected: idx === selectedCommandIndex }"
              @click="executeCommand(cmd)"
            >
              <span class="cmd-icon">{{ cmd.icon }}</span>
              <div class="cmd-info">
                <span class="cmd-name">{{ cmd.name }}</span>
                <span class="cmd-desc">{{ cmd.description }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT SIDEBAR: Keypad -->
    <div class="sidebar-right">
      <div class="keypad">
        <div class="keypad-section">
          <h4>Math Symbols</h4>
          <div class="keypad-grid">
            <button
              v-for="symbol in mathSymbols"
              :key="symbol.id"
              class="keypad-btn"
              @click="insertSymbol(symbol.id)"
              :title="symbol.name"
            >
              {{ symbol.display }}
            </button>
          </div>
        </div>

        <div class="keypad-section">
          <h4>Matrices</h4>
          <div class="keypad-grid">
            <button class="keypad-btn" @click="insertMatrix(2, 2)">2×2</button>
            <button class="keypad-btn" @click="insertMatrix(2, 3)">2×3</button>
            <button class="keypad-btn" @click="insertMatrix(3, 2)">3×2</button>
            <button class="keypad-btn" @click="insertMatrix(3, 3)">3×3</button>
            <button class="keypad-btn" @click="insertMatrix(4, 4)">4×4</button>
          </div>
        </div>

        <div class="keypad-section">
          <h4>Editing</h4>
          <div class="keypad-grid">
            <button class="keypad-btn" @click="insertNewLine">New Line</button>
            <button class="keypad-btn" @click="deleteCurrentLine">Delete Line</button>
          </div>
        </div>

        <div class="keypad-section">
          <h4>Keyboard Shortcuts</h4>
          <div class="shortcuts-list">
            <div class="shortcut-item">
              <kbd>/</kbd> <span>Open commands</span>
            </div>
            <div class="shortcut-item">
              <kbd>↑↓←→</kbd> <span>Navigate</span>
            </div>
            <div class="shortcut-item">
              <kbd>Esc</kbd> <span>Exit matrix</span>
            </div>
            <div class="shortcut-item">
              <kbd>Enter</kbd> <span>New line</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useNotesStore } from '../stores/notesStore';
import type { CursorPosition, TextLine, MatrixLine, Command, MathSymbol, SymbolSpan } from '../types/editor';
import MatrixBlock from './MatrixBlock.vue';

const notesStore = useNotesStore();
const editorRef = ref<HTMLDivElement | null>(null);
const paletteInputRef = ref<HTMLInputElement | null>(null);

// Initialize
onMounted(() => {
  notesStore.init();
  if (document.value.length > 0) {
    cursor.value = {
      zone: 'text',
      lineId: document.value[0].id,
      charOffset: 0
    };
  }
  nextTick(() => {
    editorRef.value?.focus();
  });
});

// Document content
const document = computed(() => notesStore.document);

// Cursor state
const cursor = ref<CursorPosition>({
  zone: 'text',
  lineId: '',
  charOffset: 0
});

// Command palette state
const commandQuery = ref('');
const showCommandPalette = ref(false);
const selectedCommandIndex = ref(0);

// Position palette near cursor line
const palettePosition = computed(() => {
  if (!cursor.value.lineId) return {};
  
  const lineEl = window.document.querySelector(`[data-line-id="${cursor.value.lineId}"]`);
  if (!lineEl) return {};

  const rect = lineEl.getBoundingClientRect();
  const editorRect = editorRef.value?.getBoundingClientRect();
  
  if (!editorRect) return {};

  return {
    position: 'absolute' as const,
    top: `${rect.bottom - editorRect.top + 4}px`,
    left: `${rect.left - editorRect.left}px`,
    maxWidth: `${Math.min(500, rect.width)}px`
  };
});

// Commands with icons
const commands: Command[] = [
  { id: 'matrix-2x2', name: 'matrix 2×2', description: 'Insert 2×2 matrix', category: 'insert', icon: '⊞' },
  { id: 'matrix-2x3', name: 'matrix 2×3', description: 'Insert 2×3 matrix', category: 'insert', icon: '⊞' },
  { id: 'matrix-3x2', name: 'matrix 3×2', description: 'Insert 3×2 matrix', category: 'insert', icon: '⊞' },
  { id: 'matrix-3x3', name: 'matrix 3×3', description: 'Insert 3×3 matrix', category: 'insert', icon: '⊞' },
  { id: 'matrix-4x4', name: 'matrix 4×4', description: 'Insert 4×4 matrix', category: 'insert', icon: '⊞' },
  { id: 'sigma', name: 'sigma', description: 'Insert Σ symbol', category: 'symbol', icon: 'Σ' },
  { id: 'integral', name: 'integral', description: 'Insert ∫ symbol', category: 'symbol', icon: '∫' },
  { id: 'sqrt', name: 'sqrt', description: 'Insert √ symbol', category: 'symbol', icon: '√' },
  { id: 'pi', name: 'pi', description: 'Insert π symbol', category: 'symbol', icon: 'π' },
  { id: 'theta', name: 'theta', description: 'Insert θ symbol', category: 'symbol', icon: 'θ' },
  { id: 'alpha', name: 'alpha', description: 'Insert α symbol', category: 'symbol', icon: 'α' },
  { id: 'beta', name: 'beta', description: 'Insert β symbol', category: 'symbol', icon: 'β' },
  { id: 'gamma', name: 'gamma', description: 'Insert γ symbol', category: 'symbol', icon: 'γ' },
  { id: 'delta', name: 'delta', description: 'Insert δ symbol', category: 'symbol', icon: 'δ' },
  { id: 'lambda', name: 'lambda', description: 'Insert λ symbol', category: 'symbol', icon: 'λ' },
];

const filteredCommands = computed(() => {
  if (!commandQuery.value) return commands;
  const query = commandQuery.value.toLowerCase();
  return commands.filter(cmd =>
    cmd.name.toLowerCase().includes(query) ||
    cmd.description.toLowerCase().includes(query)
  );
});

// Math symbols for keypad
const mathSymbols: MathSymbol[] = [
  { id: 'sigma', name: 'Sigma', display: 'Σ' },
  { id: 'integral', name: 'Integral', display: '∫' },
  { id: 'sqrt', name: 'Square root', display: '√' },
  { id: 'pi', name: 'Pi', display: 'π' },
  { id: 'theta', name: 'Theta', display: 'θ' },
  { id: 'alpha', name: 'Alpha', display: 'α' },
  { id: 'beta', name: 'Beta', display: 'β' },
  { id: 'gamma', name: 'Gamma', display: 'γ' },
  { id: 'delta', name: 'Delta', display: 'δ' },
  { id: 'lambda', name: 'Lambda', display: 'λ' },
];

// Keyboard input handling
function handleKeydown(event: KeyboardEvent) {
  // Command palette navigation
  if (showCommandPalette.value) {
    return; // Let handlePaletteKeydown handle it
  }

  // Open command palette
  if (event.key === '/') {
    showCommandPalette.value = true;
    commandQuery.value = '';
    selectedCommandIndex.value = 0;
    event.preventDefault();
    nextTick(() => {
      paletteInputRef.value?.focus();
    });
    return;
  }

  // Normal editor navigation
  if (cursor.value.zone === 'text') {
    handleTextNavigation(event);
  }
  // Matrix navigation is handled by MatrixBlock component
}

function handleTextNavigation(event: KeyboardEvent) {
  const currentLineIndex = notesStore.getLineIndex(cursor.value.lineId);
  const currentLine = document.value[currentLineIndex] as TextLine;

  if (event.key === 'ArrowUp') {
    if (currentLineIndex > 0) {
      const prevLine = document.value[currentLineIndex - 1];
      cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 };
    }
    event.preventDefault();
  } else if (event.key === 'ArrowDown') {
    if (currentLineIndex < document.value.length - 1) {
      const nextLine = document.value[currentLineIndex + 1];
      
      // If next line is matrix, enter it
      if (nextLine.type === 'matrix') {
        cursor.value = {
          zone: 'matrix',
          lineId: nextLine.id,
          row: 0,
          col: 0
        };
      } else {
        cursor.value = { zone: 'text', lineId: nextLine.id, charOffset: 0 };
      }
    }
    event.preventDefault();
  } else if (event.key === 'Enter') {
    insertNewLine();
    event.preventDefault();
  } else if (event.key === 'Backspace') {
    deleteCharAtCursor();
    event.preventDefault();
  } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
    insertCharAtCursor(event.key);
    event.preventDefault();
  }
}

function handleMatrixKeydown(lineId: string, event: { row: number, col: number, key: KeyboardEvent }) {
  const matrix = notesStore.getLineById(lineId) as MatrixLine;
  const { row, col, key: keyEvent } = event;

  if (keyEvent.key === 'ArrowRight') {
    if (col < matrix.cols - 1) {
      cursor.value = { zone: 'matrix', lineId, row, col: col + 1 };
    } else if (row < matrix.rows - 1) {
      cursor.value = { zone: 'matrix', lineId, row: row + 1, col: 0 };
    } else {
      // Exit to next line
      exitMatrixToNextLine(lineId);
    }
  } else if (keyEvent.key === 'ArrowLeft') {
    if (col > 0) {
      cursor.value = { zone: 'matrix', lineId, row, col: col - 1 };
    } else if (row > 0) {
      cursor.value = { zone: 'matrix', lineId, row: row - 1, col: matrix.cols - 1 };
    } else {
      // Exit to previous line
      exitMatrixToPreviousLine(lineId);
    }
  } else if (keyEvent.key === 'ArrowDown') {
    if (row < matrix.rows - 1) {
      cursor.value = { zone: 'matrix', lineId, row: row + 1, col };
    } else {
      // Exit to next line
      exitMatrixToNextLine(lineId);
    }
  } else if (keyEvent.key === 'ArrowUp') {
    if (row > 0) {
      cursor.value = { zone: 'matrix', lineId, row: row - 1, col };
    } else {
      // Exit to previous line
      exitMatrixToPreviousLine(lineId);
    }
  } else if (keyEvent.key === 'Escape') {
    exitMatrixToNextLine(lineId);
  } else if (keyEvent.key === 'Enter') {
    if (row < matrix.rows - 1) {
      cursor.value = { zone: 'matrix', lineId, row: row + 1, col };
    } else {
      exitMatrixToNextLine(lineId);
    }
  } else if (keyEvent.key === 'Tab') {
    if (col < matrix.cols - 1) {
      cursor.value = { zone: 'matrix', lineId, row, col: col + 1 };
    } else {
      exitMatrixToNextLine(lineId);
    }
    keyEvent.preventDefault();
  }
}

function exitMatrixToNextLine(lineId: string) {
  const lineIndex = notesStore.getLineIndex(lineId);
  const nextLineIndex = lineIndex + 1;

  if (nextLineIndex < document.value.length) {
    const nextLine = document.value[nextLineIndex];
    cursor.value = { zone: 'text', lineId: nextLine.id, charOffset: 0 };
  } else {
    // Create new line
    const newLine: TextLine = {
      id: generateId(),
      type: 'text',
      content: [{ type: 'text', value: '' }]
    };
    if (notesStore.activeNote) {
      notesStore.activeNote.content.push(newLine);
      updateDocument();
      cursor.value = { zone: 'text', lineId: newLine.id, charOffset: 0 };
    }
  }
}

function exitMatrixToPreviousLine(lineId: string) {
  const lineIndex = notesStore.getLineIndex(lineId);
  const prevLineIndex = lineIndex - 1;

  if (prevLineIndex >= 0) {
    const prevLine = document.value[prevLineIndex];
    cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 };
  }
}

function handlePaletteKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    selectedCommandIndex.value = Math.min(selectedCommandIndex.value + 1, filteredCommands.value.length - 1);
    event.preventDefault();
  } else if (event.key === 'ArrowUp') {
    selectedCommandIndex.value = Math.max(selectedCommandIndex.value - 1, 0);
    event.preventDefault();
  } else if (event.key === 'Enter') {
    if (filteredCommands.value[selectedCommandIndex.value]) {
      executeCommand(filteredCommands.value[selectedCommandIndex.value]);
    }
    event.preventDefault();
  } else if (event.key === 'Escape') {
    closeCommandPalette();
    event.preventDefault();
  }
}

function handleEditorClick(event: MouseEvent) {
  editorRef.value?.focus();
}

// Insertion operations
function insertSymbol(symbolId: SymbolSpan['value']) {
  if (cursor.value.zone !== 'text') return;

  const symbol = mathSymbols.find(s => s.id === symbolId);
  if (!symbol) return;

  const currentLine = notesStore.getLineById(cursor.value.lineId) as TextLine;
  if (currentLine) {
    currentLine.content.push({
      type: 'symbol',
      value: symbolId,
      display: symbol.display
    });
    updateDocument();
  }

  closeCommandPalette();
}

function insertMatrix(rows: number, cols: number) {
  const lineIndex = notesStore.getLineIndex(cursor.value.lineId);
  const newMatrixLine: MatrixLine = {
    id: generateId(),
    type: 'matrix',
    rows,
    cols,
    data: Array(rows).fill(null).map(() => Array(cols).fill(''))
  };

  // Insert matrix on NEW line after current
  if (notesStore.activeNote) {
    notesStore.activeNote.content.splice(lineIndex + 1, 0, newMatrixLine);
    updateDocument();

    // Move cursor to matrix
    cursor.value = {
      zone: 'matrix',
      lineId: newMatrixLine.id,
      row: 0,
      col: 0
    };
  }

  closeCommandPalette();
}

function insertNewLine() {
  const lineIndex = notesStore.getLineIndex(cursor.value.lineId);
  const newLine: TextLine = {
    id: generateId(),
    type: 'text',
    content: [{ type: 'text', value: '' }]
  };

  if (notesStore.activeNote) {
    notesStore.activeNote.content.splice(lineIndex + 1, 0, newLine);
    updateDocument();

    cursor.value = {
      zone: 'text',
      lineId: newLine.id,
      charOffset: 0
    };
  }
}

function insertCharAtCursor(char: string) {
  if (cursor.value.zone !== 'text') return;

  const currentLine = notesStore.getLineById(cursor.value.lineId) as TextLine;
  if (!currentLine || currentLine.type !== 'text') return;

  // Find last text segment and append
  const lastSegment = currentLine.content[currentLine.content.length - 1];
  if (lastSegment?.type === 'text') {
    lastSegment.value += char;
  } else {
    currentLine.content.push({ type: 'text', value: char });
  }

  cursor.value = { ...cursor.value, charOffset: cursor.value.charOffset + 1 };
  updateDocument();
}

function deleteCharAtCursor() {
  if (cursor.value.zone !== 'text') return;

  const currentLine = notesStore.getLineById(cursor.value.lineId) as TextLine;
  if (!currentLine || currentLine.type !== 'text') return;

  const lastSegment = currentLine.content[currentLine.content.length - 1];
  if (lastSegment?.type === 'text' && lastSegment.value.length > 0) {
    lastSegment.value = lastSegment.value.slice(0, -1);
    cursor.value = { ...cursor.value, charOffset: Math.max(0, cursor.value.charOffset - 1) };
    updateDocument();
  }
}

function deleteCurrentLine() {
  const lineIndex = notesStore.getLineIndex(cursor.value.lineId);
  if (notesStore.activeNote && notesStore.activeNote.content.length > 1) {
    notesStore.activeNote.content.splice(lineIndex, 1);
    updateDocument();

    // Move cursor to previous or next line
    if (lineIndex > 0) {
      const prevLine = document.value[lineIndex - 1];
      cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 };
    } else if (document.value.length > 0) {
      const nextLine = document.value[0];
      cursor.value = { zone: 'text', lineId: nextLine.id, charOffset: 0 };
    }
  }
}

function updateMatrixCell(lineId: string, event: { row: number, col: number, value: string }) {
  const matrix = notesStore.getLineById(lineId) as MatrixLine;
  if (matrix) {
    matrix.data[event.row][event.col] = event.value;
    updateDocument();
  }
}

function focusMatrixCell(lineId: string, row: number, col: number) {
  cursor.value = {
    zone: 'matrix',
    lineId,
    row,
    col
  };
}

function executeCommand(cmd: Command) {
  if (cmd.id.startsWith('matrix-')) {
    const [, size] = cmd.id.split('-');
    const [rows, cols] = size.split('x').map(Number);
    insertMatrix(rows, cols);
  } else if (cmd.category === 'symbol') {
    insertSymbol(cmd.id as SymbolSpan['value']);
  }
}

function closeCommandPalette() {
  showCommandPalette.value = false;
  commandQuery.value = '';
  editorRef.value?.focus();
}

function createNewNote() {
  notesStore.createNote();
}

function updateNoteTitle() {
  if (notesStore.activeNote) {
    notesStore.activeNote.updatedAt = Date.now();
  }
}

function updateDocument() {
  if (notesStore.activeNote) {
    notesStore.activeNote.updatedAt = Date.now();
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
</script>

<style scoped>
.math-writer {
  display: grid;
  grid-template-columns: 250px 1fr 300px;
  height: 100vh;
  background: var(--color-bg-primary);
}

/* LEFT SIDEBAR */
.sidebar-left {
  border-right: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
}

.btn-new-note {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-accent);
  font-size: 20px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-new-note:hover {
  background: var(--color-accent);
  color: white;
}

.notes-list {
  flex: 1;
  overflow-y: auto;
}

.note-item {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.note-item:hover {
  background: var(--color-bg-primary);
}

.note-item.active {
  background: var(--color-accent-light);
  border-left: 3px solid var(--color-accent);
}

.note-title {
  display: block;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.note-date {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

/* CENTER EDITOR */
.editor-container {
  display: flex;
  flex-direction: column;
  position: relative;
}

.editor-header {
  padding: var(--spacing-md) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.note-title-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  outline: none;
}

.editor {
  flex: 1;
  padding: var(--spacing-xl);
  padding-left: 60px; /* Space for line numbers */
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: var(--font-size-md);
  line-height: 1.8;
  outline: none;
  position: relative;
}

/* CRITICAL: Container line with visual indicators */
.container-line {
  display: block;
  min-height: 32px;
  padding: 4px 8px;
  margin: 2px 0;
  position: relative;
  border-left: 3px solid transparent;
  transition: all 0.2s;
  background: transparent;
}

.container-line:hover {
  background: rgba(0, 0, 0, 0.02);
  border-left: 3px solid rgba(100, 150, 255, 0.3);
}

.container-line.active {
  background: rgba(100, 150, 255, 0.08);
  border-left: 3px solid #2196F3;
}

/* Line numbers */
.container-line::before {
  content: attr(data-line-number);
  position: absolute;
  left: -48px;
  top: 4px;
  font-size: 12px;
  color: #999;
  width: 32px;
  text-align: right;
  user-select: none;
}

/* CRITICAL: Text block is INLINE */
.text-block {
  display: inline;
  margin: 0;
  padding: 0;
  line-height: 1.6;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Symbol is truly inline */
.symbol {
  display: inline;
  color: var(--color-accent);
  font-weight: 600;
  font-size: 18px;
  margin: 0 2px;
}

/* INLINE Command Palette (VS Code style) */
.command-palette-inline {
  position: absolute;
  z-index: 1000;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  min-width: 400px;
  max-height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.palette-header-inline {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  background: #f9f9f9;
}

.palette-icon {
  font-size: 16px;
  color: #999;
  margin-right: 8px;
}

.palette-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  background: transparent;
  font-family: var(--font-mono);
}

.palette-list {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
}

.palette-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.palette-item:hover,
.palette-item.selected {
  background: #e3f2fd;
}

.cmd-icon {
  font-size: 18px;
  margin-right: 12px;
  min-width: 24px;
  text-align: center;
}

.cmd-info {
  display: flex;
  flex-direction: column;
}

.cmd-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.cmd-desc {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

/* RIGHT SIDEBAR */
.sidebar-right {
  border-left: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.keypad {
  flex: 1;
  padding: var(--spacing-md);
}

.keypad-section {
  margin-bottom: var(--spacing-lg);
}

.keypad-section h4 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.keypad-btn {
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.keypad-btn:hover {
  background: var(--color-accent-light);
  border-color: var(--color-accent);
  transform: scale(1.05);
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.shortcut-item kbd {
  display: inline-block;
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
</style>
