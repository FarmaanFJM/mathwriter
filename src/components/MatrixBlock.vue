<template>
  <div class="matrix-block" :data-line-id="matrixLine.id">
    <div class="matrix-bracket bracket-left" :style="{ height: bracketHeight }">
      <svg viewBox="0 0 20 100" preserveAspectRatio="none">
        <path d="M 15 0 L 5 0 L 5 100 L 15 100" fill="none" stroke="currentColor" stroke-width="2"/>
      </svg>
    </div>

    <div class="matrix-grid" :style="gridStyle" ref="gridRef">
      <input
        v-for="(cell, idx) in flatCells"
        :key="`cell-${cell.row}-${cell.col}`"
        type="text"
        class="matrix-cell"
        :class="{ 'is-active': isActive && activeRow === cell.row && activeCol === cell.col }"
        :value="cell.value"
        :ref="(el) => setCellRef(cell.row, cell.col, el)"
        @click="focusCell(cell.row, cell.col)"
        @input="updateCell(cell.row, cell.col, $event)"
        @keydown="handleCellKeydown($event, cell.row, cell.col)"
        maxlength="6"
      />
    </div>

    <div class="matrix-bracket bracket-right" :style="{ height: bracketHeight }">
      <svg viewBox="0 0 20 100" preserveAspectRatio="none">
        <path d="M 5 0 L 15 0 L 15 100 L 5 100" fill="none" stroke="currentColor" stroke-width="2"/>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
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
  matrixKeydown: [{ row: number, col: number, key: KeyboardEvent }]
}>();

const cellRefs = ref<Record<string, HTMLInputElement>>({});
const gridRef = ref<HTMLDivElement | null>(null);

// Flatten cells for v-for
const flatCells = computed(() => {
  const cells: Array<{ row: number, col: number, value: string }> = [];
  for (let r = 0; r < props.matrixLine.rows; r++) {
    for (let c = 0; c < props.matrixLine.cols; c++) {
      cells.push({
        row: r,
        col: c,
        value: props.matrixLine.data[r][c]
      });
    }
  }
  return cells;
});

// CSS Grid style
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.matrixLine.cols}, minmax(40px, 1fr))`,
  gridTemplateRows: `repeat(${props.matrixLine.rows}, minmax(28px, auto))`,
  gap: '0px'
}));

// Bracket height scales with matrix size
const bracketHeight = computed(() => {
  const baseHeight = 28; // Base cell height
  const totalHeight = props.matrixLine.rows * baseHeight;
  return `${totalHeight + 8}px`; // Add padding
});

// Focus active cell input when it changes
watch(() => [props.isActive, props.activeRow, props.activeCol], () => {
  if (props.isActive && props.activeRow >= 0 && props.activeCol >= 0) {
    nextTick(() => {
      const key = `${props.activeRow}-${props.activeCol}`;
      const input = cellRefs.value[key];
      if (input) {
        input.focus();
        input.select();
      }
    });
  }
}, { immediate: true });

function setCellRef(row: number, col: number, el: any) {
  if (el) {
    const key = `${row}-${col}`;
    cellRefs.value[key] = el as HTMLInputElement;
  }
}

function focusCell(row: number, col: number) {
  emit('cellFocus', { row, col });
}

function updateCell(row: number, col: number, event: Event) {
  const target = event.target as HTMLInputElement;
  emit('cellUpdate', { row, col, value: target.value });
}

function handleCellKeydown(event: KeyboardEvent, row: number, col: number) {
  emit('matrixKeydown', { row, col, key: event });
}
</script>

<style scoped>
/* CRITICAL: Matrix is INLINE, not block */
.matrix-block {
  display: inline-flex;
  align-items: center;
  gap: 0px;
  vertical-align: middle;
  margin: 0 4px;
  padding: 0;
  background: transparent;
  border: none;
  font-family: var(--font-mono);
}

/* Brackets scale with matrix height */
.matrix-bracket {
  width: 16px;
  flex-shrink: 0;
  color: var(--color-text-secondary);
}

.matrix-bracket svg {
  width: 100%;
  height: 100%;
}

/* Matrix grid is inline-grid */
.matrix-grid {
  display: inline-grid;
  grid-auto-flow: row;
}

/* Matrix cells - clean, minimal borders */
.matrix-cell {
  min-width: 40px;
  min-height: 28px;
  padding: 4px 6px;
  font-family: var(--font-mono);
  font-size: 14px;
  text-align: center;
  background: transparent;
  border: 1px solid #ddd;
  outline: none;
  cursor: text;
  transition: all 0.2s;
  color: var(--color-text-primary);
}

.matrix-cell:hover {
  border-color: #aaa;
  background: rgba(0, 0, 0, 0.02);
}

.matrix-cell:focus,
.matrix-cell.is-active {
  border-color: #2196F3;
  border-width: 2px;
  background: #e3f2fd;
  box-shadow: inset 0 0 0 1px rgba(33, 150, 243, 0.3);
  caret-color: #2196F3;
}

/* Hide default text cursor when not focused */
.matrix-cell:not(:focus) {
  caret-color: transparent;
}
</style>
