<template>
  <div class="symbols-panel">
    <div class="builder-section">
      <label class="section-label">Greek Letters</label>
      <div class="symbols-grid">
        <button
          v-for="symbol in greekLetters"
          :key="symbol.latex"
          class="symbol-btn"
          @click="insertSymbol(symbol.latex)"
          :title="symbol.name"
        >
          <span v-html="renderSymbol(symbol.latex)"></span>
        </button>
      </div>
    </div>

    <div class="builder-section">
      <label class="section-label">Operators</label>
      <div class="symbols-grid">
        <button
          v-for="symbol in operators"
          :key="symbol.latex"
          class="symbol-btn"
          @click="insertSymbol(symbol.latex)"
          :title="symbol.name"
        >
          <span v-html="renderSymbol(symbol.latex)"></span>
        </button>
      </div>
    </div>

    <div class="builder-section">
      <label class="section-label">Relations</label>
      <div class="symbols-grid">
        <button
          v-for="symbol in relations"
          :key="symbol.latex"
          class="symbol-btn"
          @click="insertSymbol(symbol.latex)"
          :title="symbol.name"
        >
          <span v-html="renderSymbol(symbol.latex)"></span>
        </button>
      </div>
    </div>

    <div class="builder-section">
      <label class="section-label">Special Symbols</label>
      <div class="symbols-grid">
        <button
          v-for="symbol in specialSymbols"
          :key="symbol.latex"
          class="symbol-btn"
          @click="insertSymbol(symbol.latex)"
          :title="symbol.name"
        >
          <span v-html="renderSymbol(symbol.latex)"></span>
        </button>
      </div>
    </div>

    <div v-if="selectedSymbols.length > 0" class="selected-symbols">
      <label class="section-label">Selected Symbols</label>
      <div class="selected-list">
        <span
          v-for="(symbol, i) in selectedSymbols"
          :key="i"
          class="selected-symbol"
          v-html="renderSymbol(symbol)"
        ></span>
      </div>
      <button class="clear-btn" @click="clearSelection">Clear</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMathBuilderStore } from '../../stores/mathBuilderStore';
import { useNotesStore } from '../../stores/notesStore';
import { useEditorStore } from '../../stores/editorStore';
import { astToLatex } from '../../utils/mathConverter';
import katex from 'katex';

const mathBuilderStore = useMathBuilderStore();
const notesStore = useNotesStore();
const editorStore = useEditorStore();

const selectedSymbols = ref<string[]>([]);

const greekLetters = [
  { latex: '\\alpha', name: 'alpha' },
  { latex: '\\beta', name: 'beta' },
  { latex: '\\gamma', name: 'gamma' },
  { latex: '\\delta', name: 'delta' },
  { latex: '\\epsilon', name: 'epsilon' },
  { latex: '\\theta', name: 'theta' },
  { latex: '\\lambda', name: 'lambda' },
  { latex: '\\mu', name: 'mu' },
  { latex: '\\pi', name: 'pi' },
  { latex: '\\sigma', name: 'sigma' },
  { latex: '\\phi', name: 'phi' },
  { latex: '\\omega', name: 'omega' },
];

const operators = [
  { latex: '+', name: 'plus' },
  { latex: '-', name: 'minus' },
  { latex: '\\times', name: 'times' },
  { latex: '\\div', name: 'divide' },
  { latex: '\\cdot', name: 'dot product' },
  { latex: '\\pm', name: 'plus-minus' },
  { latex: '\\mp', name: 'minus-plus' },
  { latex: '\\ast', name: 'asterisk' },
];

const relations = [
  { latex: '=', name: 'equals' },
  { latex: '\\neq', name: 'not equal' },
  { latex: '\\leq', name: 'less than or equal' },
  { latex: '\\geq', name: 'greater than or equal' },
  { latex: '<', name: 'less than' },
  { latex: '>', name: 'greater than' },
  { latex: '\\approx', name: 'approximately' },
  { latex: '\\equiv', name: 'equivalent' },
];

const specialSymbols = [
  { latex: '\\infty', name: 'infinity' },
  { latex: '\\partial', name: 'partial derivative' },
  { latex: '\\nabla', name: 'nabla' },
  { latex: '\\sum', name: 'summation' },
  { latex: '\\prod', name: 'product' },
  { latex: '\\int', name: 'integral' },
  { latex: '\\sqrt{}', name: 'square root' },
  { latex: '\\angle', name: 'angle' },
  { latex: '\\perp', name: 'perpendicular' },
  { latex: '\\parallel', name: 'parallel' },
  { latex: '\\in', name: 'element of' },
  { latex: '\\notin', name: 'not element of' },
];

function renderSymbol(latex: string): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: false,
    });
  } catch (error) {
    return latex;
  }
}

function insertSymbol(latex: string) {
  selectedSymbols.value.push(latex);
  
  // If in edit mode, don't auto-insert
  if (mathBuilderStore.mode === 'edit') return;
  
  // Auto-insert single symbols as inline math
  const ast = mathBuilderStore.createSymbolAst(latex);
  const position = editorStore.caretPosition;
  
  notesStore.addMathBlock({
    type: 'math',
    inline: true,
    ast,
    latex,
  }, position + 1);
}

function clearSelection() {
  selectedSymbols.value = [];
}
</script>

<style scoped>
.symbols-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.builder-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.section-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.symbols-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
}

.symbol-btn {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  font-size: var(--font-size-lg);
  transition: all var(--transition-fast);
}

.symbol-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-light);
  transform: scale(1.05);
}

.symbol-btn:active {
  transform: scale(0.95);
}

.selected-symbols {
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin: var(--spacing-sm) 0;
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  min-height: 48px;
}

.selected-symbol {
  font-size: var(--font-size-lg);
}

.clear-btn {
  width: 100%;
  height: 36px;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.clear-btn:hover {
  border-color: var(--color-danger);
  background: var(--color-danger-light);
  color: var(--color-danger);
}
</style>
