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
          :data-line-id="line.id"
          :data-line-index="lineIndex"
        >
          <!-- Text line -->
          <p v-if="line.type === 'text'" class="text-block">
            <template v-for="(segment, idx) in line.content" :key="`${line.id}-${idx}`">
              <template v-if="segment.type === 'text'">{{ segment.value }}</template>
              <span v-else class="symbol">{{ segment.display }}</span>
            </template>
            <span v-if="cursor.zone === 'text' && cursor.lineId === line.id" class="cursor-indicator">|</span>
          </p>

          <!-- Matrix line -->
          <MatrixBlock
            v-else-if="line.type === 'matrix'"
            :matrix-line="line"
            :is-active="cursor.zone === 'matrix' && cursor.lineId === line.id"
            :active-row="cursor.zone === 'matrix' && cursor.lineId === line.id ? cursor.row : -1"
            :active-col="cursor.zone === 'matrix' && cursor.lineId === line.id ? cursor.col : -1"
            @cell-update="updateMatrixCell(line.id, $event)"
            @cell-focus="focusMatrixCell(line.id, $event.row, $event.col)"
          />
        </div>
      </div>
    </div>

    <!-- RIGHT SIDEBAR: Keypad + Command Palette -->
    <div class="sidebar-right">
      <!-- Command Search -->
      <div class="command-search">
        <input
          v-model="commandQuery"
          type="text"
          placeholder="Type / for commands"
          @keydown.prevent.slash="showCommandPalette = true"
          @keydown="handleCommandInput"
          class="command-input"
        />
      </div>

      <!-- Command Palette (INLINE, filtered list) -->
      <div v-if="showCommandPalette" class="command-palette">
        <div class="palette-header">Commands</div>
        <div class="command-list">
          <div
            v-for="(cmd, idx) in filteredCommands"
            :key="cmd.id"
            class="command-item"
            :class="{ selected: idx === selectedCommandIndex }"
            @click="executeCommand(cmd)"
          >
            <span class="cmd-name">{{ cmd.name }}</span>
            <span class="cmd-desc">{{ cmd.description }}</span>
          </div>
        </div>
      </div>

      <!-- Keypad -->
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

// Commands
const commands: Command[] = [
  { id: 'matrix-2x2', name: 'Matrix 2×2', description: 'Insert 2×2 matrix', category: 'insert' },
  { id: 'matrix-3x3', name: 'Matrix 3×3', description: 'Insert 3×3 matrix', category: 'insert' },
  { id: 'sigma', name: 'Sigma Σ', description: 'Summation symbol', category: 'symbol' },
  { id: 'integral', name: 'Integral ∫', description: 'Integral symbol', category: 'symbol' },
  { id: 'sqrt', name: 'Square Root √', description: 'Square root symbol', category: 'symbol' },
  { id: 'pi', name: 'Pi π', description: 'Pi symbol', category: 'symbol' },
  { id: 'theta', name: 'Theta θ', description: 'Theta symbol', category: 'symbol' },
  { id: 'alpha', name: 'Alpha α', description: 'Alpha symbol', category: 'symbol' },
  { id: 'beta', name: 'Beta β', description: 'Beta symbol', category: 'symbol' },
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
    if (event.key === 'ArrowDown') {
      selectedCommandIndex.value = Math.min(selectedCommandIndex.value + 1, filteredCommands.value.length - 1);
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      selectedCommandIndex.value = Math.max(selectedCommandIndex.value - 1, 0);
      event.preventDefault();
    } else if (event.key === 'Enter') {
      executeCommand(filteredCommands.value[selectedCommandIndex.value]);
      event.preventDefault();
    } else if (event.key === 'Escape') {
      closeCommandPalette();
      event.preventDefault();
    }
    return;
  }

  // Normal editor navigation
  if (cursor.value.zone === 'text') {
    handleTextNavigation(event);
  } else if (cursor.value.zone === 'matrix') {
    handleMatrixNavigation(event);
  }
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
      cursor.value = { zone: 'text', lineId: nextLine.id, charOffset: 0 };
    }
    event.preventDefault();
  } else if (event.key === '/') {
    showCommandPalette.value = true;
    commandQuery.value = '';
    selectedCommandIndex.value = 0;
    event.preventDefault();
  } else if (event.key === 'Enter') {
    insertNewLine();
    event.preventDefault();
  } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
    insertCharAtCursor(event.key);
    event.preventDefault();
  }
}

function handleMatrixNavigation(event: KeyboardEvent) {
  if (cursor.value.zone !== 'matrix') return;
  
  const matrix = notesStore.getLineById(cursor.value.lineId) as MatrixLine;

  if (event.key === 'ArrowLeft') {
    if (cursor.value.col > 0) {
      cursor.value = { ...cursor.value, col: cursor.value.col - 1 };
    }
    event.preventDefault();
  } else if (event.key === 'ArrowRight') {
    if (cursor.value.col < matrix.cols - 1) {
      cursor.value = { ...cursor.value, col: cursor.value.col + 1 };
    }
    event.preventDefault();
  } else if (event.key === 'ArrowUp') {
    if (cursor.value.row > 0) {
      cursor.value = { ...cursor.value, row: cursor.value.row - 1 };
    }
    event.preventDefault();
  } else if (event.key === 'ArrowDown') {
    if (cursor.value.row < matrix.rows - 1) {
      cursor.value = { ...cursor.value, row: cursor.value.row + 1 };
    }
    event.preventDefault();
  } else if (event.key === 'Escape') {
    // Exit matrix
    const lineIndex = notesStore.getLineIndex(cursor.value.lineId);
    if (lineIndex < document.value.length - 1) {
      const nextLine = document.value[lineIndex + 1];
      cursor.value = { zone: 'text', lineId: nextLine.id, charOffset: 0 };
    }
    event.preventDefault();
  }
}

function handleCommandInput(event: KeyboardEvent) {
  // Let v-model handle typing
}

function handleEditorClick(event: MouseEvent) {
  // Focus editor
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
}

function createNewNote() {
  notesStore.createNote();
}

function updateNoteTitle() {
  // Auto-saved via v-model binding
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
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: var(--font-size-md);
  line-height: 1.8;
  outline: none;
}

.container-line {
  margin-bottom: var(--spacing-md);
  min-height: 32px;
}

.text-block {
  margin: 0;
  padding: var(--spacing-xs);
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.symbol {
  color: var(--color-accent);
  font-weight: 600;
  margin: 0 2px;
}

.cursor-indicator {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background: var(--color-accent);
  animation: blink 1s infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* RIGHT SIDEBAR */
.sidebar-right {
  border-left: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.command-search {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.command-input {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  outline: none;
}

.command-palette {
  border-bottom: 1px solid var(--color-border);
  max-height: 300px;
  overflow-y: auto;
}

.palette-header {
  padding: var(--spacing-sm) var(--spacing-md);
  font-weight: 600;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
}

.command-list {
  display: flex;
  flex-direction: column;
}

.command-item {
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

.command-item:hover,
.command-item.selected {
  background: var(--color-accent-light);
}

.cmd-name {
  display: block;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.cmd-desc {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
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
</style>
