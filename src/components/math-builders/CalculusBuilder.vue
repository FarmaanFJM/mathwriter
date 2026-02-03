<template>
  <div class="calculus-builder">
    <div class="builder-section">
      <label class="section-label">Integral</label>
      
      <div class="input-group">
        <label class="input-label">Integrand (function)</label>
        <input
          v-model="mathBuilderStore.integralBody"
          type="text"
          class="text-input"
          placeholder="e.g., x^2"
        />
      </div>

      <div class="input-group">
        <label class="input-label">Differential variable</label>
        <input
          v-model="mathBuilderStore.integralVariable"
          type="text"
          class="text-input"
          placeholder="e.g., x"
        />
      </div>

      <div class="bounds-group">
        <div class="input-group">
          <label class="input-label">Lower bound (optional)</label>
          <input
            v-model="mathBuilderStore.integralFrom"
            type="text"
            class="text-input"
            placeholder="e.g., 0"
          />
        </div>
        <div class="input-group">
          <label class="input-label">Upper bound (optional)</label>
          <input
            v-model="mathBuilderStore.integralTo"
            type="text"
            class="text-input"
            placeholder="e.g., ∞"
          />
        </div>
      </div>

      <div class="help-text">
        Leave bounds empty for indefinite integral
      </div>
    </div>

    <div class="builder-section">
      <label class="section-label">Quick Integrals</label>
      <div class="quick-buttons">
        <button class="quick-btn" @click="setIntegral('x', 'x', '', '')">
          ∫ x dx
        </button>
        <button class="quick-btn" @click="setIntegral('x^2', 'x', '', '')">
          ∫ x² dx
        </button>
        <button class="quick-btn" @click="setIntegral('\\sin(x)', 'x', '', '')">
          ∫ sin(x) dx
        </button>
        <button class="quick-btn" @click="setIntegral('\\cos(x)', 'x', '', '')">
          ∫ cos(x) dx
        </button>
        <button class="quick-btn" @click="setIntegral('e^x', 'x', '', '')">
          ∫ eˣ dx
        </button>
        <button class="quick-btn" @click="setIntegral('\\frac{1}{x}', 'x', '', '')">
          ∫ 1/x dx
        </button>
        <button class="quick-btn" @click="setIntegral('f(x)', 'x', 'a', 'b')">
          ∫ₐᵇ f(x) dx
        </button>
        <button class="quick-btn" @click="setIntegral('f(x)', 'x', '0', '\\infty')">
          ∫₀^∞ f(x) dx
        </button>
      </div>
    </div>

    <div class="builder-section">
      <label class="section-label">Other Calculus Operators</label>
      <div class="operators-grid">
        <button class="operator-btn" @click="insertSymbol('\\sum')">
          <span v-html="renderSymbol('\\sum')"></span>
          <span class="operator-label">Sum</span>
        </button>
        <button class="operator-btn" @click="insertSymbol('\\prod')">
          <span v-html="renderSymbol('\\prod')"></span>
          <span class="operator-label">Product</span>
        </button>
        <button class="operator-btn" @click="insertSymbol('\\lim')">
          <span v-html="renderSymbol('\\lim')"></span>
          <span class="operator-label">Limit</span>
        </button>
        <button class="operator-btn" @click="insertSymbol('\\partial')">
          <span v-html="renderSymbol('\\partial')"></span>
          <span class="operator-label">Partial</span>
        </button>
        <button class="operator-btn" @click="insertSymbol('\\nabla')">
          <span v-html="renderSymbol('\\nabla')"></span>
          <span class="operator-label">Nabla</span>
        </button>
        <button class="operator-btn" @click="insertSymbol('\\infty')">
          <span v-html="renderSymbol('\\infty')"></span>
          <span class="operator-label">Infinity</span>
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

function setIntegral(body: string, variable: string, from: string, to: string) {
  mathBuilderStore.integralBody = body;
  mathBuilderStore.integralVariable = variable;
  mathBuilderStore.integralFrom = from;
  mathBuilderStore.integralTo = to;
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
.calculus-builder {
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

.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.input-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
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

.bounds-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-sm);
}

.help-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  font-style: italic;
}

.quick-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
}

.quick-btn {
  height: 40px;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.quick-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-light);
  color: var(--color-accent);
}

.operators-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.operator-btn {
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  transition: all var(--transition-fast);
}

.operator-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-light);
  transform: scale(1.05);
}

.operator-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}
</style>
