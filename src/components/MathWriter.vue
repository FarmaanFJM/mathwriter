<template>
  <div class="math-writer">
    <!-- LEFT SIDEBAR: Notes Panel -->
    <div class="sidebar-left">
      <div class="sidebar-header">
        <h3>Notes</h3>
        <div class="header-actions">
          <button class="btn-theme-toggle" @click="toggleTheme" :title="`Switch to ${editorStore.theme === 'light' ? 'dark' : 'light'} mode`">
            <span v-if="editorStore.theme === 'light'">🌙</span>
            <span v-else>☀️</span>
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
          :class="{ 'is-active': cursor.lineId === line.id }"
          :data-line-id="line.id"
          :data-line-index="lineIndex"
          :data-line-number="lineIndex + 1"
        >
          <!-- Text line -->
          <template v-if="line.type === 'text'">
            <span 
              v-for="(segment, idx) in line.content"
              :key="`${line.id}-${idx}`"
              class="text-segment"
            >
              <template v-if="segment.type === 'text'">{{ segment.value }}</template>
              <span v-else class="symbol">{{ segment.display }}</span>
            </span>

            <span
              v-if="line.content.length === 1 && line.content[0].type === 'text' && line.content[0].value === ''"
              class="empty-line-placeholder"
            ></span>
            
            <!-- Custom caret in text -->
            <span 
              v-if="cursor.zone === 'text' && cursor.lineId === line.id"
              class="custom-caret"
            ></span>
          </template>

          <template v-else-if="line.type === 'math'">
            <MathExpression
              :line="line as MathExpressionLine"
              :is-active="cursor.lineId === line.id"
              @focus="focusMathExpression(line.id)"
              @update="updateMathLatex(line.id, $event)"
              @blur="blurMathExpression"
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
            <div class="matrix-bracket bracket-left" :style="{ height: bracketHeight(line) }">
              <svg viewBox="0 0 20 100" preserveAspectRatio="none">
                <path d="M 15 0 L 5 0 L 5 100 L 15 100" fill="none" stroke="currentColor" stroke-width="2.5"/>
              </svg>
            </div>

            <!-- Grid -->
            <div class="matrix-grid" :style="gridStyle(line)">
              <div
                v-for="(cell, cellIdx) in flattenMatrix(line)"
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
            <div class="matrix-bracket bracket-right" :style="{ height: bracketHeight(line) }">
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
            placeholder="matrix, sigma, sqrt..."
            @keydown="handlePaletteKeydown"
            @click.stop
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

    <!-- RIGHT SIDEBAR: Keypad -->
    <div class="sidebar-right">
      <div class="keypad">
        <div class="keypad-section">
          <h4>Greek Letters</h4>
          <div class="keypad-grid">
            <button class="keypad-btn" @click="insertMathSymbol('alpha')" title="α">α</button>
            <button class="keypad-btn" @click="insertMathSymbol('beta')" title="β">β</button>
            <button class="keypad-btn" @click="insertMathSymbol('gamma')" title="γ">γ</button>
            <button class="keypad-btn" @click="insertMathSymbol('delta')" title="δ">δ</button>
            <button class="keypad-btn" @click="insertMathSymbol('theta')" title="θ">θ</button>
            <button class="keypad-btn" @click="insertMathSymbol('lambda')" title="λ">λ</button>
            <button class="keypad-btn" @click="insertMathSymbol('sigma')" title="Σ">Σ</button>
            <button class="keypad-btn" @click="insertMathSymbol('pi')" title="π">π</button>
          </div>
        </div>

        <div class="keypad-section">
          <h4>Operators</h4>
          <div class="keypad-grid">
            <button class="keypad-btn" @click="insertMathSymbol('plus')" title="+">+</button>
            <button class="keypad-btn" @click="insertMathSymbol('minus')" title="−">−</button>
            <button class="keypad-btn" @click="insertMathSymbol('times')" title="×">×</button>
            <button class="keypad-btn" @click="insertMathSymbol('divide')" title="÷">÷</button>
            <button class="keypad-btn" @click="insertMathSymbol('equals')" title="=">=</button>
            <button class="keypad-btn" @click="insertMathSymbol('approx')" title="≈">≈</button>
            <button class="keypad-btn" @click="insertMathSymbol('leq')" title="≤">≤</button>
            <button class="keypad-btn" @click="insertMathSymbol('geq')" title="≥">≥</button>
          </div>
        </div>

        <div class="keypad-section">
          <h4>Math Functions</h4>
          <div class="keypad-grid">
            <button class="keypad-btn" @click="insertMathSymbol('sqrt')" title="√">√</button>
            <button class="keypad-btn" @click="insertMathSymbol('integral')" title="∫">∫</button>
            <button class="keypad-btn" @click="insertMathSymbol('sum')" title="∑">∑</button>
            <button class="keypad-btn" @click="insertMathSymbol('fraction')" title="a/b">a/b</button>
            <button class="keypad-btn" @click="insertMathSymbol('power')" title="x^n">x^n</button>
            <button class="keypad-btn" @click="insertMathSymbol('subscript')" title="x_n">x_n</button>
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
          <h4>Keyboard Shortcuts</h4>
          <div class="shortcuts-list">
            <div class="shortcut-item"><kbd>/</kbd> <span>Commands</span></div>
            <div class="shortcut-item"><kbd>↑↓←→</kbd> <span>Navigate</span></div>
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
import { createMathExpression, symbolToLatex } from '../utils/latexMapping';
import type { CursorPosition, TextLine, MatrixLine, MathExpressionLine, Command } from '../types/editor';

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
const selectedCommandIndex = ref(0);

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

// Commands
const commands: Command[] = [
  { id: 'sigma', name: 'sigma', description: 'Σ uppercase sigma', category: 'symbol', icon: 'Σ' },
  { id: 'sum', name: 'sum', description: '∑ summation', category: 'symbol', icon: '∑' },
  { id: 'integral', name: 'integral', description: '∫ integral', category: 'symbol', icon: '∫' },
  { id: 'pi', name: 'pi', description: 'π pi', category: 'symbol', icon: 'π' },
  { id: 'alpha', name: 'alpha', description: 'α alpha', category: 'symbol', icon: 'α' },
  { id: 'beta', name: 'beta', description: 'β beta', category: 'symbol', icon: 'β' },
  { id: 'theta', name: 'theta', description: 'θ theta', category: 'symbol', icon: 'θ' },
  { id: 'lambda', name: 'lambda', description: 'λ lambda', category: 'symbol', icon: 'λ' },

  { id: 'plus', name: 'plus', description: '+ addition', category: 'operator', icon: '+' },
  { id: 'minus', name: 'minus', description: '− subtraction', category: 'operator', icon: '−' },
  { id: 'times', name: 'times', description: '× multiplication', category: 'operator', icon: '×' },
  { id: 'divide', name: 'divide', description: '÷ division', category: 'operator', icon: '÷' },
  { id: 'equals', name: 'equals', description: '= equals', category: 'operator', icon: '=' },
  { id: 'approx', name: 'approx', description: '≈ approximately equal', category: 'operator', icon: '≈' },
  { id: 'leq', name: 'less-equal', description: '≤ less than or equal', category: 'operator', icon: '≤' },
  { id: 'geq', name: 'greater-equal', description: '≥ greater than or equal', category: 'operator', icon: '≥' },

  { id: 'fraction', name: 'fraction', description: 'a/b fraction', category: 'math', icon: '⁄' },
  { id: 'sqrt', name: 'sqrt', description: '√ square root', category: 'math', icon: '√' },
  { id: 'power', name: 'power', description: 'x^n exponent', category: 'math', icon: '^' },
  { id: 'subscript', name: 'subscript', description: 'x_n subscript', category: 'math', icon: '_' },

  { id: 'matrix-2x2', name: 'matrix 2×2', description: '2×2 matrix', category: 'matrix', icon: '⊞' },
  { id: 'matrix-2x3', name: 'matrix 2×3', description: '2×3 matrix', category: 'matrix', icon: '⊞' },
  { id: 'matrix-3x2', name: 'matrix 3×2', description: '3×2 matrix', category: 'matrix', icon: '⊞' },
  { id: 'matrix-3x3', name: 'matrix 3×3', description: '3×3 matrix', category: 'matrix', icon: '⊞' },
  { id: 'matrix-4x4', name: 'matrix 4×4', description: '4×4 matrix', category: 'matrix', icon: '⊞' },
];

const filteredCommands = computed(() => {
  if (!commandQuery.value) return commands;
  const query = commandQuery.value.toLowerCase();
  return commands.filter(cmd =>
    cmd.name.toLowerCase().includes(query) ||
    cmd.description.toLowerCase().includes(query)
  );
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

// Helper functions
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
  // Responsive cell sizing based on matrix size
  const cellWidth = line.cols > 3 ? '38px' : '45px';
  const cellHeight = '32px';
  
  return {
    gridTemplateColumns: `repeat(${line.cols}, ${cellWidth})`,
    gridTemplateRows: `repeat(${line.rows}, ${cellHeight})`,
    gap: '0'
  };
}

function bracketHeight(line: MatrixLine) {
  // Dynamic bracket height based on content
  const cellHeight = 32;
  const spacing = 0;
  const padding = 6;
  const totalHeight = (line.rows * cellHeight) + padding;
  return `${totalHeight}px`;
}

// KEYBOARD HANDLING: All input comes from hidden input
function handleKeydown(event: KeyboardEvent) {
  // Command palette navigation
  if (showCommandPalette.value) {
    return; // Let palette input handle it
  }

  // Special keys that don't produce characters
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
      // Exit matrix to next line
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId);
      if (lineIndex < document.value.length - 1) {
        const nextLine = document.value[lineIndex + 1];
        cursor.value = { zone: 'text', lineId: nextLine.id, charOffset: 0 };
      } else {
        // Create new line
        insertNewLine();
      }
    }
    event.preventDefault();
    return;
  }
}

// Regular character input
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
  
  // Clear input for next keystroke
  target.value = '';
}

function handleBlur() {
  // Keep focus on hidden input unless palette is open
  if (!showCommandPalette.value) {
    nextTick(() => {
      hiddenInput.value?.focus();
    });
  }
}

function handleFocus() {
  // Hidden input is always focused
}

// Navigation
function handleArrowUp() {
  if (cursor.value.zone === 'matrix') {
    const line = notesStore.getLineById(cursor.value.lineId) as MatrixLine;
    if (cursor.value.row > 0) {
      cursor.value = { ...cursor.value, row: cursor.value.row - 1 };
    } else {
      // Exit to previous line
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
      cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 };
    }
  }
}

function handleArrowDown() {
  if (cursor.value.zone === 'matrix') {
    const line = notesStore.getLineById(cursor.value.lineId) as MatrixLine;
    if (cursor.value.row < line.rows - 1) {
      cursor.value = { ...cursor.value, row: cursor.value.row + 1 };
    } else {
      // Exit to next line
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
    const currentLine = notesStore.getLineById(cursor.value.lineId);
    if (currentLine?.type !== 'text') {
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId);
      if (lineIndex > 0) {
        const prevLine = document.value[lineIndex - 1];
        cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 };
      }
      return;
    }

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
      // Exit matrix to previous line
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
    const currentLine = notesStore.getLineById(cursor.value.lineId);
    if (currentLine?.type !== 'text') {
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId);
      if (lineIndex < document.value.length - 1) {
        const nextLine = document.value[lineIndex + 1];
        cursor.value = { zone: 'text', lineId: nextLine.id, charOffset: 0 };
      } else {
        insertNewLine();
      }
      return;
    }

    const lineLength = currentLine.content.reduce((sum, seg) => sum + (seg.type === 'text' ? seg.value.length : 1), 0);
    if (cursor.value.charOffset < lineLength) {
      cursor.value = { ...cursor.value, charOffset: cursor.value.charOffset + 1 };
    }
  } else if (cursor.value.zone === 'matrix') {
    const line = notesStore.getLineById(cursor.value.lineId) as MatrixLine;
    if (cursor.value.col < line.cols - 1) {
      cursor.value = { ...cursor.value, col: cursor.value.col + 1 };
    } else if (cursor.value.row < line.rows - 1) {
      cursor.value = { ...cursor.value, row: cursor.value.row + 1, col: 0 };
    } else {
      // Exit matrix to next line
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

// Insertion operations
function insertCharAtCursor(char: string) {
  if (cursor.value.zone !== 'text') return;

  const currentLine = notesStore.getLineById(cursor.value.lineId) as TextLine | MathExpressionLine | null;
  if (!currentLine || currentLine.type !== 'text') return;

  // Append to last text segment
  const lastSegment = currentLine.content[currentLine.content.length - 1];
  if (lastSegment?.type === 'text') {
    lastSegment.value += char;
  } else {
    currentLine.content.push({ type: 'text', value: char });
  }

  cursor.value = { ...cursor.value, charOffset: cursor.value.charOffset + 1 };
  updateDocument();
}

function insertCharInMatrix(char: string) {
  if (cursor.value.zone !== 'matrix') return;

  const line = notesStore.getLineById(cursor.value.lineId) as MatrixLine;
  if (!line) return;

  // Replace cell value with new character
  line.data[cursor.value.row][cursor.value.col] = char;
  
  // Auto-advance to next cell
  if (cursor.value.col < line.cols - 1) {
    cursor.value = { ...cursor.value, col: cursor.value.col + 1 };
  } else if (cursor.value.row < line.rows - 1) {
    cursor.value = { ...cursor.value, row: cursor.value.row + 1, col: 0 };
  }
  
  updateDocument();
}

function deleteCharAtCursor() {
  if (cursor.value.zone === 'text') {
    const currentLine = notesStore.getLineById(cursor.value.lineId) as TextLine | MathExpressionLine | null;
    if (!currentLine) return;

    if (currentLine.type === 'math' && notesStore.activeNote) {
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId);
      notesStore.activeNote.content.splice(lineIndex, 1);
      if (lineIndex > 0) {
        const prevLine = document.value[lineIndex - 1];
        cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 };
      } else if (document.value.length > 0) {
        cursor.value = { zone: 'text', lineId: document.value[0].id, charOffset: 0 };
      } else {
        insertNewLine();
      }
      updateDocument();
      return;
    }

    if (currentLine.type !== 'text') return;

    // Try to delete last character from last text segment
    const lastSegment = currentLine.content[currentLine.content.length - 1];
    
    if (lastSegment?.type === 'text' && lastSegment.value.length > 0) {
      // Delete character from text
      lastSegment.value = lastSegment.value.slice(0, -1);
      cursor.value = { ...cursor.value, charOffset: Math.max(0, cursor.value.charOffset - 1) };
      updateDocument();
    } else if (lastSegment?.type === 'symbol') {
      // Delete last symbol
      currentLine.content.pop();
      cursor.value = { ...cursor.value, charOffset: Math.max(0, cursor.value.charOffset - 1) };
      updateDocument();
    } else if (currentLine.content.length === 1 && 
               currentLine.content[0].type === 'text' && 
               currentLine.content[0].value === '' &&
               notesStore.activeNote &&
               notesStore.activeNote.content.length > 1) {
      // Delete empty line (only if not the only line in document)
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId);
      notesStore.activeNote.content.splice(lineIndex, 1);
      
      // Move cursor to previous line
      if (lineIndex > 0) {
        const prevLine = document.value[lineIndex - 1];
        cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 };
      } else if (document.value.length > 0) {
        cursor.value = { zone: 'text', lineId: document.value[0].id, charOffset: 0 };
      }
      updateDocument();
    }
  } else if (cursor.value.zone === 'matrix') {
    const line = notesStore.getLineById(cursor.value.lineId) as MatrixLine;
    if (!line) return;

    // Check if matrix is empty
    const isEmpty = line.data.every(row => row.every(cell => cell === ''));
    
    if (isEmpty && notesStore.activeNote && notesStore.activeNote.content.length > 1) {
      // Delete entire empty matrix
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId);
      notesStore.activeNote.content.splice(lineIndex, 1);
      
      // Move cursor to previous line
      if (lineIndex > 0) {
        const prevLine = document.value[lineIndex - 1];
        cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 };
      } else if (document.value.length > 0) {
        cursor.value = { zone: 'text', lineId: document.value[0].id, charOffset: 0 };
      }
      updateDocument();
    } else {
      // Just clear current cell
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

function insertMathSymbol(symbolId: string) {
  if (cursor.value.zone !== 'text') return;

  const latex = symbolToLatex[symbolId] ?? symbolId;
  const lineIndex = notesStore.getLineIndex(cursor.value.lineId);
  const newLine = createMathExpression(latex, generateId());

  if (notesStore.activeNote) {
    notesStore.activeNote.content.splice(lineIndex + 1, 0, newLine);
    updateDocument();
    cursor.value = {
      zone: 'text',
      lineId: newLine.id,
      charOffset: 0
    };
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

function updateMathLatex(lineId: string, latex: string) {
  const line = notesStore.getLineById(lineId) as MathExpressionLine | null;
  if (line && line.type === 'math') {
    line.latex = latex;
    updateDocument();
  }
}

function focusMathExpression(lineId: string) {
  cursor.value = {
    zone: 'text',
    lineId,
    charOffset: 0
  };
}

function blurMathExpression() {
  hiddenInput.value?.focus();
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

function handleDisplayClick(event: MouseEvent) {
  const target = event.target as HTMLElement;

  const editorDisplay = window.document.querySelector('.editor-display') as HTMLElement | null;
  if (!editorDisplay?.contains(target)) return;
  
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

  // Click on text line - set cursor to beginning of line
  const lineEl = target.closest('.container-line');
  if (lineEl) {
    const lineId = lineEl.getAttribute('data-line-id');
    if (lineId) {
      cursor.value = {
        zone: 'text',
        lineId: lineId,
        charOffset: 0
      };
      hiddenInput.value?.focus();
    }
    return;
  }

  if (document.value.length > 0) {
    const lastLine = document.value[document.value.length - 1];
    cursor.value = {
      zone: 'text',
      lineId: lastLine.id,
      charOffset: 0
    };
  } else {
    insertNewLine();
  }
  hiddenInput.value?.focus();
}

function handleMouseMove(event: MouseEvent) {
  // Could use for text selection later
}

// Command palette
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

function executeCommand(cmd: Command) {
  if (cmd.category === 'matrix') {
    const [, size] = cmd.id.split('-');
    const [rows, cols] = size.split('x').map(Number);
    insertMatrix(rows, cols);
  } else if (cmd.category === 'symbol' || cmd.category === 'operator' || cmd.category === 'math') {
    insertMathSymbol(cmd.id);
  }
}

function closeCommandPalette() {
  showCommandPalette.value = false;
  commandQuery.value = '';
  hiddenInput.value?.focus();
}

// Helper functions
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
}

/* Container lines - allows text to flow naturally */
.container-line {
  display: block;
  min-height: auto;
  position: relative;
  word-wrap: break-word;
  margin: 8px 0;
  padding: 2px 0;
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

/* Text segments - flow inline naturally */
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

.empty-line-placeholder {
  display: inline-block;
  width: 0;
  height: 1.7em;
  vertical-align: baseline;
}

/* CRITICAL: Matrix is INLINE - flows with text */
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

/* Brackets - professional looking, scale with matrix */
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

/* Matrix grid - clean, no visible borders */
.matrix-grid {
  display: inline-grid;
  grid-auto-flow: row;
  gap: 0;
  padding: 0;
  margin: 0;
}

/* TEXTBOOK STYLE: Matrix cells with no borders, subtle spacing */
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

/* Active cell gets subtle highlight, not big border */
.matrix-cell-textbook.is-active {
  background: rgba(33, 150, 243, 0.08);
  border-bottom: 2px solid #2196F3;
  padding: 6px 8px;
  font-weight: 500;
}

/* Hover state */
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

.palette-header {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
  background: #f5f5f5;
}

.palette-icon {
  font-size: 16px;
  color: #666;
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
  color: #333;
}

.palette-input::placeholder {
  color: #999;
}

.palette-list {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
}

.palette-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
}

.palette-item:last-child {
  border-bottom: none;
}

.palette-item:hover {
  background: #f0f8ff;
}

.palette-item.selected {
  background: #e3f2fd;
  border-left: 3px solid #2196F3;
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
  flex: 1;
}

.cmd-name {
  font-size: 14px;
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
  font-size: 12px;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.keypad-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
}

.keypad-btn {
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.keypad-btn:hover {
  background: var(--color-accent-light);
  border-color: var(--color-accent);
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
