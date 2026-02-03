<template>
  <div class="command-palette">
    <div class="palette-header">
      <span class="palette-prompt">/{{ searchQuery }}</span>
    </div>
    <div class="command-list">
      <div
        v-for="(cmd, idx) in filteredCommands"
        :key="cmd.id"
        class="command-item"
        :class="{ 'is-selected': idx === selectedIndex }"
        @click="selectCommand(cmd)"
        @mouseenter="selectedIndex = idx"
      >
        <div class="command-main">
          <span class="command-name">{{ cmd.name }}</span>
          <span class="command-category">{{ cmd.category }}</span>
        </div>
        <span class="command-description">{{ cmd.description }}</span>
      </div>
      <div v-if="filteredCommands.length === 0" class="no-commands">
        No commands found
      </div>
    </div>
    <div class="palette-footer">
      <span class="hint">↑↓ Navigate</span>
      <span class="hint">Enter Select</span>
      <span class="hint">Esc Close</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Command } from '../types/editor';

const props = defineProps<{
  filteredCommands: Command[]
  searchQuery: string
}>();

const emit = defineEmits<{
  select: [command: Command]
  close: []
}>();

const selectedIndex = ref(0);

// Reset selection when filtered commands change
watch(() => props.filteredCommands, () => {
  selectedIndex.value = 0;
});

function selectCommand(cmd: Command) {
  emit('select', cmd);
}

// Expose methods for parent to call
defineExpose({
  handleArrowUp() {
    selectedIndex.value = Math.max(0, selectedIndex.value - 1);
  },
  handleArrowDown() {
    selectedIndex.value = Math.min(props.filteredCommands.length - 1, selectedIndex.value + 1);
  },
  selectCurrent() {
    if (props.filteredCommands[selectedIndex.value]) {
      selectCommand(props.filteredCommands[selectedIndex.value]);
    }
  }
});
</script>

<style scoped>
.command-palette {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  max-width: 90vw;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  overflow: hidden;
}

.palette-header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-primary);
}

.palette-prompt {
  font-family: var(--font-mono);
  font-size: var(--font-size-lg);
  color: var(--color-accent);
  font-weight: 600;
}

.command-list {
  max-height: 400px;
  overflow-y: auto;
}

.command-item {
  padding: var(--spacing-md);
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

.command-item:last-child {
  border-bottom: none;
}

.command-item:hover,
.command-item.is-selected {
  background: var(--color-accent-light);
}

.command-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.command-name {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
}

.command-category {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-sm);
}

.command-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.no-commands {
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--color-text-tertiary);
  font-style: italic;
}

.palette-footer {
  padding: var(--spacing-sm) var(--spacing-md);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  display: flex;
  gap: var(--spacing-md);
}

.hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}
</style>
