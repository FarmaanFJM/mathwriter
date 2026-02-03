<template>
  <div class="matrix-builder">
    <div class="builder-section">
      <label class="section-label">Matrix Size</label>
      <div class="size-buttons">
        <button
          v-for="preset in presets"
          :key="`${preset.rows}x${preset.cols}`"
          class="size-btn"
          :class="{ active: mathBuilderStore.matrixRows === preset.rows && mathBuilderStore.matrixCols === preset.cols }"
          @click="setSize(preset.rows, preset.cols)"
        >
          {{ preset.rows }}×{{ preset.cols }}
        </button>
      </div>
    </div>

    <div class="builder-section">
      <label class="section-label">Custom Size</label>
      <div class="custom-size">
        <div class="input-group">
          <label class="input-label">Rows</label>
          <input
            type="number"
            min="1"
            max="10"
            :value="mathBuilderStore.matrixRows"
            @input="updateRows"
            class="size-input"
          />
        </div>
        <div class="input-group">
          <label class="input-label">Cols</label>
          <input
            type="number"
            min="1"
            max="10"
            :value="mathBuilderStore.matrixCols"
            @input="updateCols"
            class="size-input"
          />
        </div>
      </div>
    </div>

    <div class="builder-section">
      <label class="section-label">Matrix Values</label>
      <div class="matrix-grid">
        <div
          v-for="(row, i) in mathBuilderStore.matrixCells"
          :key="i"
          class="matrix-row"
        >
          <input
            v-for="(cell, j) in row"
            :key="j"
            type="text"
            :value="cell"
            @input="updateCell(i, j, ($event.target as HTMLInputElement).value)"
            class="matrix-cell-input"
            placeholder="0"
          />
        </div>
      </div>
    </div>

    <div class="builder-section">
      <label class="section-label">Quick Fill</label>
      <div class="quick-fill-buttons">
        <button class="quick-btn" @click="fillIdentity">Identity</button>
        <button class="quick-btn" @click="fillZeros">Zeros</button>
        <button class="quick-btn" @click="fillOnes">Ones</button>
        <button class="quick-btn" @click="clearAll">Clear</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMathBuilderStore } from '../../stores/mathBuilderStore';

const mathBuilderStore = useMathBuilderStore();

const presets = [
  { rows: 2, cols: 2 },
  { rows: 3, cols: 3 },
  { rows: 2, cols: 3 },
  { rows: 3, cols: 2 },
  { rows: 4, cols: 4 },
];

function setSize(rows: number, cols: number) {
  mathBuilderStore.setMatrixSize(rows, cols);
}

function updateRows(event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value);
  if (value > 0 && value <= 10) {
    mathBuilderStore.setMatrixSize(value, mathBuilderStore.matrixCols);
  }
}

function updateCols(event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value);
  if (value > 0 && value <= 10) {
    mathBuilderStore.setMatrixSize(mathBuilderStore.matrixRows, value);
  }
}

function updateCell(row: number, col: number, value: string) {
  mathBuilderStore.updateMatrixCell(row, col, value);
}

function fillIdentity() {
  const size = Math.min(mathBuilderStore.matrixRows, mathBuilderStore.matrixCols);
  for (let i = 0; i < mathBuilderStore.matrixRows; i++) {
    for (let j = 0; j < mathBuilderStore.matrixCols; j++) {
      mathBuilderStore.updateMatrixCell(i, j, i === j && i < size ? '1' : '0');
    }
  }
}

function fillZeros() {
  for (let i = 0; i < mathBuilderStore.matrixRows; i++) {
    for (let j = 0; j < mathBuilderStore.matrixCols; j++) {
      mathBuilderStore.updateMatrixCell(i, j, '0');
    }
  }
}

function fillOnes() {
  for (let i = 0; i < mathBuilderStore.matrixRows; i++) {
    for (let j = 0; j < mathBuilderStore.matrixCols; j++) {
      mathBuilderStore.updateMatrixCell(i, j, '1');
    }
  }
}

function clearAll() {
  for (let i = 0; i < mathBuilderStore.matrixRows; i++) {
    for (let j = 0; j < mathBuilderStore.matrixCols; j++) {
      mathBuilderStore.updateMatrixCell(i, j, '');
    }
  }
}
</script>

<style scoped>
.matrix-builder {
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

.size-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.size-btn {
  height: 40px;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.size-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.size-btn.active {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.custom-size {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-sm);
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

.size-input {
  height: 40px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  text-align: center;
}

.matrix-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow-x: auto;
}

.matrix-row {
  display: flex;
  gap: var(--spacing-xs);
}

.matrix-cell-input {
  width: 60px;
  height: 40px;
  padding: var(--spacing-xs);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  text-align: center;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
}

.matrix-cell-input:focus {
  border-color: var(--color-border-focus);
  background: var(--color-bg-primary);
}

.quick-fill-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
}

.quick-btn {
  height: 36px;
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
</style>
