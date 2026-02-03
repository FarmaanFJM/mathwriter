<template>
  <div class="templates-builder">
    <div class="builder-section">
      <label class="section-label">Fraction</label>
      <div class="fraction-inputs">
        <input
          v-model="mathBuilderStore.fractionNumerator"
          type="text"
          class="text-input"
          placeholder="Numerator"
        />
        <div class="fraction-divider"></div>
        <input
          v-model="mathBuilderStore.fractionDenominator"
          type="text"
          class="text-input"
          placeholder="Denominator"
        />
      </div>
    </div>

    <div class="builder-section">
      <label class="section-label">Exponent (Power)</label>
      <div class="exponent-inputs">
        <input
          v-model="mathBuilderStore.exponentBase"
          type="text"
          class="text-input"
          placeholder="Base"
        />
        <span class="exponent-symbol">^</span>
        <input
          v-model="mathBuilderStore.exponentPower"
          type="text"
          class="text-input small"
          placeholder="Power"
        />
      </div>
    </div>

    <div class="builder-section">
      <label class="section-label">Subscript</label>
      <div class="subscript-inputs">
        <input
          v-model="mathBuilderStore.subscriptBase"
          type="text"
          class="text-input"
          placeholder="Base"
        />
        <span class="subscript-symbol">_</span>
        <input
          v-model="mathBuilderStore.subscriptValue"
          type="text"
          class="text-input small"
          placeholder="Subscript"
        />
      </div>
    </div>

    <div class="builder-section">
      <label class="section-label">Quick Templates</label>
      <div class="templates-grid">
        <button class="template-btn" @click="setFraction('a', 'b')">
          <span v-html="renderSymbol('\\frac{a}{b}')"></span>
        </button>
        <button class="template-btn" @click="setExponent('x', '2')">
          <span v-html="renderSymbol('x^2')"></span>
        </button>
        <button class="template-btn" @click="setExponent('e', 'x')">
          <span v-html="renderSymbol('e^x')"></span>
        </button>
        <button class="template-btn" @click="setSubscript('x', 'i')">
          <span v-html="renderSymbol('x_i')"></span>
        </button>
        <button class="template-btn" @click="setSubscript('a', 'n')">
          <span v-html="renderSymbol('a_n')"></span>
        </button>
        <button class="template-btn" @click="insertSymbol('\\sqrt{x}')">
          <span v-html="renderSymbol('\\sqrt{x}')"></span>
        </button>
      </div>
    </div>

    <div class="builder-section">
      <label class="section-label">Parentheses & Brackets</label>
      <div class="brackets-grid">
        <button class="bracket-btn" @click="insertSymbol('(x)')">
          <span v-html="renderSymbol('(x)')"></span>
        </button>
        <button class="bracket-btn" @click="insertSymbol('[x]')">
          <span v-html="renderSymbol('[x]')"></span>
        </button>
        <button class="bracket-btn" @click="insertSymbol('\\{x\\}')">
          <span v-html="renderSymbol('\\{x\\}')"></span>
        </button>
        <button class="bracket-btn" @click="insertSymbol('\\langle x \\rangle')">
          <span v-html="renderSymbol('\\langle x \\rangle')"></span>
        </button>
        <button class="bracket-btn" @click="insertSymbol('|x|')">
          <span v-html="renderSymbol('|x|')"></span>
        </button>
        <button class="bracket-btn" @click="insertSymbol('\\|x\\|')">
          <span v-html="renderSymbol('\\|x\\|')"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMathBuilderStore } from '../../stores/mathBuilderStore';
import { useNotesStore } from '../../stores/notesStore';
import { useEditorStore } from '../../stores/editorStore';
import katex from 'katex';

const mathBuilderStore = useMathBuilderStore();
const notesStore = useNotesStore();
const editorStore = useEditorStore();

function setFraction(numerator: string, denominator: string) {
  mathBuilderStore.fractionNumerator = numerator;
  mathBuilderStore.fractionDenominator = denominator;
}

function setExponent(base: string, power: string) {
  mathBuilderStore.exponentBase = base;
  mathBuilderStore.exponentPower = power;
}

function setSubscript(base: string, subscript: string) {
  mathBuilderStore.subscriptBase = base;
  mathBuilderStore.subscriptValue = subscript;
}

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
  const ast = mathBuilderStore.createSymbolAst(latex);
  const position = editorStore.caretPosition;
  
  notesStore.addMathBlock({
    type: 'math',
    inline: true,
    ast,
    latex,
  }, position + 1);
}
</script>

<style scoped>
.templates-builder {
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

.text-input {
  height: 40px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
}

.text-input.small {
  width: 80px;
}

.fraction-inputs {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.fraction-divider {
  height: 2px;
  background: var(--color-border);
  margin: var(--spacing-xs) 0;
}

.exponent-inputs,
.subscript-inputs {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.exponent-symbol,
.subscript-symbol {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-tertiary);
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.template-btn {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  font-size: var(--font-size-lg);
  transition: all var(--transition-fast);
}

.template-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-light);
  transform: scale(1.05);
}

.brackets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.bracket-btn {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  font-size: var(--font-size-lg);
  transition: all var(--transition-fast);
}

.bracket-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-light);
  transform: scale(1.05);
}
</style>
