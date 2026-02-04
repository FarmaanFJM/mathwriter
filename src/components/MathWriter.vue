<template>
  <div class="math-writer">
    <!-- LEFT SIDEBAR: Notes Panel -->
    <div class="sidebar-left">
      <div class="sidebar-header">
        <h3>Notes</h3>
        <div class="header-actions">
          <button class="btn-theme-toggle" @click="toggleTheme" :title="`Switch to ${editorStore.theme === 'light' ? 'dark' : 'light'} mode`">
            <span v-if="editorStore.theme === 'light'">&#x1F319;</span>
            <span v-else>&#x2600;&#xFE0F;</span>
          </button>
          <button class="btn-new-note" @click="createNewNote" title="New Note">+</button>
        </div>
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

    <!-- CENTER: Editor Container -->
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

      <!-- CRITICAL: Hidden input that captures keyboard -->
      <input
        ref="hiddenInput"
        type="text"
        class="hidden-input"
        @keydown="handleKeydown"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <!-- DISPLAY LAYER: Read-only rendered content -->
      <div
        class="editor-display"
        @click="handleDisplayClick"
        @mousemove="handleMouseMove"
      >
        <!-- Render document as pure HTML -->
        <div
          v-for="(line, lineIndex) in document"
          :key="line.id"
          class="container-line"
          :class="{
            'is-active': cursor.lineId === line.id,
            'is-math-line': line.type === 'math'
          }"
          :data-line-id="line.id"
          :data-line-index="lineIndex"
          :data-line-number="lineIndex + 1"
        >
          <!-- Text line -->
          <template v-if="line.type === 'text'">
            <template v-if="(line as TextLine).content.length === 0 || ((line as TextLine).content.length === 1 && (line as TextLine).content[0].type === 'text' && (line as TextLine).content[0].value === '')">
              <!-- Empty line with placeholder for click target -->
              <span class="empty-line-placeholder"></span>
            </template>
            <template v-else>
              <span
                v-for="(segment, idx) in (line as TextLine).content"
                :key="`${line.id}-${idx}`"
                class="text-segment"
              >
                <template v-if="segment.type === 'text'">{{ segment.value }}</template>
                <span v-else class="symbol">{{ segment.display }}</span>
              </span>
            </template>

            <!-- Custom caret in text -->
            <span
              v-if="cursor.zone === 'text' && cursor.lineId === line.id"
              class="custom-caret"
            ></span>
          </template>

          <!-- Math expression line (KaTeX rendered) -->
          <template v-else-if="line.type === 'math'">
            <MathExpression
              :line="(line as MathExpressionLine)"
              :is-active="cursor.lineId === line.id"
              @focus="focusMathExpression(line.id)"
              @update="updateMathLatex(line.id, $event)"
              @blur="blurMathExpression"
              @delete="deleteMathExpression(line.id)"
              @navigate-up="handleArrowUp"
              @navigate-down="handleArrowDown"
            />
          </template>

          <!-- Matrix line (inline, not a separate container) -->
          <div
            v-else-if="line.type === 'matrix'"
            class="matrix-inline"
            :class="{ 'is-editing': cursor.zone === 'matrix' && cursor.lineId === line.id }"
            @click.stop="focusMatrixCell(line.id, 0, 0)"
          >
            <!-- Left bracket -->
            <div class="matrix-bracket bracket-left" :style="{ height: bracketHeight(line as MatrixLine) }">
              <svg viewBox="0 0 20 100" preserveAspectRatio="none">
                <path d="M 15 0 L 5 0 L 5 100 L 15 100" fill="none" stroke="currentColor" stroke-width="2.5"/>
              </svg>
            </div>

            <!-- Grid -->
            <div class="matrix-grid" :style="gridStyle(line as MatrixLine)">
              <div
                v-for="(cell, cellIdx) in flattenMatrix(line as MatrixLine)"
                :key="`${line.id}-${cellIdx}`"
                class="matrix-cell-textbook"
                :class="{
                  'is-active': cursor.zone === 'matrix' && cursor.lineId === line.id && cursor.row === cell.row && cursor.col === cell.col
                }"
                :data-row="cell.row"
                :data-col="cell.col"
                @click.stop="focusMatrixCell(line.id, cell.row, cell.col)"
              >
                {{ cell.value || '_' }}
              </div>
            </div>

            <!-- Right bracket -->
            <div class="matrix-bracket bracket-right" :style="{ height: bracketHeight(line as MatrixLine) }">
              <svg viewBox="0 0 20 100" preserveAspectRatio="none">
                <path d="M 5 0 L 15 0 L 15 100 L 5 100" fill="none" stroke="currentColor" stroke-width="2.5"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Command palette inline -->
      <div
        v-if="showCommandPalette"
        class="command-palette"
        :style="palettePosition"
      >
        <div class="palette-header">
          <span class="palette-icon">/</span>
          <input
            v-model="commandQuery"
            type="text"
            class="palette-input"
            placeholder="matrix, sigma, fraction, sqrt..."
            @keydown="handlePaletteKeydown"
            @click.stop
            ref="paletteInputRef"
          />
        </div>
        <div class="palette-list">
          <div class="palette-category" v-if="filteredCommandsByCategory.length > 0">
            <template v-for="group in filteredCommandsByCategory" :key="group.category">
              <div class="palette-category-label">{{ group.label }}</div>
              <div
                v-for="cmd in group.commands"
                :key="cmd.id"
                class="palette-item"
                :class="{ selected: cmd.id === selectedCommandId }"
                @click="executeCommand(cmd)"
                @mouseenter="selectedCommandId = cmd.id"
              >
                <span class="cmd-icon">{{ cmd.icon }}</span>
                <div class="cmd-info">
                  <span class="cmd-name">{{ cmd.name }}</span>
                  <span class="cmd-desc">{{ cmd.description }}</span>
                </div>
              </div>
            </template>
          </div>
          <div v-else class="palette-empty">No matching commands</div>
        </div>
      </div>
    </div>

    <!-- RIGHT SIDEBAR: Enhanced Keypad -->
    <div class="sidebar-right">
      <div class="keypad">
        <div class="keypad-section">
          <h4>Greek Letters</h4>
          <div class="keypad-grid">
            <button class="keypad-btn" @click="insertMathSymbol('alpha')" title="alpha">&alpha;</button>
            <button class="keypad-btn" @click="insertMathSymbol('beta')" title="beta">&beta;</button>
            <button class="keypad-btn" @click="insertMathSymbol('gamma')" title="gamma">&gamma;</button>
            <button class="keypad-btn" @click="insertMathSymbol('delta')" title="delta">&delta;</button>
            <button class="keypad-btn" @click="insertMathSymbol('theta')" title="theta">&theta;</button>
            <button class="keypad-btn" @click="insertMathSymbol('lambda')" title="lambda">&lambda;</button>
            <button class="keypad-btn" @click="insertMathSymbol('sigma')" title="sigma">&Sigma;</button>
            <button class="keypad-btn" @click="insertMathSymbol('pi')" title="pi">&pi;</button>
          </div>
        </div>

        <div class="keypad-section">
          <h4>Operators</h4>
          <div class="keypad-grid">
            <button class="keypad-btn" @click="insertMathSymbol('plus')" title="plus">+</button>
            <button class="keypad-btn" @click="insertMathSymbol('minus')" title="minus">&minus;</button>
            <button class="keypad-btn" @click="insertMathSymbol('times')" title="times">&times;</button>
            <button class="keypad-btn" @click="insertMathSymbol('divide')" title="divide">&divide;</button>
            <button class="keypad-btn" @click="insertMathSymbol('equals')" title="equals">=</button>
            <button class="keypad-btn" @click="insertMathSymbol('approx')" title="approximately">&asymp;</button>
            <button class="keypad-btn" @click="insertMathSymbol('leq')" title="less than or equal">&le;</button>
            <button class="keypad-btn" @click="insertMathSymbol('geq')" title="greater than or equal">&ge;</button>
          </div>
        </div>

        <div class="keypad-section">
          <h4>Math Functions</h4>
          <div class="keypad-grid">
            <button class="keypad-btn" @click="insertMathSymbol('sqrt')" title="square root">&radic;</button>
            <button class="keypad-btn" @click="insertMathSymbol('integral')" title="integral">&int;</button>
            <button class="keypad-btn" @click="insertMathSymbol('sum')" title="summation">&sum;</button>
            <button class="keypad-btn keypad-btn-text" @click="insertMathSymbol('fraction')" title="fraction">a/b</button>
            <button class="keypad-btn keypad-btn-text" @click="insertMathSymbol('power')" title="power">x^n</button>
            <button class="keypad-btn keypad-btn-text" @click="insertMathSymbol('subscript')" title="subscript">x_n</button>
          </div>
        </div>

        <div class="keypad-section">
          <h4>Matrices</h4>
          <div class="keypad-grid">
            <button class="keypad-btn keypad-btn-text" @click="insertMatrix(2, 2)">2&times;2</button>
            <button class="keypad-btn keypad-btn-text" @click="insertMatrix(2, 3)">2&times;3</button>
            <button class="keypad-btn keypad-btn-text" @click="insertMatrix(3, 2)">3&times;2</button>
            <button class="keypad-btn keypad-btn-text" @click="insertMatrix(3, 3)">3&times;3</button>
            <button class="keypad-btn keypad-btn-text" @click="insertMatrix(4, 4)">4&times;4</button>
          </div>
        </div>

        <div class="keypad-section">
          <h4>Keyboard Shortcuts</h4>
          <div class="shortcuts-list">
            <div class="shortcut-item"><kbd>/</kbd> <span>Commands</span></div>
            <div class="shortcut-item"><kbd>&#x2191;&#x2193;&#x2190;&#x2192;</kbd> <span>Navigate</span></div>
            <div class="shortcut-item"><kbd>Esc</kbd> <span>Exit matrix</span></div>
            <div class="shortcut-item"><kbd>Enter</kbd> <span>New line</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useNotesStore } from '../stores/notesStore';
import { useEditorStore } from '../stores/editorStore';
import MathExpression from './MathExpression.vue';
import { createMathExpression, isDisplayModeSymbol } from '../utils/latexMapping';
import type { CursorPosition, TextLine, MatrixLine, MathExpressionLine, Command, SymbolSpan } from '../types/editor';

const notesStore = useNotesStore();
const editorStore = useEditorStore();
const hiddenInput = ref<HTMLInputElement | null>(null);
const paletteInputRef = ref<HTMLInputElement | null>(null);

// STATE: Document and cursor
const document = computed(() => notesStore.document);

const cursor = ref<CursorPosition>({
  zone: 'text',
  lineId: '',
  charOffset: 0
});

// UI state
const commandQuery = ref('');
const showCommandPalette = ref(false);
const selectedCommandId = ref('');

// Initialize
onMounted(() => {
  editorStore.initTheme();
  notesStore.init();
  if (document.value.length > 0) {
    cursor.value = {
      zone: 'text',
      lineId: document.value[0].id,
      charOffset: 0
    };
  }
  nextTick(() => {
    hiddenInput.value?.focus();
  });
});

// ─── Commands ──────────────────────────────────────────────
const commands: Command[] = [
  // Greek letters
  { id: 'sigma', name: 'sigma', description: '\u03A3 uppercase sigma', category: 'symbol', icon: '\u03A3' },
  { id: 'sum', name: 'sum / summation', description: '\u2211 summation', category: 'symbol', icon: '\u2211' },
  { id: 'integral', name: 'integral', description: '\u222B integral', category: 'symbol', icon: '\u222B' },
  { id: 'pi', name: 'pi', description: '\u03C0 pi', category: 'symbol', icon: '\u03C0' },
  { id: 'alpha', name: 'alpha', description: '\u03B1 alpha', category: 'symbol', icon: '\u03B1' },
  { id: 'beta', name: 'beta', description: '\u03B2 beta', category: 'symbol', icon: '\u03B2' },
  { id: 'gamma', name: 'gamma', description: '\u03B3 gamma', category: 'symbol', icon: '\u03B3' },
  { id: 'delta', name: 'delta', description: '\u03B4 delta', category: 'symbol', icon: '\u03B4' },
  { id: 'theta', name: 'theta', description: '\u03B8 theta', category: 'symbol', icon: '\u03B8' },
  { id: 'lambda', name: 'lambda', description: '\u03BB lambda', category: 'symbol', icon: '\u03BB' },

  // Operators
  { id: 'plus', name: 'plus', description: '+ addition', category: 'operator', icon: '+' },
  { id: 'minus', name: 'minus', description: '\u2212 subtraction', category: 'operator', icon: '\u2212' },
  { id: 'times', name: 'times', description: '\u00D7 multiplication', category: 'operator', icon: '\u00D7' },
  { id: 'divide', name: 'divide', description: '\u00F7 division', category: 'operator', icon: '\u00F7' },
  { id: 'equals', name: 'equals', description: '= equals', category: 'operator', icon: '=' },
  { id: 'approx', name: 'approx', description: '\u2248 approximately equal', category: 'operator', icon: '\u2248' },
  { id: 'leq', name: 'less-equal', description: '\u2264 less than or equal', category: 'operator', icon: '\u2264' },
  { id: 'geq', name: 'greater-equal', description: '\u2265 greater than or equal', category: 'operator', icon: '\u2265' },
  { id: 'infinity', name: 'infinity', description: '\u221E infinity', category: 'operator', icon: '\u221E' },

  // Math structures
  { id: 'fraction', name: 'fraction', description: 'a/b fraction', category: 'math', icon: '\u2044' },
  { id: 'sqrt', name: 'sqrt / square root', description: '\u221A square root', category: 'math', icon: '\u221A' },
  { id: 'power', name: 'power / exponent', description: 'x^n exponent', category: 'math', icon: '^' },
  { id: 'subscript', name: 'subscript', description: 'x_n subscript', category: 'math', icon: '_' },
  { id: 'sum-full', name: 'summation (full)', description: '\u2211 with bounds i=1 to n', category: 'math', icon: '\u2211' },
  { id: 'integral-full', name: 'integral (full)', description: '\u222B with bounds a to b', category: 'math', icon: '\u222B' },
  { id: 'limit', name: 'limit', description: 'lim as x approaches', category: 'math', icon: 'lim' },

  // Matrices
  { id: 'matrix-2x2', name: 'matrix 2\u00D72', description: 'Insert 2\u00D72 matrix', category: 'matrix', icon: '\u229E' },
  { id: 'matrix-2x3', name: 'matrix 2\u00D73', description: 'Insert 2\u00D73 matrix', category: 'matrix', icon: '\u229E' },
  { id: 'matrix-3x2', name: 'matrix 3\u00D72', description: 'Insert 3\u00D72 matrix', category: 'matrix', icon: '\u229E' },
  { id: 'matrix-3x3', name: 'matrix 3\u00D73', description: 'Insert 3\u00D73 matrix', category: 'matrix', icon: '\u229E' },
  { id: 'matrix-4x4', name: 'matrix 4\u00D74', description: 'Insert 4\u00D74 matrix', category: 'matrix', icon: '\u229E' },
];

const filteredCommands = computed(() => {
  if (!commandQuery.value) return commands;
  const query = commandQuery.value.toLowerCase();
  return commands.filter(cmd =>
    cmd.name.toLowerCase().includes(query) ||
    cmd.description.toLowerCase().includes(query) ||
    cmd.id.toLowerCase().includes(query)
  );
});

// Grouped commands by category for display
const filteredCommandsByCategory = computed(() => {
  const cmds = filteredCommands.value;
  if (cmds.length === 0) return [];

  const categoryLabels: Record<string, string> = {
    'symbol': 'Greek Letters',
    'operator': 'Operators',
    'math': 'Math Structures',
    'matrix': 'Matrices',
    'insert': 'Insert',
  };

  const categories = ['symbol', 'operator', 'math', 'matrix', 'insert'];
  const groups: Array<{ category: string; label: string; commands: Command[] }> = [];

  for (const cat of categories) {
    const catCommands = cmds.filter(c => c.category === cat);
    if (catCommands.length > 0) {
      groups.push({
        category: cat,
        label: categoryLabels[cat] || cat,
        commands: catCommands,
      });
    }
  }

  // Set default selected if needed
  if (groups.length > 0 && !cmds.find(c => c.id === selectedCommandId.value)) {
    selectedCommandId.value = groups[0].commands[0].id;
  }

  return groups;
});

// Palette position
const palettePosition = computed(() => {
  const lineEl = window.document.querySelector(`[data-line-id="${cursor.value.lineId}"]`);
  if (!lineEl) return {};
  const rect = lineEl.getBoundingClientRect();
  return {
    position: 'fixed' as const,
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`
  };
});

// ─── Helper functions ──────────────────────────────────────
function flattenMatrix(line: MatrixLine) {
  const cells: Array<{ row: number, col: number, value: string }> = [];
  for (let r = 0; r < line.rows; r++) {
    for (let c = 0; c < line.cols; c++) {
      cells.push({ row: r, col: c, value: line.data[r][c] });
    }
  }
  return cells;
}

function gridStyle(line: MatrixLine) {
  const cellWidth = line.cols > 3 ? '38px' : '45px';
  const cellHeight = '32px';
  return {
    gridTemplateColumns: `repeat(${line.cols}, ${cellWidth})`,
    gridTemplateRows: `repeat(${line.rows}, ${cellHeight})`,
    gap: '0'
  };
}

function bracketHeight(line: MatrixLine) {
  const cellHeight = 32;
  const padding = 6;
  const totalHeight = (line.rows * cellHeight) + padding;
  return `${totalHeight}px`;
}

// ─── KEYBOARD HANDLING ─────────────────────────────────────
function handleKeydown(event: KeyboardEvent) {
  if (showCommandPalette.value) {
    return; // Let palette input handle it
  }

  if (event.key === '/') {
    showCommandPalette.value = true;
    commandQuery.value = '';
    selectedCommandId.value = commands[0]?.id || '';
    event.preventDefault();
    nextTick(() => {
      paletteInputRef.value?.focus();
    });
    return;
  }

  if (event.key === 'Enter') {
    insertNewLine();
    event.preventDefault();
    return;
  }

  if (event.key === 'Backspace') {
    deleteCharAtCursor();
    event.preventDefault();
    return;
  }

  if (event.key === 'ArrowUp') {
    handleArrowUp();
    event.preventDefault();
    return;
  }

  if (event.key === 'ArrowDown') {
    handleArrowDown();
    event.preventDefault();
    return;
  }

  if (event.key === 'ArrowLeft') {
    handleArrowLeft();
    event.preventDefault();
    return;
  }

  if (event.key === 'ArrowRight') {
    handleArrowRight();
    event.preventDefault();
    return;
  }

  if (event.key === 'Escape') {
    if (cursor.value.zone === 'matrix') {
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId);
      if (lineIndex < document.value.length - 1) {
        const nextLine = document.value[lineIndex + 1];
        cursor.value = { zone: 'text', lineId: nextLine.id, charOffset: 0 };
      } else {
        insertNewLine();
      }
    }
    event.preventDefault();
    return;
  }
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const char = target.value;

  if (char && char.length > 0) {
    if (cursor.value.zone === 'text') {
      insertCharAtCursor(char);
    } else if (cursor.value.zone === 'matrix') {
      insertCharInMatrix(char);
    }
  }

  target.value = '';
}

function handleBlur() {
  if (!showCommandPalette.value) {
    nextTick(() => {
      hiddenInput.value?.focus();
    });
  }
}

function handleFocus() {
  // Hidden input is always focused
}

// ─── Navigation ────────────────────────────────────────────
function handleArrowUp() {
  if (cursor.value.zone === 'matrix') {
    if (cursor.value.row > 0) {
      cursor.value = { ...cursor.value, row: cursor.value.row - 1 };
    } else {
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId);
      if (lineIndex > 0) {
        const prevLine = document.value[lineIndex - 1];
        cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 };
      }
    }
  } else {
    const currentLineIndex = notesStore.getLineIndex(cursor.value.lineId);
    if (currentLineIndex > 0) {
      const prevLine = document.value[currentLineIndex - 1];
      if (prevLine.type === 'matrix') {
        cursor.value = { zone: 'matrix', lineId: prevLine.id, row: (prevLine as MatrixLine).rows - 1, col: 0 };
      } else {
        cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 };
      }
    }
  }
}

function handleArrowDown() {
  if (cursor.value.zone === 'matrix') {
    const line = notesStore.getLineById(cursor.value.lineId) as MatrixLine;
    if (cursor.value.row < line.rows - 1) {
      cursor.value = { ...cursor.value, row: cursor.value.row + 1 };
    } else {
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId);
      if (lineIndex < document.value.length - 1) {
        const nextLine = document.value[lineIndex + 1];
        cursor.value = { zone: 'text', lineId: nextLine.id, charOffset: 0 };
      } else {
        insertNewLine();
      }
    }
  } else {
    const currentLineIndex = notesStore.getLineIndex(cursor.value.lineId);
    if (currentLineIndex < document.value.length - 1) {
      const nextLine = document.value[currentLineIndex + 1];
      if (nextLine.type === 'matrix') {
        cursor.value = { zone: 'matrix', lineId: nextLine.id, row: 0, col: 0 };
      } else {
        cursor.value = { zone: 'text', lineId: nextLine.id, charOffset: 0 };
      }
    }
  }
}

function handleArrowLeft() {
  if (cursor.value.zone === 'text') {
    if (cursor.value.charOffset > 0) {
      cursor.value = { ...cursor.value, charOffset: cursor.value.charOffset - 1 };
    }
  } else if (cursor.value.zone === 'matrix') {
    const line = notesStore.getLineById(cursor.value.lineId) as MatrixLine;
    if (cursor.value.col > 0) {
      cursor.value = { ...cursor.value, col: cursor.value.col - 1 };
    } else if (cursor.value.row > 0) {
      cursor.value = { ...cursor.value, row: cursor.value.row - 1, col: line.cols - 1 };
    } else {
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId);
      if (lineIndex > 0) {
        const prevLine = document.value[lineIndex - 1];
        cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 };
      }
    }
  }
}

function handleArrowRight() {
  if (cursor.value.zone === 'text') {
    const currentLine = notesStore.getLineById(cursor.value.lineId) as TextLine;
    if (currentLine && currentLine.type === 'text') {
      const lineLength = currentLine.content.reduce((sum, seg) => sum + (seg.type === 'text' ? seg.value.length : 1), 0);
      if (cursor.value.charOffset < lineLength) {
        cursor.value = { ...cursor.value, charOffset: cursor.value.charOffset + 1 };
      }
    }
  } else if (cursor.value.zone === 'matrix') {
    const line = notesStore.getLineById(cursor.value.lineId) as MatrixLine;
    if (cursor.value.col < line.cols - 1) {
      cursor.value = { ...cursor.value, col: cursor.value.col + 1 };
    } else if (cursor.value.row < line.rows - 1) {
      cursor.value = { ...cursor.value, row: cursor.value.row + 1, col: 0 };
    } else {
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId);
      if (lineIndex < document.value.length - 1) {
        const nextLine = document.value[lineIndex + 1];
        cursor.value = { zone: 'text', lineId: nextLine.id, charOffset: 0 };
      } else {
        insertNewLine();
      }
    }
  }
}

// ─── Insertion operations ──────────────────────────────────
function insertCharAtCursor(char: string) {
  if (cursor.value.zone !== 'text') return;

  const currentLine = notesStore.getLineById(cursor.value.lineId);
  if (!currentLine || currentLine.type !== 'text') return;
  const textLine = currentLine as TextLine;

  const lastSegment = textLine.content[textLine.content.length - 1];
  if (lastSegment?.type === 'text') {
    lastSegment.value += char;
  } else {
    textLine.content.push({ type: 'text', value: char });
  }

  cursor.value = { ...cursor.value, charOffset: cursor.value.charOffset + 1 };
  updateDocument();
}

function insertCharInMatrix(char: string) {
  if (cursor.value.zone !== 'matrix') return;

  const line = notesStore.getLineById(cursor.value.lineId) as MatrixLine;
  if (!line) return;

  line.data[cursor.value.row][cursor.value.col] = char;

  if (cursor.value.col < line.cols - 1) {
    cursor.value = { ...cursor.value, col: cursor.value.col + 1 };
  } else if (cursor.value.row < line.rows - 1) {
    cursor.value = { ...cursor.value, row: cursor.value.row + 1, col: 0 };
  }

  updateDocument();
}

function deleteCharAtCursor() {
  if (cursor.value.zone === 'text') {
    const currentLine = notesStore.getLineById(cursor.value.lineId);
    if (!currentLine) return;

    // Handle math expression line deletion
    if (currentLine.type === 'math') {
      deleteMathExpression(cursor.value.lineId);
      return;
    }

    if (currentLine.type !== 'text') return;
    const textLine = currentLine as TextLine;

    const lastSegment = textLine.content[textLine.content.length - 1];

    if (lastSegment?.type === 'text' && lastSegment.value.length > 0) {
      lastSegment.value = lastSegment.value.slice(0, -1);
      cursor.value = { ...cursor.value, charOffset: Math.max(0, cursor.value.charOffset - 1) };
      updateDocument();
    } else if (lastSegment?.type === 'symbol') {
      textLine.content.pop();
      cursor.value = { ...cursor.value, charOffset: Math.max(0, cursor.value.charOffset - 1) };
      updateDocument();
    } else if (textLine.content.length === 1 &&
               textLine.content[0].type === 'text' &&
               textLine.content[0].value === '' &&
               notesStore.activeNote &&
               notesStore.activeNote.content.length > 1) {
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId);
      notesStore.activeNote.content.splice(lineIndex, 1);

      if (lineIndex > 0) {
        const prevLine = document.value[lineIndex - 1];
        if (prevLine.type === 'matrix') {
          cursor.value = { zone: 'matrix', lineId: prevLine.id, row: 0, col: 0 };
        } else {
          cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 };
        }
      } else if (document.value.length > 0) {
        cursor.value = { zone: 'text', lineId: document.value[0].id, charOffset: 0 };
      }
      updateDocument();
    }
  } else if (cursor.value.zone === 'matrix') {
    const line = notesStore.getLineById(cursor.value.lineId) as MatrixLine;
    if (!line) return;

    const isEmpty = line.data.every(row => row.every(cell => cell === ''));

    if (isEmpty && notesStore.activeNote && notesStore.activeNote.content.length > 1) {
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId);
      notesStore.activeNote.content.splice(lineIndex, 1);

      if (lineIndex > 0) {
        const prevLine = document.value[lineIndex - 1];
        cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 };
      } else if (document.value.length > 0) {
        cursor.value = { zone: 'text', lineId: document.value[0].id, charOffset: 0 };
      }
      updateDocument();
    } else {
      line.data[cursor.value.row][cursor.value.col] = '';
      updateDocument();
    }
  }
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
    cursor.value = { zone: 'text', lineId: newLine.id, charOffset: 0 };
  }
}

function insertSymbol(symbolId: SymbolSpan['value']) {
  if (cursor.value.zone !== 'text') return;

  const symbolMap: Record<string, { value: SymbolSpan['value']; display: string }> = {
    'sigma': { value: 'sigma', display: '\u03A3' },
    'sum': { value: 'sum', display: '\u2211' },
    'integral': { value: 'integral', display: '\u222B' },
    'sqrt': { value: 'sqrt', display: '\u221A' },
    'pi': { value: 'pi', display: '\u03C0' },
    'theta': { value: 'theta', display: '\u03B8' },
    'alpha': { value: 'alpha', display: '\u03B1' },
    'beta': { value: 'beta', display: '\u03B2' },
    'gamma': { value: 'gamma', display: '\u03B3' },
    'delta': { value: 'delta', display: '\u03B4' },
    'lambda': { value: 'lambda', display: '\u03BB' },
    'plus': { value: 'plus', display: '+' },
    'minus': { value: 'minus', display: '\u2212' },
    'times': { value: 'times', display: '\u00D7' },
    'divide': { value: 'divide', display: '\u00F7' },
    'equals': { value: 'equals', display: '=' },
    'approx': { value: 'approx', display: '\u2248' },
    'leq': { value: 'leq', display: '\u2264' },
    'geq': { value: 'geq', display: '\u2265' },
    'infinity': { value: 'infinity', display: '\u221E' },
  };

  const sym = symbolMap[symbolId];
  if (!sym) return;

  const currentLine = notesStore.getLineById(cursor.value.lineId);
  if (currentLine && currentLine.type === 'text') {
    (currentLine as TextLine).content.push({
      type: 'symbol',
      value: sym.value,
      display: sym.display
    });
    cursor.value = { ...cursor.value, charOffset: cursor.value.charOffset + 1 };
    updateDocument();
  }

  closeCommandPalette();
}

// Insert a math expression (KaTeX rendered) line
function insertMathSymbol(symbolId: string) {
  // Math structures get their own KaTeX-rendered line
  const mathStructures = ['fraction', 'sqrt', 'power', 'subscript', 'sum-full', 'integral-full', 'limit'];

  if (mathStructures.includes(symbolId)) {
    const lineIndex = notesStore.getLineIndex(cursor.value.lineId);
    const displayMode = isDisplayModeSymbol(symbolId);
    const mathLine = createMathExpression(symbolId, displayMode);

    if (notesStore.activeNote) {
      notesStore.activeNote.content.splice(lineIndex + 1, 0, mathLine);
      updateDocument();
      cursor.value = {
        zone: 'text',
        lineId: mathLine.id,
        charOffset: 0
      };
    }
    closeCommandPalette();
  } else {
    // Simple symbols get inserted as inline symbols on the current text line
    insertSymbol(symbolId as SymbolSpan['value']);
  }
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

  if (notesStore.activeNote) {
    notesStore.activeNote.content.splice(lineIndex + 1, 0, newMatrixLine);
    updateDocument();

    cursor.value = {
      zone: 'matrix',
      lineId: newMatrixLine.id,
      row: 0,
      col: 0
    };
  }

  closeCommandPalette();
}

// ─── Math expression operations ────────────────────────────
function focusMathExpression(lineId: string) {
  cursor.value = {
    zone: 'text',
    lineId,
    charOffset: 0
  };
}

function updateMathLatex(lineId: string, latex: string) {
  const line = notesStore.getLineById(lineId);
  if (line && line.type === 'math') {
    (line as MathExpressionLine).latex = latex;
    updateDocument();
  }
}

function blurMathExpression() {
  nextTick(() => {
    hiddenInput.value?.focus();
  });
}

function deleteMathExpression(lineId: string) {
  if (!notesStore.activeNote || notesStore.activeNote.content.length <= 1) return;

  const lineIndex = notesStore.getLineIndex(lineId);
  notesStore.activeNote.content.splice(lineIndex, 1);

  if (lineIndex > 0) {
    const prevLine = document.value[lineIndex - 1];
    if (prevLine.type === 'matrix') {
      cursor.value = { zone: 'matrix', lineId: prevLine.id, row: 0, col: 0 };
    } else {
      cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 };
    }
  } else if (document.value.length > 0) {
    cursor.value = { zone: 'text', lineId: document.value[0].id, charOffset: 0 };
  }

  updateDocument();
  nextTick(() => {
    hiddenInput.value?.focus();
  });
}

function focusMatrixCell(lineId: string, row: number, col: number) {
  cursor.value = {
    zone: 'matrix',
    lineId,
    row,
    col
  };
  hiddenInput.value?.focus();
}

// ─── Display click handling (fixed for empty lines) ────────
function handleDisplayClick(event: MouseEvent) {
  const target = event.target as HTMLElement;

  // Click on matrix cell
  if (target.classList.contains('matrix-cell-textbook')) {
    const cellEl = target;
    const lineEl = cellEl.closest('[data-line-id]');
    if (lineEl) {
      const lineId = lineEl.getAttribute('data-line-id');
      const row = parseInt(cellEl.getAttribute('data-row') || '0');
      const col = parseInt(cellEl.getAttribute('data-col') || '0');
      if (lineId) {
        focusMatrixCell(lineId, row, col);
      }
    }
    return;
  }

  // Click on a math expression container - let the MathExpression component handle it
  const mathExprEl = target.closest('.math-expression');
  if (mathExprEl) {
    return;
  }

  // Click on text line (including empty lines) - set cursor to that line
  const lineEl = target.closest('.container-line');
  if (lineEl) {
    const lineId = lineEl.getAttribute('data-line-id');
    if (lineId) {
      const line = notesStore.getLineById(lineId);
      if (line && line.type === 'matrix') {
        focusMatrixCell(lineId, 0, 0);
      } else {
        cursor.value = {
          zone: 'text',
          lineId: lineId,
          charOffset: 0
        };
      }
      hiddenInput.value?.focus();
    }
    return;
  }

  // Click in empty editor space (below all lines) - focus last line
  const editorDisplay = target.closest('.editor-display');
  if (editorDisplay && document.value.length > 0) {
    const lastLine = document.value[document.value.length - 1];
    if (lastLine.type === 'matrix') {
      cursor.value = { zone: 'matrix', lineId: lastLine.id, row: 0, col: 0 };
    } else {
      cursor.value = { zone: 'text', lineId: lastLine.id, charOffset: 0 };
    }
    hiddenInput.value?.focus();
    return;
  }

  // Fallback
  hiddenInput.value?.focus();
}

function handleMouseMove(_event: MouseEvent) {
  // Could use for text selection later
}

// ─── Command palette ───────────────────────────────────────
function handlePaletteKeydown(event: KeyboardEvent) {
  const allCommands = filteredCommands.value;
  const currentIndex = allCommands.findIndex(c => c.id === selectedCommandId.value);

  if (event.key === 'ArrowDown') {
    const nextIndex = Math.min(currentIndex + 1, allCommands.length - 1);
    selectedCommandId.value = allCommands[nextIndex]?.id || '';
    scrollSelectedIntoView();
    event.preventDefault();
  } else if (event.key === 'ArrowUp') {
    const prevIndex = Math.max(currentIndex - 1, 0);
    selectedCommandId.value = allCommands[prevIndex]?.id || '';
    scrollSelectedIntoView();
    event.preventDefault();
  } else if (event.key === 'Enter') {
    const cmd = allCommands.find(c => c.id === selectedCommandId.value);
    if (cmd) {
      executeCommand(cmd);
    }
    event.preventDefault();
  } else if (event.key === 'Escape') {
    closeCommandPalette();
    event.preventDefault();
  }
}

function scrollSelectedIntoView() {
  nextTick(() => {
    const selected = window.document.querySelector('.palette-item.selected');
    selected?.scrollIntoView({ block: 'nearest' });
  });
}

function executeCommand(cmd: Command) {
  if (cmd.id.startsWith('matrix-')) {
    const [, size] = cmd.id.split('-');
    const [rows, cols] = size.split('x').map(Number);
    insertMatrix(rows, cols);
  } else if (cmd.category === 'math') {
    insertMathSymbol(cmd.id);
  } else if (cmd.category === 'symbol' || cmd.category === 'operator') {
    insertMathSymbol(cmd.id);
  }
}

function closeCommandPalette() {
  showCommandPalette.value = false;
  commandQuery.value = '';
  hiddenInput.value?.focus();
}

// ─── Utility functions ─────────────────────────────────────
function createNewNote() {
  notesStore.createNote();
}

function toggleTheme() {
  editorStore.toggleTheme();
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
  return new Date(timestamp).toLocaleDateString();
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
</script>

<style scoped>
.math-writer {
  display: grid;
  grid-template-columns: 250px 1fr 280px;
  height: 100vh;
  background: var(--color-bg-primary);
}

/* Hidden input - captures keyboard but never visible */
.hidden-input {
  position: absolute;
  left: -9999px;
  top: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

/* LEFT SIDEBAR */
.sidebar-left {
  border-right: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-theme-toggle {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.btn-theme-toggle:hover {
  background: var(--color-accent-light);
  border-color: var(--color-accent);
}

.btn-new-note {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-accent);
  cursor: pointer;
  transition: all 0.2s;
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
  transition: background 0.2s;
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
  margin-bottom: 4px;
}

.note-date {
  display: block;
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* CENTER: EDITOR */
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
  outline: none;
}

/* CRITICAL: Display layer is read-only HTML */
.editor-display {
  flex: 1;
  padding: 32px 40px;
  padding-left: 60px;
  overflow-y: auto;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 16px;
  line-height: 1.7;
  color: var(--color-text-primary);
  outline: none;
  user-select: none;
  position: relative;
  background: var(--color-bg-primary);
  min-height: 200px;
}

/* Container lines */
.container-line {
  display: block;
  min-height: 1.7em;
  position: relative;
  word-wrap: break-word;
  margin: 8px 0;
  padding: 2px 0;
  cursor: text;
}

.container-line::before {
  content: attr(data-line-number);
  position: absolute;
  left: -48px;
  font-size: 12px;
  color: #999;
  text-align: right;
  width: 32px;
}

/* Text segments */
.text-segment {
  display: inline;
  font-family: inherit;
  font-size: inherit;
}

.symbol {
  display: inline;
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: 20px;
  margin: 0 3px;
  vertical-align: -2px;
}

/* Empty line placeholder - ensures clickable area */
.empty-line-placeholder {
  display: inline-block;
  width: 100%;
  min-height: 1.7em;
  vertical-align: baseline;
}

/* Math expression line styling */
.container-line.is-math-line {
  min-height: auto;
}

/* CRITICAL: Matrix is INLINE */
.matrix-inline {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  vertical-align: middle;
  margin: 0 6px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  font-family: inherit;
}

.matrix-inline.is-editing {
  opacity: 1;
}

.matrix-bracket {
  width: 14px;
  flex-shrink: 0;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.matrix-bracket svg {
  width: 100%;
  height: 100%;
  stroke-linecap: round;
}

.matrix-grid {
  display: inline-grid;
  grid-auto-flow: row;
  gap: 0;
  padding: 0;
  margin: 0;
}

.matrix-cell-textbook {
  min-width: 45px;
  min-height: 32px;
  padding: 6px 8px;
  font-family: inherit;
  font-size: 15px;
  text-align: center;
  background: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  color: var(--color-text-primary);
  user-select: none;
  cursor: text;
  outline: none;
  transition: all 0.15s;
}

.matrix-cell-textbook.is-active {
  background: rgba(33, 150, 243, 0.08);
  border-bottom: 2px solid #2196F3;
  padding: 6px 8px;
  font-weight: 500;
}

.matrix-cell-textbook:hover {
  background: rgba(0, 0, 0, 0.02);
}

/* Custom caret */
.custom-caret {
  display: inline-block;
  width: 2px;
  height: 1.3em;
  background: #2196F3;
  margin: 0 1px;
  animation: blink 1s infinite;
  vertical-align: -2px;
}

@keyframes blink {
  0%, 49%, 100% { opacity: 1; }
  50%, 99% { opacity: 0; }
}

/* Command palette */
.command-palette {
  position: fixed;
  z-index: 1000;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  min-width: 420px;
  max-height: 440px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.palette-header {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-secondary);
}

.palette-icon {
  font-size: 16px;
  color: var(--color-accent);
  margin-right: 8px;
  font-weight: bold;
}

.palette-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  background: transparent;
  font-family: inherit;
  color: var(--color-text-primary);
}

.palette-input::placeholder {
  color: var(--color-text-disabled);
}

.palette-list {
  flex: 1;
  overflow-y: auto;
  max-height: 360px;
}

.palette-category-label {
  padding: 6px 12px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-tertiary);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-light);
  position: sticky;
  top: 0;
}

.palette-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-primary);
}

.palette-item:last-child {
  border-bottom: none;
}

.palette-item:hover {
  background: var(--color-bg-hover);
}

.palette-item.selected {
  background: var(--color-accent-light);
  border-left: 3px solid var(--color-accent);
}

.palette-empty {
  padding: 16px;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.cmd-icon {
  font-size: 20px;
  margin-right: 12px;
  min-width: 28px;
  text-align: center;
  color: var(--color-text-secondary);
}

.cmd-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.cmd-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.cmd-desc {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 1px;
}

/* RIGHT SIDEBAR */
.sidebar-right {
  border-left: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  overflow-y: auto;
  padding: var(--spacing-md);
}

.keypad {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.keypad-section h4 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-tertiary);
  font-weight: 700;
}

.keypad-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.keypad-btn {
  padding: 8px 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  cursor: pointer;
  transition: all 0.15s;
  font-size: 18px;
  text-align: center;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.keypad-btn:hover {
  background: var(--color-accent-light);
  border-color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.keypad-btn:active {
  transform: translateY(0);
  box-shadow: none;
}

.keypad-btn-text {
  font-size: 12px;
  font-weight: 600;
  font-family: 'Georgia', 'Times New Roman', serif;
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
  font-size: 12px;
}

.shortcut-item kbd {
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 2px;
}

/* Line highlighting */
.container-line.is-active {
  background: rgba(100, 150, 255, 0.03);
  padding: 0 4px;
  border-radius: 2px;
}
</style>
