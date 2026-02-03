<template>
  <div class="math-tools">
    <div class="tools-header">
      <h2 class="tools-title">
        {{ mathBuilderStore.mode === 'edit' ? 'Edit Math' : 'Math Tools' }}
      </h2>
      <button
        v-if="mathBuilderStore.mode === 'edit'"
        class="exit-edit-btn"
        @click="exitEditMode"
        title="Exit edit mode"
      >
        ×
      </button>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: mathBuilderStore.activeTab === tab.id }"
        @click="mathBuilderStore.setActiveTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab content -->
    <div class="tab-content">
      <MatrixBuilder v-if="mathBuilderStore.activeTab === 'matrices'" />
      <VectorBuilder v-else-if="mathBuilderStore.activeTab === 'vectors'" />
      <SymbolsPanel v-else-if="mathBuilderStore.activeTab === 'symbols'" />
      <CalculusBuilder v-else-if="mathBuilderStore.activeTab === 'calculus'" />
      <TemplatesBuilder v-else-if="mathBuilderStore.activeTab === 'templates'" />
    </div>

    <!-- Preview and insert buttons -->
    <div class="tools-footer">
      <div v-if="previewLatex" class="preview-section">
        <div class="preview-label">Preview:</div>
        <div class="preview-content" v-html="renderPreview()"></div>
      </div>

      <div class="insert-buttons">
        <button
          v-if="mathBuilderStore.mode === 'create'"
          class="btn-insert"
          @click="insertInline"
          :disabled="!canInsert"
        >
          Insert Inline
        </button>
        <button
          v-if="mathBuilderStore.mode === 'create'"
          class="btn-insert btn-primary"
          @click="insertBlock"
          :disabled="!canInsert"
        >
          Insert Block
        </button>
        <button
          v-if="mathBuilderStore.mode === 'edit'"
          class="btn-insert btn-primary"
          @click="updateBlock"
          :disabled="!canInsert"
        >
          Update
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMathBuilderStore } from '../stores/mathBuilderStore';
import { useNotesStore } from '../stores/notesStore';
import { useEditorStore } from '../stores/editorStore';
import { astToLatex } from '../utils/mathConverter';
import MatrixBuilder from './math-builders/MatrixBuilder.vue';
import VectorBuilder from './math-builders/VectorBuilder.vue';
import SymbolsPanel from './math-builders/SymbolsPanel.vue';
import CalculusBuilder from './math-builders/CalculusBuilder.vue';
import TemplatesBuilder from './math-builders/TemplatesBuilder.vue';
import katex from 'katex';

const mathBuilderStore = useMathBuilderStore();
const notesStore = useNotesStore();
const editorStore = useEditorStore();

const tabs = [
  { id: 'matrices', label: 'Matrices' },
  { id: 'vectors', label: 'Vectors' },
  { id: 'symbols', label: 'Symbols' },
  { id: 'calculus', label: 'Calculus' },
  { id: 'templates', label: 'Templates' },
] as const;

const previewLatex = computed(() => {
  const ast = mathBuilderStore.buildCurrentAst();
  if (ast) {
    return astToLatex(ast);
  }
  return '';
});

const canInsert = computed(() => {
  return previewLatex.value.length > 0;
});

function renderPreview(): string {
  if (!previewLatex.value) return '';
  
  try {
    return katex.renderToString(previewLatex.value, {
      throwOnError: false,
      displayMode: true,
    });
  } catch (error) {
    return '<span class="error">Error rendering preview</span>';
  }
}

function insertInline() {
  const ast = mathBuilderStore.buildCurrentAst();
  if (!ast) return;

  const latex = astToLatex(ast);
  const position = editorStore.caretPosition;

  notesStore.addMathBlock({
    type: 'math',
    inline: true,
    ast,
    latex,
  }, position + 1);

  mathBuilderStore.resetBuilders();
}

function insertBlock() {
  const ast = mathBuilderStore.buildCurrentAst();
  if (!ast) return;

  const latex = astToLatex(ast);
  const position = editorStore.caretPosition;

  notesStore.addMathBlock({
    type: 'math',
    inline: false,
    ast,
    latex,
  }, position + 1);

  mathBuilderStore.resetBuilders();
}

function updateBlock() {
  const ast = mathBuilderStore.buildCurrentAst();
  if (!ast || !mathBuilderStore.editingBlockId) return;

  const latex = astToLatex(ast);

  notesStore.updateBlock(mathBuilderStore.editingBlockId, {
    ast,
    latex,
  });

  exitEditMode();
}

function exitEditMode() {
  mathBuilderStore.exitEditMode();
  editorStore.selectBlock(null);
}
</script>

<style scoped>
.math-tools {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tools-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.tools-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.exit-edit-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: var(--color-bg-hover);
  font-size: 24px;
  line-height: 1;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.exit-edit-btn:hover {
  background: var(--color-danger);
  color: white;
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
}

.tab {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  border-bottom: 2px solid transparent;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.tab:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
}

.tab.active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.tools-footer {
  border-top: 1px solid var(--color-border);
  padding: var(--spacing-md);
  background: var(--color-bg-tertiary);
}

.preview-section {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  min-height: 60px;
}

.preview-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.preview-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
}

.insert-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.btn-insert {
  flex: 1;
  height: 40px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-weight: 500;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.btn-insert:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-insert.btn-primary {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.btn-insert.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}

.btn-insert:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}
</style>
