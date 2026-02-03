<template>
  <div class="editor-container">
    <div 
      class="editor" 
      contenteditable="true"
      @keydown="handleKeydown"
      @input="handleInput"
      @click="handleClick"
      ref="editorRef"
      spellcheck="false"
    >
      <span 
        v-for="(element, idx) in editorState.content" 
        :key="`element-${idx}`" 
        :data-element-index="idx"
        class="element"
      >
        <span v-if="element.type === 'text'" class="text-element">{{ element.value }}</span>
        <span v-else-if="element.type === 'matrix'" class="matrix-element">
          <span class="matrix-bracket">[</span>
          <span class="matrix-content">
            <span v-for="(row, rowIdx) in element.data" :key="`row-${rowIdx}`" class="matrix-row">
              <span class="matrix-bracket">[</span>
              <span v-for="(cell, colIdx) in row" :key="`cell-${colIdx}`" class="matrix-cell">
                {{ cell || '_' }}
              </span>
              <span class="matrix-bracket">]</span>
            </span>
          </span>
          <span class="matrix-bracket">]</span>
        </span>
        <span v-else-if="element.type === 'symbol'" class="symbol-element">
          {{ element.display || element.value }}
        </span>
      </span>
    </div>

    <!-- Command Palette Overlay -->
    <div v-if="editorState.showCommandPalette" class="palette-overlay" @click="closeCommandPalette">
      <CommandPalette 
        :filtered-commands="filteredCommands"
        :search-query="editorState.commandSearchQuery"
        @select="executeCommand"
        @close="closeCommandPalette"
        ref="paletteRef"
        @click.stop
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue';
import type { EditorState, Element } from '../types/editor';
import { commands, filterCommands } from '../utils/commands';
import { parseText } from '../utils/parser';
import { serialize } from '../utils/serializer';
import CommandPalette from './CommandPalette.vue';

const editorRef = ref<HTMLDivElement | null>(null);
const paletteRef = ref<InstanceType<typeof CommandPalette> | null>(null);

// Initialize editor state
const editorState = reactive<EditorState>({
  content: [
    {
      type: 'text',
      value: 'Type / to open command palette. Try /matrix or /alpha'
    }
  ],
  cursorPosition: {
    type: 'text',
    elementIndex: 0,
    textOffset: 0
  },
  showCommandPalette: false,
  commandSearchQuery: '',
  selectedCommandIndex: 0
});

// Filtered commands based on search query
const filteredCommands = computed(() => {
  return filterCommands(editorState.commandSearchQuery);
});

// Handle keyboard input
function handleKeydown(event: KeyboardEvent) {
  // Command palette is open
  if (editorState.showCommandPalette) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeCommandPalette();
      return;
    }
    
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      paletteRef.value?.handleArrowUp();
      return;
    }
    
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      paletteRef.value?.handleArrowDown();
      return;
    }
    
    if (event.key === 'Enter') {
      event.preventDefault();
      paletteRef.value?.selectCurrent();
      return;
    }
    
    // Backspace to remove search query
    if (event.key === 'Backspace' && editorState.commandSearchQuery === '') {
      event.preventDefault();
      closeCommandPalette();
      return;
    }
    
    return;
  }
  
  // Detect slash to open command palette
  if (event.key === '/') {
    event.preventDefault();
    openCommandPalette();
    return;
  }
}

// Handle text input
function handleInput(event: Event) {
  const target = event.target as HTMLDivElement;
  const text = target.innerText;
  
  // If command palette is open, update search query
  if (editorState.showCommandPalette) {
    // Extract text after the last /
    const lastSlashIndex = text.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      editorState.commandSearchQuery = text.substring(lastSlashIndex + 1);
    }
    return;
  }
  
  // Parse text and update content
  // (For Part 1, we'll keep it simple and just update the first text element)
  if (editorState.content[0]?.type === 'text') {
    editorState.content[0].value = text;
  }
}

// Handle click to update cursor position
function handleClick(event: MouseEvent) {
  // For Part 1, we'll keep cursor tracking simple
  // Part 2 will add detailed cursor tracking for matrices
}

// Open command palette
function openCommandPalette() {
  editorState.showCommandPalette = true;
  editorState.commandSearchQuery = '';
  editorState.selectedCommandIndex = 0;
}

// Close command palette
function closeCommandPalette() {
  editorState.showCommandPalette = false;
  editorState.commandSearchQuery = '';
  
  // Remove the / from the editor
  if (editorRef.value) {
    const text = editorRef.value.innerText;
    const lastSlashIndex = text.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      const newText = text.substring(0, lastSlashIndex) + text.substring(lastSlashIndex + 1);
      if (editorState.content[0]?.type === 'text') {
        editorState.content[0].value = newText;
      }
      nextTick(() => {
        renderContent();
      });
    }
  }
}

// Execute selected command
function executeCommand(command: any) {
  // Remove the slash and search query from content
  if (editorRef.value) {
    const text = editorRef.value.innerText;
    const lastSlashIndex = text.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      const beforeSlash = text.substring(0, lastSlashIndex);
      if (editorState.content[0]?.type === 'text') {
        editorState.content[0].value = beforeSlash;
      }
    }
  }
  
  // Execute the command
  command.execute(editorState);
  
  // Re-render content
  nextTick(() => {
    renderContent();
  });
}

// Render content to editor
function renderContent() {
  if (!editorRef.value) return;
  
  // Force Vue to re-render by updating the DOM
  // The template will handle rendering based on editorState.content
  
  // Focus back on editor
  editorRef.value.focus();
}

// Initialize
nextTick(() => {
  if (editorRef.value) {
    editorRef.value.focus();
  }
});
</script>

<style scoped>
.editor-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor {
  flex: 1;
  padding: var(--spacing-xl);
  font-family: var(--font-mono);
  font-size: var(--font-size-md);
  line-height: 1.8;
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow-y: auto;
  outline: none;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.editor:focus {
  border-color: var(--color-accent);
}

.element {
  display: inline;
}

.text-element {
  display: inline;
}

.matrix-element {
  display: inline-block;
  margin: 0 var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  vertical-align: middle;
}

.matrix-content {
  display: inline-flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin: 0 var(--spacing-xs);
}

.matrix-row {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
}

.matrix-cell {
  display: inline-block;
  min-width: 24px;
  text-align: center;
  padding: 0 var(--spacing-xs);
  color: var(--color-text-primary);
}

.matrix-bracket {
  font-weight: bold;
  color: var(--color-text-secondary);
  font-size: 1.2em;
}

.symbol-element {
  display: inline;
  color: var(--color-accent);
  font-weight: 600;
  margin: 0 2px;
}

.palette-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}
</style>
