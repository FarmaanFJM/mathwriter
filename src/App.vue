<template>
  <div class="app">
    <header class="app-header">
      <div class="header-left">
        <h1 class="app-title">MathWriter</h1>
        <span class="app-subtitle">Keyboard-Driven Math Editor</span>
      </div>
      <div class="header-right">
        <button class="theme-toggle" @click="editorStore.toggleTheme()" :title="editorStore.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'">
          {{ editorStore.theme === 'light' ? '🌙' : '☀️' }}
        </button>
      </div>
    </header>

    <main class="app-main">
      <MathEditor />
    </main>

    <footer class="app-footer">
      <span class="footer-hint">Press <kbd>/</kbd> to open command palette</span>
      <span class="footer-hint">Type <kbd>/matrix</kbd> or <kbd>/alpha</kbd> to insert</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useEditorStore } from './stores/editorStore';
import MathEditor from './components/MathEditor.vue';

const editorStore = useEditorStore();

onMounted(() => {
  // Initialize theme
  editorStore.initTheme();
});
</script>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-md);
}

.app-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.app-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  font-weight: 400;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.theme-toggle {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.theme-toggle:hover {
  background: var(--color-accent-light);
  border-color: var(--color-accent);
  transform: scale(1.05);
}

.app-main {
  flex: 1;
  overflow: hidden;
  padding: var(--spacing-xl);
}

.app-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xl);
  padding: var(--spacing-sm) var(--spacing-xl);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.footer-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

kbd {
  display: inline-block;
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
</style>
