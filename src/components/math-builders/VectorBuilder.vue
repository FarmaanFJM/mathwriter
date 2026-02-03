<template>
  <div class="vector-builder">
    <div class="builder-section">
      <label class="section-label">Vector Size</label>
      <div class="size-buttons">
        <button
          v-for="size in [2, 3, 4, 5]"
          :key="size"
          class="size-btn"
          :class="{ active: mathBuilderStore.vectorSize === size }"
          @click="setSize(size)"
        >
          {{ size }}D
        </button>
      </div>
    </div>

    <div class="builder-section">
      <label class="section-label">Custom Size</label>
      <input
        type="number"
        min="1"
        max="10"
        :value="mathBuilderStore.vectorSize"
        @input="updateSize"
        class="size-input"
      />
    </div>

    <div class="builder-section">
      <label class="section-label">Orientation</label>
      <div class="orientation-buttons">
        <button
          class="orientation-btn"
          :class="{ active: mathBuilderStore.vectorOrientation === 'col' }"
          @click="mathBuilderStore.vectorOrientation = 'col'"
        >
          Column
        </button>
        <button
          class="orientation-btn"
          :class="{ active: mathBuilderStore.vectorOrientation === 'row' }"
          @click="mathBuilderStore.vectorOrientation = 'row'"
        >
          Row
        </button>
      </div>
    </div>

    <div class="builder-section">
      <label class="section-label">Vector Values</label>
      <div class="vector-grid" :class="{ row: mathBuilderStore.vectorOrientation === 'row' }">
        <input
          v-for="(cell, i) in mathBuilderStore.vectorCells"
          :key="i"
          type="text"
          :value="cell"
          @input="updateCell(i, ($event.target as HTMLInputElement).value)"
          class="vector-cell-input"
          :placeholder="`v${i + 1}`"
        />
      </div>
    </div>

    <div class="builder-section">
      <label class="section-label">Quick Fill</label>
      <div class="quick-fill-buttons">
        <button class="quick-btn" @click="fillZeros">Zeros</button>
        <button class="quick-btn" @click="fillOnes">Ones</button>
        <button class="quick-btn" @click="fillSequence">Sequence</button>
        <button class="quick-btn" @click="clearAll">Clear</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMathBuilderStore } from '../../stores/mathBuilderStore';

const mathBuilderStore = useMathBuilderStore();

function setSize(size: number) {
  mathBuilderStore.setVectorSize(size);
}

function updateSize(event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value);
  if (value > 0 && value <= 10) {
    mathBuilderStore.setVectorSize(value);
  }
}

function updateCell(index: number, value: string) {
  mathBuilderStore.updateVectorCell(index, value);
}

function fillZeros() {
  for (let i = 0; i < mathBuilderStore.vectorSize; i++) {
    mathBuilderStore.updateVectorCell(i, '0');
  }
}

function fillOnes() {
  for (let i = 0; i < mathBuilderStore.vectorSize; i++) {
    mathBuilderStore.updateVectorCell(i, '1');
  }
}

function fillSequence() {
  for (let i = 0; i < mathBuilderStore.vectorSize; i++) {
    mathBuilderStore.updateVectorCell(i, (i + 1).toString());
  }
}

function clearAll() {
  for (let i = 0; i < mathBuilderStore.vectorSize; i++) {
    mathBuilderStore.updateVectorCell(i, '');
  }
}
</script>

<style scoped>
.vector-builder {
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
  grid-template-columns: repeat(4, 1fr);
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

.size-input {
  height: 40px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  text-align: center;
}

.orientation-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-sm);
}

.orientation-btn {
  height: 40px;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.orientation-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.orientation-btn.active {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.vector-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.vector-grid.row {
  flex-direction: row;
  overflow-x: auto;
}

.vector-cell-input {
  width: 100%;
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

.vector-grid.row .vector-cell-input {
  width: 60px;
}

.vector-cell-input:focus {
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
