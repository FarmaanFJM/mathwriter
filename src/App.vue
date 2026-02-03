<template>
  <div class="app-container">
    <!-- Header -->
    <header class="app-header">
      <div class="header-left">
        <h1 class="app-title">MathWriter</h1>
      </div>
      <div class="header-right">
        <button class="icon-btn" @click="toggleTheme" title="Toggle theme">
          <span v-if="editorStore.theme === 'light'">🌙</span>
          <span v-else>☀️</span>
        </button>
      </div>
    </header>

    <!-- Main content area with three panes -->
    <div class="app-main">
      <!-- Left pane: Note list -->
      <aside class="notes-sidebar">
        <NotesList />
      </aside>

      <!-- Center pane: Editor -->
      <main class="editor-pane">
        <Editor />
      </main>

      <!-- Right pane: Math tools -->
      <aside class="math-tools-sidebar">
        <MathTools />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useNotesStore } from './stores/notesStore';
import { useEditorStore } from './stores/editorStore';
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts';
import NotesList from './components/NotesList.vue';
import Editor from './components/Editor.vue';
import MathTools from './components/MathTools.vue';

const notesStore = useNotesStore();
const editorStore = useEditorStore();

// Initialize keyboard shortcuts
useKeyboardShortcuts();

onMounted(async () => {
  // Initialize theme
  editorStore.initTheme();
  
  // Load notes from storage
  await notesStore.loadNotes();
  
  // Load the first note if available
  if (notesStore.notes.length > 0) {
    await notesStore.loadNote(notesStore.notes[0].id);
  }
});

function toggleTheme() {
  editorStore.toggleTheme();
  // Persist theme
  localStorage.setItem('mathwriter-theme', editorStore.theme);
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  height: 56px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.app-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: transparent;
  font-size: 18px;
  transition: background var(--transition-fast);
}

.icon-btn:hover {
  background: var(--color-bg-hover);
}

.app-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.notes-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
}

.editor-pane {
  flex: 1;
  overflow-y: auto;
  background: var(--color-bg-primary);
}

.math-tools-sidebar {
  width: 320px;
  flex-shrink: 0;
  background: var(--color-bg-secondary);
  border-left: 1px solid var(--color-border);
  overflow-y: auto;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .math-tools-sidebar {
    width: 280px;
  }
}

@media (max-width: 900px) {
  .notes-sidebar {
    width: 240px;
  }
  
  .math-tools-sidebar {
    width: 240px;
  }
}
</style>
