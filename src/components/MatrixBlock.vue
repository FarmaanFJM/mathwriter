<template>
  <div class="matrix-block" :data-line-id="matrixLine.id">
    <div class="matrix-bracket bracket-left">
      <svg viewBox="0 0 20 100" preserveAspectRatio="none">
        <path d="M 15 0 L 5 0 L 5 100 L 15 100" fill="none" stroke="currentColor" stroke-width="2"/>
      </svg>
    </div>

    <div class="matrix-grid" :style="gridStyle">
      <div
        v-for="(row, r) in matrixLine.data"
        :key="`row-${r}`"
        class="matrix-row"
      >
        <div
          v-for="(cell, c) in row"
          :key="`cell-${r}-${c}`"
          class="matrix-cell"
          :class="{ 'is-active': isActive && activeRow === r && activeCol === c }"
          :data-row="r"
          :data-col="c"
          @click="handleCellClick(r, c)"
        >
          <input
            v-if="isActive && activeRow === r && activeCol === c"
            type="text"
            :value="cell"
            @input="handleCellInput($event, r, c)"
            @keydown="handleCellKeydown($event, r, c)"
            ref="cellInputs"
            class="cell-input"
          />
          <span v-else class="cell-value">{{ cell || '_' }}</span>
        </div>
      </div>
    </div>

    <div class="matrix-bracket bracket-right">
      <svg viewBox="0 0 20 100" preserveAspectRatio="none">
        <path d="M 5 0 L 15 0 L 15 100 L 5 100" fill="none" stroke="currentColor" stroke-width="2"/>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import type { MatrixLine } from '../types/editor';

const props = defineProps<{
  matrixLine: MatrixLine
  isActive: boolean
  activeRow: number
  activeCol: number
}>();

const emit = defineEmits<{
  cellUpdate: [{ row: number, col: number, value: string }]
  cellFocus: [{ row: number, col: number }]
}>();

const cellInputs = ref<HTMLInputElement[]>([]);

// CSS Grid style
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.matrixLine.cols}, 1fr)`,
  gridTemplateRows: `repeat(${props.matrixLine.rows}, 1fr)`,
}));

// Focus active cell input when it changes
watch(() => [props.isActive, props.activeRow, props.activeCol], () => {
  if (props.isActive) {
    nextTick(() => {
      const input = cellInputs.value[0];
      if (input) {
        input.focus();
        input.select();
      }
    });
  }
}, { immediate: true });

function handleCellClick(row: number, col: number) {
  emit('cellFocus', { row, col });
}

function handleCellInput(event: Event, row: number, col: number) {
  const target = event.target as HTMLInputElement;
  emit('cellUpdate', { row, col, value: target.value });
}

function handleCellKeydown(event: KeyboardEvent, row: number, col: number) {
  // Let parent handle navigation
  // This component only handles input
}
</script>

<style scoped>
.matrix-block {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  user-select: none;
}

.matrix-bracket {
  width: 20px;
  height: 100%;
  color: var(--color-text-secondary);
}

.matrix-bracket svg {
  width: 100%;
  height: 100%;
}

.matrix-grid {
  display: grid;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs);
}

.matrix-row {
  display: contents;
}

.matrix-cell {
  min-width: 40px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xs);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.matrix-cell:hover {
  background: var(--color-accent-light);
  border-color: var(--color-accent);
}

.matrix-cell.is-active {
  background: var(--color-accent-light);
  border-color: var(--color-accent);
  border-width: 2px;
}

.cell-value {
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
}

.cell-input {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: var(--font-size-md);
  text-align: center;
  outline: none;
}
</style>
