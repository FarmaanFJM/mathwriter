<template>
  <div class="math-writer">
    <!-- LEFT SIDEBAR: Notes Panel -->
    <div class="sidebar-left">
      <div class="sidebar-header">
        <h3>Notes</h3>
        <div class="header-actions">
          <button class="btn-theme-toggle" @click="toggleTheme" :title="`Switch to ${editorStore.theme === 'light' ? 'dark' : 'light'} mode`">
            <span v-if="editorStore.theme === 'light'" class="theme-icon">&#9790;</span>
            <span v-else class="theme-icon">&#9788;</span>
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
        <div class="editor-toolbar" role="toolbar" aria-label="Text formatting">
          <label class="toolbar-label" for="font-size">Size</label>
          <select id="font-size" class="toolbar-select" :value="editorStore.currentFontSize" @change="updateFontSize">
            <option v-for="size in fontSizes" :key="size" :value="size">{{ size }}px</option>
          </select>

          <button
            type="button"
            class="toolbar-btn"
            :class="{ active: editorStore.isBold }"
            @click="editorStore.toggleBold()"
            aria-label="Toggle bold"
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            class="toolbar-btn"
            :class="{ active: editorStore.isItalic }"
            @click="editorStore.toggleItalic()"
            aria-label="Toggle italic"
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            class="toolbar-btn"
            :class="{ active: editorStore.isUnderline }"
            @click="editorStore.toggleUnderline()"
            aria-label="Toggle underline"
            title="Underline"
          >
            <span class="underline-icon">U</span>
          </button>
        </div>

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
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
      />

      <!-- DISPLAY LAYER: Read-only rendered content -->
      <div
        class="editor-display"
        :style="editorDisplayStyle"
        @click="handleDisplayClick"
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
            <template v-for="token in getLineTokens(line as TextLine)" :key="token.key">
              <span
                v-if="token.type === 'caret'"
                class="custom-caret"
              ></span>

              <span
                v-else-if="token.type === 'char'"
                class="text-char"
                @click.stop="setCursorAtOffset(line.id, token.offset + 1)"
              >{{ token.value }}</span>

              <!-- Symbol segment (rendered with KaTeX inline) -->
              <span
                v-else-if="token.type === 'symbol'"
                class="symbol-inline"
                :data-latex="(token.segment as SymbolSpan).latex"
                @click.stop="setCursorAtOffset(line.id, token.offset + 1)"
              >
                <span class="symbol-render" :ref="(el) => registerSymbolRef(line.id, token.segmentIndex, el as HTMLElement)"></span>
              </span>

              <!-- Math template segment (inline, with editable slots) -->
              <MathTemplate
                v-else-if="token.type === 'mathTemplate'"
                :span="(token.segment as MathTemplateSpan)"
                :active-slot-name="getActiveSlotName(line.id, (token.segment as MathTemplateSpan).id)"
                @focus-slot="(spanId, slotName) => focusMathTemplateSlot(line.id, spanId, slotName)"
              />

              <!-- Inline matrix segment -->
              <span v-else-if="token.type === 'matrix'" class="matrix-inline">
                <span class="matrix-bracket bracket-left" :style="{ height: bracketHeight(token.segment as MatrixSpan) }">
                  <svg viewBox="0 0 20 100" preserveAspectRatio="none">
                    <path d="M 15 0 L 5 0 L 5 100 L 15 100" fill="none" stroke="currentColor" stroke-width="2.5"/>
                  </svg>
                </span>

                <span class="matrix-grid" :style="gridStyle(token.segment as MatrixSpan)">
                <span
                  v-for="(cell, cellIdx) in flattenMatrix(token.segment as MatrixSpan)"
                  :key="`${(token.segment as MatrixSpan).id}-${cellIdx}`"
                  class="matrix-cell-textbook"
                  :class="{
                    'is-active': cursor.zone === 'matrix' && cursor.lineId === line.id && cursor.matrixId === (token.segment as MatrixSpan).id && cursor.row === cell.row && cursor.col === cell.col
                  }"
                  :data-row="cell.row"
                  :data-col="cell.col"
                  :data-matrix-id="(token.segment as MatrixSpan).id"
                  @click.stop="focusMatrixCell(line.id, (token.segment as MatrixSpan).id, cell.row, cell.col)"
                >
                  <span
                    class="matrix-cell-render"
                    :ref="(el) => registerMatrixCellRef(line.id, (token.segment as MatrixSpan).id, cell.row, cell.col, el as HTMLElement)"
                  ></span>
                </span>
              </span>

                <span class="matrix-bracket bracket-right" :style="{ height: bracketHeight(token.segment as MatrixSpan) }">
                  <svg viewBox="0 0 20 100" preserveAspectRatio="none">
                    <path d="M 5 0 L 15 0 L 15 100 L 5 100" fill="none" stroke="currentColor" stroke-width="2.5"/>
                  </svg>
                </span>
              </span>
            </template>

            <span
              v-if="(line as TextLine).content.length === 1 && (line as TextLine).content[0].type === 'text' && ((line as TextLine).content[0] as TextSpan).value === ''"
              class="empty-line-placeholder"
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

          <!-- Matrix line -->
          <div
            v-else-if="line.type === 'matrix'"
            class="matrix-inline"
            :class="{ 'is-editing': cursor.zone === 'matrix' && cursor.lineId === line.id }"
            @click.stop="focusMatrixCell(line.id, line.id, 0, 0)"
          >
            <div class="matrix-bracket bracket-left" :style="{ height: bracketHeight(line as MatrixLine) }">
              <svg viewBox="0 0 20 100" preserveAspectRatio="none">
                <path d="M 15 0 L 5 0 L 5 100 L 15 100" fill="none" stroke="currentColor" stroke-width="2.5"/>
              </svg>
            </div>

            <div class="matrix-grid" :style="gridStyle(line as MatrixLine)">
              <div
                v-for="(cell, cellIdx) in flattenMatrix(line as MatrixLine)"
                :key="`${line.id}-${cellIdx}`"
                class="matrix-cell-textbook"
                :class="{
                  'is-active': cursor.zone === 'matrix' && cursor.lineId === line.id && cursor.matrixId === line.id && cursor.row === cell.row && cursor.col === cell.col
                }"
                :data-row="cell.row"
                :data-col="cell.col"
                :data-matrix-id="line.id"
                @click.stop="focusMatrixCell(line.id, line.id, cell.row, cell.col)"
              >
                <span
                  class="matrix-cell-render"
                  :ref="(el) => registerMatrixCellRef(line.id, line.id, cell.row, cell.col, el as HTMLElement)"
                ></span>
              </div>
            </div>

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
            placeholder="summation, fraction, integral, sqrt..."
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
            <span v-if="cmd.category === 'template'" class="cmd-badge">template</span>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT SIDEBAR: Keypad -->
    <div class="sidebar-right">
      <div class="keypad">
        <!-- Math Templates section (prominent) -->
        <div class="keypad-section">
          <h4>Equations</h4>
          <div class="keypad-grid keypad-grid-2col">
            <button class="keypad-btn keypad-btn-template" @click="insertTemplate('summation')" title="Summation">
              <span class="btn-symbol">&sum;</span>
              <span class="btn-label">Sum</span>
            </button>
            <button class="keypad-btn keypad-btn-template" @click="insertTemplate('product')" title="Product">
              <span class="btn-symbol">&prod;</span>
              <span class="btn-label">Product</span>
            </button>
            <button class="keypad-btn keypad-btn-template" @click="insertTemplate('integral')" title="Integral">
              <span class="btn-symbol">&int;</span>
              <span class="btn-label">Integral</span>
            </button>
            <button class="keypad-btn keypad-btn-template" @click="insertTemplate('limit')" title="Limit">
              <span class="btn-symbol">lim</span>
              <span class="btn-label">Limit</span>
            </button>
            <button class="keypad-btn keypad-btn-template" @click="insertTemplate('fraction')" title="Fraction">
              <span class="btn-symbol">&frasl;</span>
              <span class="btn-label">Fraction</span>
            </button>
            <button class="keypad-btn keypad-btn-template" @click="insertTemplate('sqrt')" title="Square Root">
              <span class="btn-symbol">&radic;</span>
              <span class="btn-label">Root</span>
            </button>
            <button class="keypad-btn keypad-btn-template" @click="insertTemplate('power')" title="Exponent">
              <span class="btn-symbol">x<sup>n</sup></span>
              <span class="btn-label">Power</span>
            </button>
            <button class="keypad-btn keypad-btn-template" @click="insertTemplate('subscriptExpr')" title="Subscript">
              <span class="btn-symbol">x<sub>i</sub></span>
              <span class="btn-label">Subscript</span>
            </button>
            <button class="keypad-btn keypad-btn-template" @click="insertTemplate('derivative')" title="Derivative">
              <span class="btn-symbol">d/dx</span>
              <span class="btn-label">Derivative</span>
            </button>
            <button class="keypad-btn keypad-btn-template" @click="insertTemplate('abs')" title="Absolute Value">
              <span class="btn-symbol">|x|</span>
              <span class="btn-label">Abs</span>
            </button>
          </div>
        </div>

        <div class="keypad-section">
          <h4>Greek Letters</h4>
          <div class="keypad-grid">
            <button class="keypad-btn" @click="insertInlineSymbol('alpha')" title="alpha">&alpha;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('beta')" title="beta">&beta;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('gamma')" title="gamma">&gamma;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('delta')" title="delta">&delta;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('epsilon')" title="epsilon">&epsilon;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('theta')" title="theta">&theta;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('lambda')" title="lambda">&lambda;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('mu')" title="mu">&mu;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('pi')" title="pi">&pi;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('sigma_lower')" title="sigma">&sigma;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('phi')" title="phi">&phi;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('omega')" title="omega">&omega;</button>
          </div>
        </div>

        <div class="keypad-section">
          <h4>Operators</h4>
          <div class="keypad-grid">
            <button class="keypad-btn" @click="insertInlineSymbol('plus')" title="+">+</button>
            <button class="keypad-btn" @click="insertInlineSymbol('minus')" title="minus">&minus;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('times')" title="times">&times;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('divide')" title="divide">&divide;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('equals')" title="=">=</button>
            <button class="keypad-btn" @click="insertInlineSymbol('neq')" title="not equal">&ne;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('approx')" title="approx">&asymp;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('leq')" title="less equal">&le;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('geq')" title="greater equal">&ge;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('pm')" title="plus-minus">&plusmn;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('infinity')" title="infinity">&infin;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('cdot')" title="dot">&middot;</button>
          </div>
        </div>

        <div class="keypad-section">
          <h4>More Operators</h4>
          <div class="keypad-grid">
            <button class="keypad-btn" @click="insertInlineSymbol('rightarrow')" title="right arrow">&rarr;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('Rightarrow')" title="implies">&rArr;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('forall')" title="for all">&forall;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('exists')" title="exists">&exist;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('in_set')" title="in">&isin;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('subset')" title="subset">&sub;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('cup')" title="union">&cup;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('cap')" title="intersection">&cap;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('nabla')" title="nabla">&nabla;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('partial')" title="partial">&part;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('dots')" title="dots">&ctdot;</button>
            <button class="keypad-btn" @click="insertInlineSymbol('leftrightarrow')" title="iff">&harr;</button>
          </div>
        </div>

        <div class="keypad-section">
          <h4>Matrices</h4>
          <div class="keypad-grid">
            <button class="keypad-btn" @click="insertMatrix(2, 2)">2&times;2</button>
            <button class="keypad-btn" @click="insertMatrix(2, 3)">2&times;3</button>
            <button class="keypad-btn" @click="insertMatrix(3, 3)">3&times;3</button>
            <button class="keypad-btn" @click="insertMatrix(4, 4)">4&times;4</button>
          </div>
        </div>

        <div class="keypad-section">
          <h4>Keyboard Shortcuts</h4>
          <div class="shortcuts-list">
            <div class="shortcut-item"><kbd>/</kbd> <span>Commands</span></div>
            <div class="shortcut-item"><kbd>Tab</kbd> <span>Next slot</span></div>
            <div class="shortcut-item"><kbd>Shift+Tab</kbd> <span>Previous slot</span></div>
            <div class="shortcut-item"><kbd>Esc</kbd> <span>Finish editing</span></div>
            <div class="shortcut-item"><kbd>Enter</kbd> <span>New line</span></div>
            <div class="shortcut-item"><kbd>&uarr;&darr;&larr;&rarr;</kbd> <span>Navigate</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useNotesStore } from '../stores/notesStore'
import { useEditorStore } from '../stores/editorStore'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import MathExpression from './MathExpression.vue'
import MathTemplate from './MathTemplate.vue'
import { mathTemplates, inlineSymbols } from '../utils/mathTemplates'
import type {
  CursorPosition, TextLine, TextSpan, SymbolSpan, MatrixLine,
  MatrixSpan, MathExpressionLine, MathTemplateSpan, Command
} from '../types/editor'

const notesStore = useNotesStore()
const editorStore = useEditorStore()
const hiddenInput = ref<HTMLInputElement | null>(null)
const paletteInputRef = ref<HTMLInputElement | null>(null)

// STATE: Document and cursor
const document = computed(() => notesStore.document)

const cursor = ref<CursorPosition>({
  zone: 'text',
  lineId: '',
  charOffset: 0
})

// UI state
const commandQuery = ref('')
const showCommandPalette = ref(false)
const selectedCommandIndex = ref(0)

const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32]

const editorDisplayStyle = computed(() => ({
  fontSize: `${editorStore.currentFontSize}px`,
  fontWeight: editorStore.isBold ? '700' : '400',
  fontStyle: editorStore.isItalic ? 'italic' : 'normal',
  textDecoration: editorStore.isUnderline ? 'underline' : 'none'
}))

function updateFontSize(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value)
  if (!Number.isNaN(value)) {
    editorStore.setFontSize(value)
  }
}

// Symbol rendering refs
const symbolRefs = ref<Map<string, HTMLElement>>(new Map())
const matrixCellRefs = ref<Map<string, HTMLElement>>(new Map())

function registerSymbolRef(lineId: string, idx: number, el: HTMLElement | null) {
  const key = `${lineId}::${idx}`
  if (el) {
    symbolRefs.value.set(key, el)
    // Render the symbol with KaTeX
    renderSymbolAt(lineId, idx, el)
  } else {
    symbolRefs.value.delete(key)
  }
}

function registerMatrixCellRef(lineId: string, matrixId: string, row: number, col: number, el: HTMLElement | null) {
  const key = `${lineId}::${matrixId}::${row}::${col}`
  if (el) {
    matrixCellRefs.value.set(key, el)
    renderMatrixCellAt(lineId, matrixId, row, col, el)
  } else {
    matrixCellRefs.value.delete(key)
  }
}

function renderSymbolAt(lineId: string, idx: number, el: HTMLElement) {
  const line = notesStore.getLineById(lineId) as TextLine | null
  if (!line || line.type !== 'text') return
  const segment = line.content[idx]
  if (!segment || segment.type !== 'symbol') return
  const latex = (segment as SymbolSpan).latex || ''
  if (!latex) return
  try {
    el.innerHTML = ''
    katex.render(latex, el, {
      displayMode: false,
      throwOnError: false,
      trust: true,
    })
  } catch {
    el.textContent = (segment as SymbolSpan).display
  }
}

function getMatrixById(lineId: string, matrixId: string): MatrixLine | MatrixSpan | null {
  const line = notesStore.getLineById(lineId) as TextLine | MatrixLine | null
  if (!line) return null
  if (line.type === 'matrix' && line.id === matrixId) {
    return line
  }
  if (line.type === 'text') {
    const matrix = line.content.find(
      (segment): segment is MatrixSpan => segment.type === 'matrix' && segment.id === matrixId
    )
    return matrix ?? null
  }
  return null
}

function renderMatrixCellAt(lineId: string, matrixId: string, row: number, col: number, el: HTMLElement) {
  const matrix = getMatrixById(lineId, matrixId)
  if (!matrix) return
  const value = matrix.data[row]?.[col] ?? ''
  const latex = value ? value : '\\phantom{0}'
  try {
    el.innerHTML = ''
    katex.render(latex, el, {
      displayMode: false,
      throwOnError: false,
      trust: true,
    })
  } catch {
    el.textContent = value
  }
}

// Re-render symbols when document changes
watch(document, () => {
  nextTick(() => {
    symbolRefs.value.forEach((el, key) => {
      const [lineId, idxStr] = key.split('::')
      renderSymbolAt(lineId, Number(idxStr), el)
    })
    matrixCellRefs.value.forEach((el, key) => {
      const [lineId, matrixId, rowStr, colStr] = key.split('::')
      renderMatrixCellAt(lineId, matrixId, Number(rowStr), Number(colStr), el)
    })
  })
}, { deep: true })

// Initialize
onMounted(() => {
  editorStore.initTheme()
  editorStore.initFormatting()
  notesStore.init()
  if (document.value.length > 0) {
    cursor.value = {
      zone: 'text',
      lineId: document.value[0].id,
      charOffset: 0
    }
  }
  nextTick(() => {
    hiddenInput.value?.focus()
  })
})

// Commands - expanded with templates
const commands: Command[] = [
  // Templates (primary)
  { id: 'tpl-summation', name: 'Summation', description: 'Sum with bounds', category: 'template', icon: '\u2211' },
  { id: 'tpl-product', name: 'Product', description: 'Product with bounds', category: 'template', icon: '\u220F' },
  { id: 'tpl-integral', name: 'Integral', description: 'Integral with bounds', category: 'template', icon: '\u222B' },
  { id: 'tpl-limit', name: 'Limit', description: 'Limit expression', category: 'template', icon: 'lim' },
  { id: 'tpl-fraction', name: 'Fraction', description: 'a/b fraction', category: 'template', icon: '\u2044' },
  { id: 'tpl-sqrt', name: 'Square Root', description: 'Square root', category: 'template', icon: '\u221A' },
  { id: 'tpl-nthroot', name: 'Nth Root', description: 'nth root', category: 'template', icon: '\u221B' },
  { id: 'tpl-power', name: 'Exponent', description: 'x to the n', category: 'template', icon: 'x\u207F' },
  { id: 'tpl-subscriptExpr', name: 'Subscript', description: 'x sub i', category: 'template', icon: 'x\u1D62' },
  { id: 'tpl-superSub', name: 'Super & Subscript', description: 'x sub i to the n', category: 'template', icon: 'x\u1D62\u207F' },
  { id: 'tpl-derivative', name: 'Derivative', description: 'd/dx derivative', category: 'template', icon: 'd/dx' },
  { id: 'tpl-partialDerivative', name: 'Partial Derivative', description: 'partial derivative', category: 'template', icon: '\u2202/\u2202x' },
  { id: 'tpl-union', name: 'Union', description: 'Set union with bounds', category: 'template', icon: '\u22C3' },
  { id: 'tpl-intersection', name: 'Intersection', description: 'Set intersection with bounds', category: 'template', icon: '\u22C2' },
  { id: 'tpl-hat', name: 'Hat', description: 'Hat accent', category: 'template', icon: '\u0302' },
  { id: 'tpl-bar', name: 'Overline', description: 'Bar/overline', category: 'template', icon: '\u0305' },
  { id: 'tpl-vec', name: 'Vector', description: 'Vector arrow', category: 'template', icon: '\u20D7' },
  { id: 'tpl-abs', name: 'Absolute Value', description: '|x| absolute value', category: 'template', icon: '|x|' },
  { id: 'tpl-paren', name: 'Parentheses', description: 'Auto-sizing parens', category: 'template', icon: '(x)' },
  { id: 'tpl-bracket', name: 'Brackets', description: 'Auto-sizing brackets', category: 'template', icon: '[x]' },
  { id: 'tpl-binom', name: 'Binomial', description: 'Binomial coefficient', category: 'template', icon: 'C(n,k)' },

  // Greek letters
  { id: 'sym-alpha', name: 'alpha', description: '\u03B1 alpha', category: 'symbol', icon: '\u03B1' },
  { id: 'sym-beta', name: 'beta', description: '\u03B2 beta', category: 'symbol', icon: '\u03B2' },
  { id: 'sym-gamma', name: 'gamma', description: '\u03B3 gamma', category: 'symbol', icon: '\u03B3' },
  { id: 'sym-delta', name: 'delta', description: '\u03B4 delta', category: 'symbol', icon: '\u03B4' },
  { id: 'sym-theta', name: 'theta', description: '\u03B8 theta', category: 'symbol', icon: '\u03B8' },
  { id: 'sym-lambda', name: 'lambda', description: '\u03BB lambda', category: 'symbol', icon: '\u03BB' },
  { id: 'sym-pi', name: 'pi', description: '\u03C0 pi', category: 'symbol', icon: '\u03C0' },
  { id: 'sym-sigma_lower', name: 'sigma', description: '\u03C3 sigma', category: 'symbol', icon: '\u03C3' },
  { id: 'sym-phi', name: 'phi', description: '\u03C6 phi', category: 'symbol', icon: '\u03C6' },
  { id: 'sym-omega', name: 'omega', description: '\u03C9 omega', category: 'symbol', icon: '\u03C9' },

  // Operators
  { id: 'sym-plus', name: 'plus', description: '+ addition', category: 'operator', icon: '+' },
  { id: 'sym-minus', name: 'minus', description: '\u2212 subtraction', category: 'operator', icon: '\u2212' },
  { id: 'sym-times', name: 'times', description: '\u00D7 multiplication', category: 'operator', icon: '\u00D7' },
  { id: 'sym-divide', name: 'divide', description: '\u00F7 division', category: 'operator', icon: '\u00F7' },
  { id: 'sym-equals', name: 'equals', description: '= equals', category: 'operator', icon: '=' },
  { id: 'sym-neq', name: 'not-equal', description: '\u2260 not equal', category: 'operator', icon: '\u2260' },
  { id: 'sym-approx', name: 'approx', description: '\u2248 approximately', category: 'operator', icon: '\u2248' },
  { id: 'sym-leq', name: 'less-equal', description: '\u2264 less or equal', category: 'operator', icon: '\u2264' },
  { id: 'sym-geq', name: 'greater-equal', description: '\u2265 greater or equal', category: 'operator', icon: '\u2265' },
  { id: 'sym-infinity', name: 'infinity', description: '\u221E infinity', category: 'operator', icon: '\u221E' },
  { id: 'sym-rightarrow', name: 'right arrow', description: '\u2192 right arrow', category: 'operator', icon: '\u2192' },
  { id: 'sym-Rightarrow', name: 'implies', description: '\u21D2 implies', category: 'operator', icon: '\u21D2' },
  { id: 'sym-forall', name: 'for all', description: '\u2200 for all', category: 'operator', icon: '\u2200' },
  { id: 'sym-exists', name: 'exists', description: '\u2203 exists', category: 'operator', icon: '\u2203' },
  { id: 'sym-in_set', name: 'in', description: '\u2208 element of', category: 'operator', icon: '\u2208' },
  { id: 'sym-nabla', name: 'nabla', description: '\u2207 nabla/del', category: 'operator', icon: '\u2207' },
  { id: 'sym-partial', name: 'partial', description: '\u2202 partial', category: 'operator', icon: '\u2202' },

  // Matrices
  { id: 'matrix-2x2', name: 'matrix 2\u00D72', description: '2\u00D72 matrix', category: 'matrix', icon: '\u229E' },
  { id: 'matrix-2x3', name: 'matrix 2\u00D73', description: '2\u00D73 matrix', category: 'matrix', icon: '\u229E' },
  { id: 'matrix-3x3', name: 'matrix 3\u00D73', description: '3\u00D73 matrix', category: 'matrix', icon: '\u229E' },
  { id: 'matrix-4x4', name: 'matrix 4\u00D74', description: '4\u00D74 matrix', category: 'matrix', icon: '\u229E' },
]

const filteredCommands = computed(() => {
  if (!commandQuery.value) return commands
  const query = commandQuery.value.toLowerCase()
  return commands.filter(cmd =>
    cmd.name.toLowerCase().includes(query) ||
    cmd.description.toLowerCase().includes(query)
  )
})

// Palette position
const palettePosition = computed(() => {
  const lineEl = window.document.querySelector(`[data-line-id="${cursor.value.lineId}"]`)
  if (!lineEl) return {}
  const rect = lineEl.getBoundingClientRect()
  return {
    position: 'fixed' as const,
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`
  }
})

// Helper functions
function flattenMatrix(line: MatrixLine | MatrixSpan) {
  const cells: Array<{ row: number, col: number, value: string }> = []
  for (let r = 0; r < line.rows; r++) {
    for (let c = 0; c < line.cols; c++) {
      cells.push({ row: r, col: c, value: line.data[r][c] })
    }
  }
  return cells
}

function gridStyle(line: MatrixLine | MatrixSpan) {
  const cellWidth = line.cols > 3 ? '24px' : '28px'
  const cellHeight = '20px'
  return {
    gridTemplateColumns: `repeat(${line.cols}, ${cellWidth})`,
    gridTemplateRows: `repeat(${line.rows}, ${cellHeight})`,
    gap: '0'
  }
}

function bracketHeight(line: MatrixLine | MatrixSpan) {
  const cellHeight = 20
  const padding = 2
  const totalHeight = (line.rows * cellHeight) + padding
  return `${totalHeight}px`
}

function getMatrixByCursor() {
  if (cursor.value.zone !== 'matrix') return null
  const cur = cursor.value as { zone: 'matrix', lineId: string, matrixId: string, row: number, col: number }
  const line = notesStore.getLineById(cur.lineId) as TextLine | MatrixLine | null
  if (!line) return null

  if (line.type === 'matrix') {
    return { line, matrix: line }
  }

  if (line.type === 'text') {
    const matrix = line.content.find(
      (segment): segment is MatrixSpan => segment.type === 'matrix' && segment.id === cur.matrixId
    )
    if (matrix) {
      return { line, matrix }
    }
  }

  return null
}

// Get the active slot name for a math template (used by MathTemplate component)
function getActiveSlotName(lineId: string, spanId: string): string | null {
  if (cursor.value.zone !== 'mathTemplate') return null
  const cur = cursor.value as { zone: 'mathTemplate', lineId: string, templateSpanId: string, slotName: string, slotOffset: number }
  if (cur.lineId !== lineId) return null
  if (cur.templateSpanId !== spanId) return null
  return cur.slotName
}

// Get math template span by cursor
function getTemplateByCursor(): { line: TextLine, span: MathTemplateSpan, spanIndex: number } | null {
  if (cursor.value.zone !== 'mathTemplate') return null
  const cur = cursor.value as { zone: 'mathTemplate', lineId: string, templateSpanId: string, slotName: string, slotOffset: number }
  const line = notesStore.getLineById(cur.lineId) as TextLine | null
  if (!line || line.type !== 'text') return null
  const spanIndex = line.content.findIndex(
    (seg): seg is MathTemplateSpan => seg.type === 'mathTemplate' && seg.id === cur.templateSpanId
  )
  if (spanIndex === -1) return null
  return { line, span: line.content[spanIndex] as MathTemplateSpan, spanIndex }
}

// KEYBOARD HANDLING: All input comes from hidden input
function handleKeydown(event: KeyboardEvent) {
  // Command palette navigation
  if (showCommandPalette.value) {
    return // Let palette input handle it
  }

  // Tab: navigate between slots in math template
  if (event.key === 'Tab') {
    if (cursor.value.zone === 'mathTemplate') {
      event.preventDefault()
      if (event.shiftKey) {
        navigateSlotPrev()
      } else {
        navigateSlotNext()
      }
      return
    }
    // Tab in matrix: move to next cell
    if (cursor.value.zone === 'matrix') {
      event.preventDefault()
      const matrixData = getMatrixByCursor()
      if (matrixData) {
        if (cursor.value.col < matrixData.matrix.cols - 1) {
          cursor.value = { ...cursor.value, col: cursor.value.col + 1 }
        } else if (cursor.value.row < matrixData.matrix.rows - 1) {
          cursor.value = { ...cursor.value, row: cursor.value.row + 1, col: 0 }
        }
      }
      return
    }
    event.preventDefault()
    return
  }

  // Special keys
  if (event.key === '/') {
    // Only open palette from text zone
    if (cursor.value.zone === 'text') {
      showCommandPalette.value = true
      commandQuery.value = ''
      selectedCommandIndex.value = 0
      event.preventDefault()
      nextTick(() => {
        paletteInputRef.value?.focus()
      })
      return
    }
  }

  if (event.key === 'Enter') {
    if (cursor.value.zone === 'mathTemplate') {
      // Enter in template: move to next slot, or exit if last slot
      navigateSlotNext()
      event.preventDefault()
      return
    }
    insertNewLine()
    event.preventDefault()
    return
  }

  if (event.key === 'Backspace') {
    if (cursor.value.zone === 'mathTemplate') {
      deleteCharInSlot()
      event.preventDefault()
      return
    }
    deleteCharAtCursor()
    event.preventDefault()
    return
  }

  if (event.key === 'ArrowUp') {
    handleArrowUp()
    event.preventDefault()
    return
  }

  if (event.key === 'ArrowDown') {
    handleArrowDown()
    event.preventDefault()
    return
  }

  if (event.key === 'ArrowLeft') {
    if (cursor.value.zone === 'mathTemplate') {
      const currentCursor = cursor.value
      const data = getTemplateByCursor()
      if (data) {
        if (currentCursor.slotOffset > 0) {
          cursor.value = { ...currentCursor, slotOffset: currentCursor.slotOffset - 1 }
        } else {
          const template = mathTemplates[data.span.templateId]
          if (!template) {
            exitMathTemplateBefore()
            event.preventDefault()
            return
          }
          const slotIndex = template.slots.findIndex(s => s.name === currentCursor.slotName)
          if (slotIndex > 0) {
            const prevSlot = template.slots[slotIndex - 1]
            const prevVal = data.span.slotValues[prevSlot.name] || ''
            cursor.value = {
              zone: 'mathTemplate',
              lineId: currentCursor.lineId,
              templateSpanId: currentCursor.templateSpanId,
              slotName: prevSlot.name,
              slotOffset: prevVal.length
            }
          } else {
            exitMathTemplateBefore()
          }
        }
      }
      event.preventDefault()
      return
    }
    handleArrowLeft()
    event.preventDefault()
    return
  }

  if (event.key === 'ArrowRight') {
    if (cursor.value.zone === 'mathTemplate') {
      const currentCursor = cursor.value
      const data = getTemplateByCursor()
      if (data) {
        const template = mathTemplates[data.span.templateId]
        if (!template) {
          exitMathTemplate()
          event.preventDefault()
          return
        }
        const val = data.span.slotValues[currentCursor.slotName] || ''
        if (currentCursor.slotOffset < val.length) {
          cursor.value = { ...currentCursor, slotOffset: currentCursor.slotOffset + 1 }
        } else {
          const slotIndex = template.slots.findIndex(s => s.name === currentCursor.slotName)
          if (slotIndex < template.slots.length - 1) {
            const nextSlot = template.slots[slotIndex + 1]
            cursor.value = {
              zone: 'mathTemplate',
              lineId: currentCursor.lineId,
              templateSpanId: currentCursor.templateSpanId,
              slotName: nextSlot.name,
              slotOffset: 0
            }
          } else {
            exitMathTemplate()
          }
        }
      }
      event.preventDefault()
      return
    }
    handleArrowRight()
    event.preventDefault()
    return
  }

  if (event.key === 'Escape') {
    if (cursor.value.zone === 'mathTemplate') {
      // Exit math template to text zone
      exitMathTemplate()
      event.preventDefault()
      return
    }
    if (cursor.value.zone === 'matrix') {
      const line = notesStore.getLineById(cursor.value.lineId) as TextLine | MatrixLine | null
      if (line?.type === 'text') {
        cursor.value = { zone: 'text', lineId: line.id, charOffset: 0 }
      } else {
        const lineIndex = notesStore.getLineIndex(cursor.value.lineId)
        if (lineIndex < document.value.length - 1) {
          const nextLine = document.value[lineIndex + 1]
          cursor.value = { zone: 'text', lineId: nextLine.id, charOffset: 0 }
        } else {
          insertNewLine()
        }
      }
    }
    event.preventDefault()
    return
  }
}

// Regular character input
function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const char = target.value

  if (char && char.length > 0) {
    if (cursor.value.zone === 'text') {
      insertCharAtCursor(char)
    } else if (cursor.value.zone === 'matrix') {
      insertCharInMatrix(char)
    } else if (cursor.value.zone === 'mathTemplate') {
      insertCharInSlot(char)
    }
  }

  // Clear input for next keystroke
  target.value = ''
}

function handleBlur() {
  if (!showCommandPalette.value) {
    nextTick(() => {
      hiddenInput.value?.focus()
    })
  }
}

function handleFocus() {
  // Hidden input is always focused
}

// === MATH TEMPLATE SLOT NAVIGATION ===

type MathTemplateCursor = { zone: 'mathTemplate', lineId: string, templateSpanId: string, slotName: string, slotOffset: number }

function navigateSlotNext() {
  const data = getTemplateByCursor()
  if (!data) return
  const cur = cursor.value as MathTemplateCursor

  const template = mathTemplates[data.span.templateId]
  if (!template) return

  const currentSlotIndex = template.slots.findIndex(s => s.name === cur.slotName)
  if (currentSlotIndex < template.slots.length - 1) {
    const nextSlot = template.slots[currentSlotIndex + 1]
    const nextVal = data.span.slotValues[nextSlot.name] || ''
    cursor.value = {
      zone: 'mathTemplate',
      lineId: cur.lineId,
      templateSpanId: cur.templateSpanId,
      slotName: nextSlot.name,
      slotOffset: nextVal.length
    }
  } else {
    exitMathTemplate()
  }
}

function navigateSlotPrev() {
  const data = getTemplateByCursor()
  if (!data) return
  const cur = cursor.value as MathTemplateCursor

  const template = mathTemplates[data.span.templateId]
  if (!template) return

  const currentSlotIndex = template.slots.findIndex(s => s.name === cur.slotName)
  if (currentSlotIndex > 0) {
    const prevSlot = template.slots[currentSlotIndex - 1]
    const prevVal = data.span.slotValues[prevSlot.name] || ''
    cursor.value = {
      zone: 'mathTemplate',
      lineId: cur.lineId,
      templateSpanId: cur.templateSpanId,
      slotName: prevSlot.name,
      slotOffset: prevVal.length
    }
  }
}

function exitMathTemplate() {
  const cur = cursor.value as MathTemplateCursor
  const line = notesStore.getLineById(cur.lineId) as TextLine | null
  if (!line || line.type !== 'text') return
  const offsets = getTemplateOffsets(line, cur.templateSpanId)
  const offset = offsets ? offsets.end : 0

  cursor.value = {
    zone: 'text',
    lineId: cur.lineId,
    charOffset: offset
  }
  hiddenInput.value?.focus()
}

function exitMathTemplateBefore() {
  const cur = cursor.value as MathTemplateCursor
  const line = notesStore.getLineById(cur.lineId) as TextLine | null
  if (!line || line.type !== 'text') return
  const offsets = getTemplateOffsets(line, cur.templateSpanId)
  const offset = offsets ? offsets.start : 0
  cursor.value = {
    zone: 'text',
    lineId: cur.lineId,
    charOffset: offset
  }
  hiddenInput.value?.focus()
}

function insertCharInSlot(char: string) {
  if (cursor.value.zone !== 'mathTemplate') return
  const data = getTemplateByCursor()
  if (!data) return

  const currentVal = data.span.slotValues[cursor.value.slotName] || ''
  const offset = cursor.value.slotOffset
  const newVal = currentVal.slice(0, offset) + char + currentVal.slice(offset)
  data.span.slotValues[cursor.value.slotName] = newVal
  cursor.value = { ...cursor.value, slotOffset: offset + char.length }
  updateDocument()
}

function deleteCharInSlot() {
  if (cursor.value.zone !== 'mathTemplate') return
  const data = getTemplateByCursor()
  if (!data) return

  const currentVal = data.span.slotValues[cursor.value.slotName] || ''
  const offset = cursor.value.slotOffset

  if (offset > 0) {
    const newVal = currentVal.slice(0, offset - 1) + currentVal.slice(offset)
    data.span.slotValues[cursor.value.slotName] = newVal
    cursor.value = { ...cursor.value, slotOffset: offset - 1 }
    updateDocument()
  } else if (currentVal === '') {
    // If slot is empty and backspace is pressed, check if we should delete the template
    const template = mathTemplates[data.span.templateId]
    if (!template) return

    // Check if all slots are empty
    const allEmpty = template.slots.every(s => !data.span.slotValues[s.name])
    if (allEmpty) {
      // Delete the entire template span
      const idx = data.line.content.findIndex(
        seg => seg.type === 'mathTemplate' && (seg as MathTemplateSpan).id === data.span.id
      )
      if (idx !== -1) {
        data.line.content.splice(idx, 1)
        // Ensure there's at least one text span
        if (data.line.content.length === 0) {
          data.line.content.push({ type: 'text', value: '' })
        }
        cursor.value = { zone: 'text', lineId: data.line.id, charOffset: 0 }
        updateDocument()
      }
    } else {
      // Move to previous slot
      navigateSlotPrev()
    }
  }
}

function focusMathTemplateSlot(lineId: string, spanId: string, slotName: string) {
  const line = notesStore.getLineById(lineId) as TextLine | null
  if (!line || line.type !== 'text') return
  const span = line.content.find(
    (seg): seg is MathTemplateSpan => seg.type === 'mathTemplate' && seg.id === spanId
  )
  if (!span) return

  const slotVal = span.slotValues[slotName] || ''
  cursor.value = {
    zone: 'mathTemplate',
    lineId,
    templateSpanId: spanId,
    slotName,
    slotOffset: slotVal.length
  }
  hiddenInput.value?.focus()
}

// === NAVIGATION ===

function handleArrowUp() {
  if (cursor.value.zone === 'matrix') {
    const matrixData = getMatrixByCursor()
    if (!matrixData) return
    if (cursor.value.row > 0) {
      cursor.value = { ...cursor.value, row: cursor.value.row - 1 }
    } else {
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId)
      if (lineIndex > 0) {
        const prevLine = document.value[lineIndex - 1]
        cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 }
      }
    }
  } else {
    const currentLineIndex = notesStore.getLineIndex(cursor.value.lineId)
    if (currentLineIndex > 0) {
      const prevLine = document.value[currentLineIndex - 1]
      cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 }
    }
  }
}

function handleArrowDown() {
  if (cursor.value.zone === 'matrix') {
    const matrixData = getMatrixByCursor()
    if (!matrixData) return
    if (cursor.value.row < matrixData.matrix.rows - 1) {
      cursor.value = { ...cursor.value, row: cursor.value.row + 1 }
    } else {
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId)
      if (lineIndex < document.value.length - 1) {
        const nextLine = document.value[lineIndex + 1]
        cursor.value = { zone: 'text', lineId: nextLine.id, charOffset: 0 }
      } else {
        insertNewLine()
      }
    }
  } else {
    const currentLineIndex = notesStore.getLineIndex(cursor.value.lineId)
    if (currentLineIndex < document.value.length - 1) {
      const nextLine = document.value[currentLineIndex + 1]
      if (nextLine.type === 'matrix') {
        cursor.value = { zone: 'matrix', lineId: nextLine.id, matrixId: nextLine.id, row: 0, col: 0 }
      } else {
        cursor.value = { zone: 'text', lineId: nextLine.id, charOffset: 0 }
      }
    }
  }
}

function handleArrowLeft() {
  if (cursor.value.zone === 'text') {
    const currentLine = notesStore.getLineById(cursor.value.lineId)
    if (currentLine?.type !== 'text') {
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId)
      if (lineIndex > 0) {
        const prevLine = document.value[lineIndex - 1]
        cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 }
      }
      return
    }

    if (cursor.value.charOffset > 0) {
      const target = getSegmentAtIndex(currentLine as TextLine, cursor.value.charOffset - 1)
      if (target?.type === 'segment') {
        if (target.segment.type === 'mathTemplate') {
          const span = target.segment as MathTemplateSpan
          const template = mathTemplates[span.templateId]
          if (template) {
            const lastSlot = template.slots[template.slots.length - 1]
            const val = span.slotValues[lastSlot.name] || ''
            cursor.value = {
              zone: 'mathTemplate',
              lineId: (currentLine as TextLine).id,
              templateSpanId: span.id,
              slotName: lastSlot.name,
              slotOffset: val.length
            }
            return
          }
        }
        if (target.segment.type === 'matrix') {
          const matrixSpan = target.segment as MatrixSpan
          cursor.value = {
            zone: 'matrix',
            lineId: (currentLine as TextLine).id,
            matrixId: matrixSpan.id,
            row: matrixSpan.rows - 1,
            col: matrixSpan.cols - 1
          }
          return
        }
      }
      cursor.value = { ...cursor.value, charOffset: cursor.value.charOffset - 1 }
    } else {
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId)
      if (lineIndex > 0) {
        const prevLine = document.value[lineIndex - 1]
        if (prevLine.type === 'text') {
          cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: getLineLength(prevLine as TextLine) }
        } else if (prevLine.type === 'matrix') {
          cursor.value = { zone: 'matrix', lineId: prevLine.id, matrixId: prevLine.id, row: prevLine.rows - 1, col: prevLine.cols - 1 }
        } else {
          cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 }
        }
      }
    }
  } else if (cursor.value.zone === 'matrix') {
    const matrixData = getMatrixByCursor()
    if (!matrixData) return
    if (cursor.value.col > 0) {
      cursor.value = { ...cursor.value, col: cursor.value.col - 1 }
    } else if (cursor.value.row > 0) {
      cursor.value = { ...cursor.value, row: cursor.value.row - 1, col: matrixData.matrix.cols - 1 }
    } else {
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId)
      if (lineIndex > 0) {
        const prevLine = document.value[lineIndex - 1]
        cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 }
      }
    }
  }
}

function handleArrowRight() {
  if (cursor.value.zone === 'text') {
    const currentLine = notesStore.getLineById(cursor.value.lineId)
    if (currentLine?.type !== 'text') {
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId)
      if (lineIndex < document.value.length - 1) {
        const nextLine = document.value[lineIndex + 1]
        cursor.value = { zone: 'text', lineId: nextLine.id, charOffset: 0 }
      } else {
        insertNewLine()
      }
      return
    }

    const lineLength = getLineLength(currentLine as TextLine)
    if (cursor.value.charOffset < lineLength) {
      const target = getSegmentAtIndex(currentLine as TextLine, cursor.value.charOffset)
      if (target?.type === 'segment') {
        if (target.segment.type === 'mathTemplate') {
          const span = target.segment as MathTemplateSpan
          const template = mathTemplates[span.templateId]
          if (template) {
            const firstSlot = template.slots[0]
            cursor.value = {
              zone: 'mathTemplate',
              lineId: (currentLine as TextLine).id,
              templateSpanId: span.id,
              slotName: firstSlot.name,
              slotOffset: 0
            }
            return
          }
        }
        if (target.segment.type === 'matrix') {
          const matrixSpan = target.segment as MatrixSpan
          cursor.value = {
            zone: 'matrix',
            lineId: (currentLine as TextLine).id,
            matrixId: matrixSpan.id,
            row: 0,
            col: 0
          }
          return
        }
      }
      cursor.value = { ...cursor.value, charOffset: cursor.value.charOffset + 1 }
    } else {
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId)
      if (lineIndex < document.value.length - 1) {
        const nextLine = document.value[lineIndex + 1]
        if (nextLine.type === 'matrix') {
          cursor.value = { zone: 'matrix', lineId: nextLine.id, matrixId: nextLine.id, row: 0, col: 0 }
        } else {
          cursor.value = { zone: 'text', lineId: nextLine.id, charOffset: 0 }
        }
      } else {
        insertNewLine()
      }
    }
  } else if (cursor.value.zone === 'matrix') {
    const matrixData = getMatrixByCursor()
    if (!matrixData) return
    if (cursor.value.col < matrixData.matrix.cols - 1) {
      cursor.value = { ...cursor.value, col: cursor.value.col + 1 }
    } else if (cursor.value.row < matrixData.matrix.rows - 1) {
      cursor.value = { ...cursor.value, row: cursor.value.row + 1, col: 0 }
    } else {
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId)
      if (lineIndex < document.value.length - 1) {
        const nextLine = document.value[lineIndex + 1]
        cursor.value = { zone: 'text', lineId: nextLine.id, charOffset: 0 }
      } else {
        insertNewLine()
      }
    }
  }
}

// === INSERTION OPERATIONS ===

function insertCharAtCursor(char: string) {
  if (cursor.value.zone !== 'text') return

  const currentLine = notesStore.getLineById(cursor.value.lineId) as TextLine | MathExpressionLine | null
  if (!currentLine || currentLine.type !== 'text') return
  const offset = cursor.value.charOffset
  const target = findOffsetTarget(currentLine, offset)

  if (target.type === 'text') {
    const seg = currentLine.content[target.index] as TextSpan
    seg.value = seg.value.slice(0, target.innerOffset) + char + seg.value.slice(target.innerOffset)
  } else if (target.type === 'before') {
    currentLine.content.splice(target.index, 0, { type: 'text', value: char })
  } else if (target.type === 'after') {
    currentLine.content.splice(target.index + 1, 0, { type: 'text', value: char })
  } else {
    currentLine.content.push({ type: 'text', value: char })
  }

  normalizeTextLine(currentLine)
  cursor.value = { ...cursor.value, charOffset: offset + char.length }
  updateDocument()
}

function insertCharInMatrix(char: string) {
  if (cursor.value.zone !== 'matrix') return

  const matrixData = getMatrixByCursor()
  if (!matrixData) return
  const matrix = matrixData.matrix

  matrix.data[cursor.value.row][cursor.value.col] = char

  if (cursor.value.col < matrix.cols - 1) {
    cursor.value = { ...cursor.value, col: cursor.value.col + 1 }
  } else if (cursor.value.row < matrix.rows - 1) {
    cursor.value = { ...cursor.value, row: cursor.value.row + 1, col: 0 }
  }

  updateDocument()
}

function deleteCharAtCursor() {
  if (cursor.value.zone === 'text') {
    const currentLine = notesStore.getLineById(cursor.value.lineId) as TextLine | MathExpressionLine | null
    if (!currentLine) return

    if (currentLine.type === 'math' && notesStore.activeNote) {
      const lineIndex = notesStore.getLineIndex(cursor.value.lineId)
      notesStore.activeNote.content.splice(lineIndex, 1)
      if (lineIndex > 0) {
        const prevLine = document.value[lineIndex - 1]
        cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 }
      } else if (document.value.length > 0) {
        cursor.value = { zone: 'text', lineId: document.value[0].id, charOffset: 0 }
      } else {
        insertNewLine()
      }
      updateDocument()
      return
    }

    if (currentLine.type !== 'text') return

    const offset = cursor.value.charOffset
    if (offset === 0) {
      if (currentLine.content.length === 1 &&
          currentLine.content[0].type === 'text' &&
          (currentLine.content[0] as TextSpan).value === '' &&
          notesStore.activeNote &&
          notesStore.activeNote.content.length > 1) {
        const lineIndex = notesStore.getLineIndex(cursor.value.lineId)
        notesStore.activeNote.content.splice(lineIndex, 1)

        if (lineIndex > 0) {
          const prevLine = document.value[lineIndex - 1]
          cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 }
        } else if (document.value.length > 0) {
          cursor.value = { zone: 'text', lineId: document.value[0].id, charOffset: 0 }
        }
        updateDocument()
      }
      return
    }

    const target = getSegmentAtIndex(currentLine, offset - 1)
    if (!target) return

    if (target.type === 'textChar') {
      const seg = currentLine.content[target.index] as TextSpan
      seg.value = seg.value.slice(0, target.charIndex) + seg.value.slice(target.charIndex + 1)
      normalizeTextLine(currentLine)
      cursor.value = { ...cursor.value, charOffset: Math.max(0, offset - 1) }
      updateDocument()
    } else if (target.type === 'segment') {
      if (target.segment.type === 'mathTemplate') {
        const span = target.segment as MathTemplateSpan
        const template = mathTemplates[span.templateId]
        if (template) {
          const lastSlot = template.slots[template.slots.length - 1]
          const val = span.slotValues[lastSlot.name] || ''
          cursor.value = {
            zone: 'mathTemplate',
            lineId: currentLine.id,
            templateSpanId: span.id,
            slotName: lastSlot.name,
            slotOffset: val.length
          }
          return
        }
      }
      currentLine.content.splice(target.index, 1)
      normalizeTextLine(currentLine)
      cursor.value = { ...cursor.value, charOffset: Math.max(0, offset - 1) }
      updateDocument()
    }
  } else if (cursor.value.zone === 'matrix') {
    const matrixData = getMatrixByCursor()
    if (!matrixData) return

    const isEmpty = matrixData.matrix.data.every(row => row.every(cell => cell === ''))

    if (isEmpty && notesStore.activeNote && notesStore.activeNote.content.length > 1) {
      if (matrixData.line.type === 'text') {
        matrixData.line.content = matrixData.line.content.filter(
          (segment) => !(segment.type === 'matrix' && (segment as MatrixSpan).id === (cursor.value as { zone: 'matrix', matrixId: string }).matrixId)
        )
        cursor.value = { zone: 'text', lineId: matrixData.line.id, charOffset: 0 }
        updateDocument()
      } else {
        const lineIndex = notesStore.getLineIndex(cursor.value.lineId)
        notesStore.activeNote.content.splice(lineIndex, 1)

        if (lineIndex > 0) {
          const prevLine = document.value[lineIndex - 1]
          cursor.value = { zone: 'text', lineId: prevLine.id, charOffset: 0 }
        } else if (document.value.length > 0) {
          cursor.value = { zone: 'text', lineId: document.value[0].id, charOffset: 0 }
        }
        updateDocument()
      }
    } else {
      matrixData.matrix.data[cursor.value.row][cursor.value.col] = ''
      updateDocument()
    }
  }
}

function insertNewLine() {
  // If in math template, exit first
  if (cursor.value.zone === 'mathTemplate') {
    exitMathTemplate()
  }

  const lineIndex = notesStore.getLineIndex(cursor.value.lineId)
  const newLine: TextLine = {
    id: generateId(),
    type: 'text',
    content: [{ type: 'text', value: '' }]
  }

  if (notesStore.activeNote) {
    notesStore.activeNote.content.splice(lineIndex + 1, 0, newLine)
    updateDocument()
    cursor.value = { zone: 'text', lineId: newLine.id, charOffset: 0 }
  }
}

// === TEMPLATE INSERTION ===

function insertTemplate(templateId: string) {
  const template = mathTemplates[templateId]
  if (!template) return

  // Ensure we're on a text line
  let targetLine = notesStore.getLineById(cursor.value.lineId) as TextLine | null
  if (!targetLine || targetLine.type !== 'text') {
    // Create a new text line if needed
    const lineIndex = notesStore.getLineIndex(cursor.value.lineId)
    const newLine: TextLine = {
      id: generateId(),
      type: 'text',
      content: [{ type: 'text', value: '' }]
    }
    if (notesStore.activeNote) {
      notesStore.activeNote.content.splice(lineIndex + 1, 0, newLine)
      targetLine = newLine
    } else {
      return
    }
  }

  // Create the template span
  const spanId = generateId()
  const slotValues: Record<string, string> = {}
  for (const slot of template.slots) {
    slotValues[slot.name] = slot.defaultValue
  }

  const templateSpan: MathTemplateSpan = {
    id: spanId,
    type: 'mathTemplate',
    templateId,
    slotValues
  }

  // Insert into the text line content at cursor
  const insertOffset = cursor.value.zone === 'text' ? cursor.value.charOffset : getLineLength(targetLine)
  const target = findOffsetTarget(targetLine, insertOffset)
  if (target.type === 'text') {
    const seg = targetLine.content[target.index] as TextSpan
    const before = seg.value.slice(0, target.innerOffset)
    const after = seg.value.slice(target.innerOffset)
    const segments: Array<TextSpan | MathTemplateSpan> = []
    if (before) segments.push({ type: 'text', value: before })
    segments.push(templateSpan)
    if (after) segments.push({ type: 'text', value: after })
    targetLine.content.splice(target.index, 1, ...segments)
  } else if (target.type === 'before') {
    targetLine.content.splice(target.index, 0, templateSpan)
  } else if (target.type === 'after') {
    targetLine.content.splice(target.index + 1, 0, templateSpan)
  } else {
    targetLine.content.push(templateSpan)
  }

  normalizeTextLine(targetLine)

  // Focus the first slot
  const firstSlot = template.slots[0]
  cursor.value = {
    zone: 'mathTemplate',
    lineId: targetLine.id,
    templateSpanId: spanId,
    slotName: firstSlot.name,
    slotOffset: slotValues[firstSlot.name]?.length || 0
  }

  updateDocument()
  closeCommandPalette()
  hiddenInput.value?.focus()
}

// === INLINE SYMBOL INSERTION ===

function insertInlineSymbol(symbolId: string) {
  const symbolDef = inlineSymbols[symbolId]
  if (!symbolDef) return

  let targetLine = notesStore.getLineById(cursor.value.lineId) as TextLine | null

  // If in math template, insert the symbol's latex directly into the slot
  if (cursor.value.zone === 'mathTemplate') {
    const data = getTemplateByCursor()
    if (data) {
      const currentVal = data.span.slotValues[cursor.value.slotName] || ''
      const offset = cursor.value.slotOffset
      const newVal = currentVal.slice(0, offset) + symbolDef.latex + currentVal.slice(offset)
      data.span.slotValues[cursor.value.slotName] = newVal
      cursor.value = { ...cursor.value, slotOffset: offset + symbolDef.latex.length }
      updateDocument()
      hiddenInput.value?.focus()
      return
    }
  }

  if (!targetLine || targetLine.type !== 'text') {
    const lineIndex = notesStore.getLineIndex(cursor.value.lineId)
    const newLine: TextLine = {
      id: generateId(),
      type: 'text',
      content: [{ type: 'text', value: '' }]
    }
    if (notesStore.activeNote) {
      notesStore.activeNote.content.splice(lineIndex + 1, 0, newLine)
      targetLine = newLine
    } else {
      return
    }
  }

  const symbolSpan: SymbolSpan = {
    type: 'symbol',
    value: symbolId,
    display: symbolDef.display,
    latex: symbolDef.latex
  }

  const prevOffset = cursor.value.zone === 'text' ? cursor.value.charOffset : getLineLength(targetLine)
  const target = findOffsetTarget(targetLine, prevOffset)
  if (target.type === 'text') {
    const seg = targetLine.content[target.index] as TextSpan
    const before = seg.value.slice(0, target.innerOffset)
    const after = seg.value.slice(target.innerOffset)
    const segments: Array<TextSpan | SymbolSpan> = []
    if (before) segments.push({ type: 'text', value: before })
    segments.push(symbolSpan)
    if (after) segments.push({ type: 'text', value: after })
    targetLine.content.splice(target.index, 1, ...segments)
  } else if (target.type === 'before') {
    targetLine.content.splice(target.index, 0, symbolSpan)
  } else if (target.type === 'after') {
    targetLine.content.splice(target.index + 1, 0, symbolSpan)
  } else {
    targetLine.content.push(symbolSpan)
  }
  normalizeTextLine(targetLine)
  cursor.value = {
    zone: 'text',
    lineId: targetLine.id,
    charOffset: prevOffset + 1
  }

  updateDocument()
  closeCommandPalette()
  hiddenInput.value?.focus()
}

function insertMatrix(rows: number, cols: number) {
  const currentLine = notesStore.getLineById(cursor.value.lineId) as TextLine | MatrixLine | MathExpressionLine | null
  if (currentLine?.type === 'text') {
    const matrixSpan: MatrixSpan = {
      id: generateId(),
      type: 'matrix',
      rows,
      cols,
      data: Array(rows).fill(null).map(() => Array(cols).fill(''))
    }
    const insertOffset = cursor.value.zone === 'text' ? cursor.value.charOffset : getLineLength(currentLine)
    const target = findOffsetTarget(currentLine, insertOffset)
    if (target.type === 'text') {
      const seg = currentLine.content[target.index] as TextSpan
      const before = seg.value.slice(0, target.innerOffset)
      const after = seg.value.slice(target.innerOffset)
      const segments: Array<TextSpan | MatrixSpan> = []
      if (before) segments.push({ type: 'text', value: before })
      segments.push(matrixSpan)
      if (after) segments.push({ type: 'text', value: after })
      currentLine.content.splice(target.index, 1, ...segments)
    } else if (target.type === 'before') {
      currentLine.content.splice(target.index, 0, matrixSpan)
    } else if (target.type === 'after') {
      currentLine.content.splice(target.index + 1, 0, matrixSpan)
    } else {
      currentLine.content.push(matrixSpan)
    }
    normalizeTextLine(currentLine)
    updateDocument()

    cursor.value = {
      zone: 'matrix',
      lineId: currentLine.id,
      matrixId: matrixSpan.id,
      row: 0,
      col: 0
    }
    closeCommandPalette()
    return
  }

  const lineIndex = notesStore.getLineIndex(cursor.value.lineId)
  const newMatrixLine: MatrixLine = {
    id: generateId(),
    type: 'matrix',
    rows,
    cols,
    data: Array(rows).fill(null).map(() => Array(cols).fill(''))
  }

  if (notesStore.activeNote) {
    notesStore.activeNote.content.splice(lineIndex + 1, 0, newMatrixLine)
    updateDocument()

    cursor.value = {
      zone: 'matrix',
      lineId: newMatrixLine.id,
      matrixId: newMatrixLine.id,
      row: 0,
      col: 0
    }
  }

  closeCommandPalette()
}

function updateMathLatex(lineId: string, latex: string) {
  const line = notesStore.getLineById(lineId) as MathExpressionLine | null
  if (line && line.type === 'math') {
    line.latex = latex
    updateDocument()
  }
}

function focusMathExpression(lineId: string) {
  cursor.value = {
    zone: 'text',
    lineId,
    charOffset: 0
  }
}

function blurMathExpression() {
  hiddenInput.value?.focus()
}

function focusMatrixCell(lineId: string, matrixId: string, row: number, col: number) {
  cursor.value = {
    zone: 'matrix',
    lineId,
    matrixId,
    row,
    col
  }
  hiddenInput.value?.focus()
}

function handleDisplayClick(event: MouseEvent) {
  const target = event.target as HTMLElement

  const editorDisplay = window.document.querySelector('.editor-display') as HTMLElement | null
  if (!editorDisplay?.contains(target)) return

  // Click on matrix cell
  if (target.classList.contains('matrix-cell-textbook')) {
    const cellEl = target
    const lineEl = cellEl.closest('[data-line-id]')
    const matrixId = cellEl.getAttribute('data-matrix-id')
    if (lineEl) {
      const lineId = lineEl.getAttribute('data-line-id')
      const row = parseInt(cellEl.getAttribute('data-row') || '0')
      const col = parseInt(cellEl.getAttribute('data-col') || '0')
      if (lineId && matrixId) {
        focusMatrixCell(lineId, matrixId, row, col)
      }
    }
    return
  }

  // Click on math template
  const mathTemplateEl = target.closest('.math-template')
  if (mathTemplateEl) {
    // MathTemplate component handles its own clicks
    return
  }

  // Click on text line
  const lineEl = target.closest('.container-line')
  if (lineEl) {
    const lineId = lineEl.getAttribute('data-line-id')
    if (lineId) {
      const line = notesStore.getLineById(lineId) as TextLine | null
      if (line && line.type === 'text') {
        setCursorAtOffset(lineId, getLineLength(line))
      } else {
        cursor.value = {
          zone: 'text',
          lineId: lineId,
          charOffset: 0
        }
        hiddenInput.value?.focus()
      }
    }
    return
  }

  if (document.value.length > 0) {
    const lastLine = document.value[document.value.length - 1]
    cursor.value = {
      zone: 'text',
      lineId: lastLine.id,
      charOffset: 0
    }
  } else {
    insertNewLine()
  }
  hiddenInput.value?.focus()
}

// === COMMAND PALETTE ===

function handlePaletteKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    selectedCommandIndex.value = Math.min(selectedCommandIndex.value + 1, filteredCommands.value.length - 1)
    event.preventDefault()
  } else if (event.key === 'ArrowUp') {
    selectedCommandIndex.value = Math.max(selectedCommandIndex.value - 1, 0)
    event.preventDefault()
  } else if (event.key === 'Enter') {
    if (filteredCommands.value[selectedCommandIndex.value]) {
      executeCommand(filteredCommands.value[selectedCommandIndex.value])
    }
    event.preventDefault()
  } else if (event.key === 'Escape') {
    closeCommandPalette()
    event.preventDefault()
  }
}

function executeCommand(cmd: Command) {
  if (cmd.category === 'matrix') {
    const [, size] = cmd.id.split('-')
    const [rows, cols] = size.split('x').map(Number)
    insertMatrix(rows, cols)
  } else if (cmd.category === 'template') {
    // Extract template ID from command ID (format: tpl-templateId)
    const templateId = cmd.id.replace('tpl-', '')
    insertTemplate(templateId)
  } else if (cmd.category === 'symbol' || cmd.category === 'operator') {
    // Extract symbol ID from command ID (format: sym-symbolId)
    const symbolId = cmd.id.replace('sym-', '')
    insertInlineSymbol(symbolId)
  }
}

function closeCommandPalette() {
  showCommandPalette.value = false
  commandQuery.value = ''
  hiddenInput.value?.focus()
}

// === HELPER FUNCTIONS ===

function createNewNote() {
  notesStore.createNote()
}

function toggleTheme() {
  editorStore.toggleTheme()
}

function updateNoteTitle() {
  if (notesStore.activeNote) {
    notesStore.activeNote.updatedAt = Date.now()
  }
}

function updateDocument() {
  if (notesStore.activeNote) {
    notesStore.activeNote.updatedAt = Date.now()
  }
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString()
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

type LineToken =
  | { type: 'caret'; key: string }
  | { type: 'char'; key: string; value: string; offset: number }
  | { type: 'symbol' | 'mathTemplate' | 'matrix'; key: string; segment: SymbolSpan | MathTemplateSpan | MatrixSpan; segmentIndex: number; offset: number }

function getLineLength(line: TextLine): number {
  return line.content.reduce((sum, seg) => sum + (seg.type === 'text' ? (seg as TextSpan).value.length : 1), 0)
}

function getLineTokens(line: TextLine): LineToken[] {
  const tokens: LineToken[] = []
  let offset = 0
  line.content.forEach((seg, segIndex) => {
    if (seg.type === 'text') {
      const value = (seg as TextSpan).value
      for (let i = 0; i < value.length; i++) {
        tokens.push({
          type: 'char',
          key: `${line.id}-char-${offset}`,
          value: value[i],
          offset
        })
        offset += 1
      }
    } else {
      tokens.push({
        type: seg.type,
        key: `${line.id}-${seg.type}-${segIndex}`,
        segment: seg as SymbolSpan | MathTemplateSpan | MatrixSpan,
        segmentIndex: segIndex,
        offset
      })
      offset += 1
    }
  })

  if (cursor.value.zone === 'text' && cursor.value.lineId === line.id) {
    const caretOffset = Math.max(0, Math.min(cursor.value.charOffset, offset))
    const caretToken: LineToken = { type: 'caret', key: `${line.id}-caret-${caretOffset}` }
    const insertIndex = tokens.findIndex((token) => 'offset' in token && token.offset >= caretOffset)
    if (insertIndex === -1) {
      tokens.push(caretToken)
    } else {
      tokens.splice(insertIndex, 0, caretToken)
    }
  }

  return tokens
}

function setCursorAtOffset(lineId: string, offset: number) {
  const line = notesStore.getLineById(lineId) as TextLine | null
  if (!line || line.type !== 'text') return
  const clampedOffset = Math.max(0, Math.min(offset, getLineLength(line)))
  cursor.value = {
    zone: 'text',
    lineId,
    charOffset: clampedOffset
  }
  hiddenInput.value?.focus()
}

type OffsetTarget =
  | { type: 'text'; index: number; innerOffset: number }
  | { type: 'before'; index: number }
  | { type: 'after'; index: number }
  | { type: 'end' }

function findOffsetTarget(line: TextLine, offset: number): OffsetTarget {
  let pos = 0
  for (let i = 0; i < line.content.length; i++) {
    const seg = line.content[i]
    if (seg.type === 'text') {
      const length = (seg as TextSpan).value.length
      if (offset <= pos + length) {
        return { type: 'text', index: i, innerOffset: offset - pos }
      }
      pos += length
    } else {
      if (offset === pos) {
        return { type: 'before', index: i }
      }
      if (offset === pos + 1) {
        return { type: 'after', index: i }
      }
      pos += 1
    }
  }
  return { type: 'end' }
}

type SegmentTarget =
  | { type: 'textChar'; index: number; charIndex: number }
  | { type: 'segment'; index: number; segment: SymbolSpan | MathTemplateSpan | MatrixSpan }

function getSegmentAtIndex(line: TextLine, index: number): SegmentTarget | null {
  let pos = 0
  for (let i = 0; i < line.content.length; i++) {
    const seg = line.content[i]
    if (seg.type === 'text') {
      const value = (seg as TextSpan).value
      if (index < pos + value.length) {
        return { type: 'textChar', index: i, charIndex: index - pos }
      }
      pos += value.length
    } else {
      if (index === pos) {
        return { type: 'segment', index: i, segment: seg as SymbolSpan | MathTemplateSpan | MatrixSpan }
      }
      pos += 1
    }
  }
  return null
}

function normalizeTextLine(line: TextLine) {
  const normalized: Array<TextSpan | SymbolSpan | MathTemplateSpan | MatrixSpan> = []
  for (const seg of line.content) {
    if (seg.type === 'text') {
      const value = (seg as TextSpan).value
      if (value === '') {
        continue
      }
      const last = normalized[normalized.length - 1]
      if (last?.type === 'text') {
        (last as TextSpan).value += value
      } else {
        normalized.push({ type: 'text', value })
      }
    } else {
      normalized.push(seg)
    }
  }
  if (normalized.length === 0) {
    normalized.push({ type: 'text', value: '' })
  }
  line.content = normalized
}

function getTemplateOffsets(line: TextLine, templateSpanId: string): { start: number; end: number } | null {
  let offset = 0
  for (const seg of line.content) {
    if (seg.type === 'mathTemplate' && (seg as MathTemplateSpan).id === templateSpanId) {
      return { start: offset, end: offset + 1 }
    }
    offset += seg.type === 'text' ? (seg as TextSpan).value.length : 1
  }
  return null
}
</script>

<style scoped>
.math-writer {
  display: grid;
  grid-template-columns: 240px 1fr 280px;
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
}

.theme-icon {
  font-size: 16px;
  line-height: 1;
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
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
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
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.toolbar-select {
  min-width: 76px;
  height: 30px;
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.toolbar-btn {
  width: 30px;
  height: 30px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.toolbar-btn:hover {
  border-color: var(--color-accent);
}

.toolbar-btn.active {
  background: var(--color-accent-light);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.underline-icon {
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
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
  padding: 2rem 3rem;
  padding-left: 4.75rem;
  overflow-y: auto;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 1rem;
  line-height: var(--math-row-line-height);
  color: var(--color-text-primary);
  outline: none;
  user-select: none;
  position: relative;
  background: var(--color-bg-primary);
}

/* Container lines */
.container-line {
  display: block;
  min-height: 1.75em;
  position: relative;
  word-wrap: break-word;
  margin: 0;
  padding: 0.125em 0;
  line-height: var(--math-row-line-height);
}

.container-line::before {
  content: attr(data-line-number);
  position: absolute;
  left: -3rem;
  top: 50%;
  transform: translateY(-50%);
  width: 2.25rem;
  font-size: var(--math-font-size-line-number);
  line-height: 1;
  color: var(--color-text-tertiary);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Text characters */
.text-char {
  display: inline;
  font-family: inherit;
  font-size: inherit;
  white-space: pre;
  cursor: text;
}

/* Inline symbol rendering (KaTeX) */
.symbol-inline {
  display: inline-flex;
  align-items: baseline;
  vertical-align: baseline;
  margin: 0 0.06em;
}

.symbol-render {
  display: inline-block;
}

.symbol-render :deep(.katex) {
  font-size: var(--math-font-size-symbol);
}

.empty-line-placeholder {
  display: inline-block;
  width: 0;
  height: 1.75em;
  vertical-align: baseline;
}

/* CRITICAL: Matrix is INLINE - flows with text */
.matrix-inline {
  display: inline-flex;
  align-items: baseline;
  gap: var(--math-matrix-gap-inline);
  vertical-align: baseline;
  margin: 0 var(--math-matrix-padding-inline);
  padding: 0.06em 0;
  background: transparent;
  border: none;
  border-radius: 0;
  font-family: inherit;
}

.matrix-inline.is-editing {
  opacity: 1;
}

.matrix-bracket {
  width: 0.9em;
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
  min-width: 1.75em;
  min-height: 1.25em;
  padding: 0.06em 0.12em;
  font-family: inherit;
  font-size: 1em;
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
  background: transparent;
  border-bottom: 1px solid currentColor;
  font-weight: 500;
}

.matrix-cell-render {
  display: inline-block;
}

.matrix-cell-render :deep(.katex) {
  font-size: 1em;
}

.matrix-cell-textbook:hover {
  background: transparent;
}

/* Custom caret */
.custom-caret {
  display: inline-block;
  width: 1px;
  height: 1.3em;
  background: currentColor;
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
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.palette-icon {
  font-size: 16px;
  color: var(--color-text-tertiary);
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

.palette-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s;
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

.cmd-icon {
  font-size: 18px;
  margin-right: 12px;
  min-width: 28px;
  text-align: center;
  color: var(--color-accent);
}

.cmd-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.cmd-name {
  font-size: 14px;
  font-weight: 500;
}

.cmd-desc {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 1px;
}

.cmd-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  background: var(--color-accent-light);
  color: var(--color-accent);
  font-weight: 600;
  text-transform: uppercase;
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
}

.keypad-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.keypad-grid-2col {
  grid-template-columns: repeat(2, 1fr);
}

.keypad-btn {
  padding: 8px 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  cursor: pointer;
  transition: all 0.15s;
  font-size: 16px;
  text-align: center;
  color: var(--color-text-primary);
}

.keypad-btn:hover {
  background: var(--color-accent-light);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.keypad-btn:active {
  transform: scale(0.96);
}

/* Template buttons - larger, with label */
.keypad-btn-template {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 6px;
}

.btn-symbol {
  font-size: 20px;
  line-height: 1.2;
  font-weight: 600;
}

.btn-label {
  font-size: 10px;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.keypad-btn-template:hover .btn-label {
  color: var(--color-accent);
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
  color: var(--color-text-secondary);
}

.shortcut-item kbd {
  padding: 2px 6px;
  font-family: monospace;
  font-size: 10px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  min-width: 24px;
  text-align: center;
}

/* Line highlighting */
.container-line.is-active {
  background: transparent;
  border-radius: 0;
}
</style>
