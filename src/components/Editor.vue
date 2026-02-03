<template>
  <div class="editor-container">
    <div v-if="notesStore.currentNote" class="editor-content">
      <!-- Note title -->
      <input
        v-model="noteTitle"
        type="text"
        class="note-title-input"
        placeholder="Untitled Note"
        @blur="updateTitle"
      />

      <!-- Content blocks -->
      <div class="blocks-container">
        <div
          v-for="(block, index) in notesStore.currentNote.content"
          :key="block.id"
          class="block-wrapper"
          @click="setCaretPosition(index)"
        >
          <!-- Paragraph block -->
          <div v-if="block.type === 'paragraph'" class="paragraph-block">
            <textarea
              :value="block.text"
              @input="updateParagraphText(block.id, ($event.target as HTMLTextAreaElement).value)"
              @focus="setCaretPosition(index)"
              class="paragraph-textarea"
              placeholder="Type something..."
              rows="1"
              @keydown="handleParagraphKeydown($event, block.id, index)"
            ></textarea>
          </div>

          <!-- Math block -->
          <div
            v-else-if="block.type === 'math'"
            class="math-block"
            :class="{ 
              inline: block.inline,
              selected: editorStore.selectedBlockId === block.id 
            }"
            @click.stop="selectMathBlock(block)"
          >
            <div class="math-content" v-html="renderMath(block.latex, block.inline)"></div>
            <button
              class="delete-block-btn"
              @click.stop="deleteBlock(block.id)"
              title="Delete block"
            >
              ×
            </button>
          </div>
        </div>

        <!-- Add paragraph button -->
        <button class="add-paragraph-btn" @click="addParagraph">
          + Add paragraph
        </button>
      </div>

      <!-- Delete note button -->
      <div class="editor-footer">
        <button class="btn-danger" @click="confirmDeleteNote">
          Delete Note
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-editor">
      <p>Select a note or create a new one</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useNotesStore } from '../stores/notesStore';
import { useEditorStore } from '../stores/editorStore';
import { useMathBuilderStore } from '../stores/mathBuilderStore';
import type { MathBlock } from '../types';
import katex from 'katex';

const notesStore = useNotesStore();
const editorStore = useEditorStore();
const mathBuilderStore = useMathBuilderStore();

const noteTitle = ref('');

// Watch for note changes to update title
watch(() => notesStore.currentNote, (note) => {
  if (note) {
    noteTitle.value = note.title;
  }
}, { immediate: true });

function updateTitle() {
  if (notesStore.currentNote && noteTitle.value !== notesStore.currentNote.title) {
    notesStore.updateTitle(noteTitle.value);
  }
}

function setCaretPosition(index: number) {
  editorStore.setCaretPosition(index);
}

function updateParagraphText(blockId: string, text: string) {
  notesStore.updateBlock(blockId, { text });
}

function handleParagraphKeydown(event: KeyboardEvent, blockId: string, index: number) {
  const textarea = event.target as HTMLTextAreaElement;
  
  // Auto-resize textarea
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
  
  // Handle Enter key to create new paragraph
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    notesStore.addParagraphBlock('', index + 1);
    
    // Focus the new textarea after Vue updates the DOM
    setTimeout(() => {
      const textareas = document.querySelectorAll('.paragraph-textarea');
      const nextTextarea = textareas[index + 1] as HTMLTextAreaElement;
      if (nextTextarea) {
        nextTextarea.focus();
      }
    }, 50);
  }
  
  // Handle Backspace on empty paragraph to delete it
  if (event.key === 'Backspace' && textarea.value === '' && index > 0) {
    event.preventDefault();
    notesStore.deleteBlock(blockId);
    
    // Focus previous textarea
    setTimeout(() => {
      const textareas = document.querySelectorAll('.paragraph-textarea');
      const prevTextarea = textareas[index - 1] as HTMLTextAreaElement;
      if (prevTextarea) {
        prevTextarea.focus();
        prevTextarea.setSelectionRange(prevTextarea.value.length, prevTextarea.value.length);
      }
    }, 50);
  }
}

function addParagraph() {
  notesStore.addParagraphBlock('');
  
  // Focus the new textarea
  setTimeout(() => {
    const textareas = document.querySelectorAll('.paragraph-textarea');
    const lastTextarea = textareas[textareas.length - 1] as HTMLTextAreaElement;
    if (lastTextarea) {
      lastTextarea.focus();
    }
  }, 50);
}

function selectMathBlock(block: MathBlock) {
  editorStore.selectBlock(block.id);
  // Enter edit mode in math builder
  mathBuilderStore.enterEditMode(block.id, block.ast);
}

function deleteBlock(blockId: string) {
  notesStore.deleteBlock(blockId);
  editorStore.selectBlock(null);
  mathBuilderStore.exitEditMode();
}

function renderMath(latex: string, inline: boolean): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: !inline,
    });
  } catch (error) {
    console.error('KaTeX rendering error:', error);
    return `<span class="math-error">Error rendering math</span>`;
  }
}

async function confirmDeleteNote() {
  if (!notesStore.currentNote) return;
  
  const confirmed = confirm(`Are you sure you want to delete "${notesStore.currentNote.title}"?`);
  if (confirmed) {
    const noteId = notesStore.currentNote.id;
    await notesStore.deleteNote(noteId);
    
    // Load the first available note
    if (notesStore.notes.length > 0) {
      await notesStore.loadNote(notesStore.notes[0].id);
    }
  }
}

// Auto-resize all textareas on mount
onMounted(() => {
  setTimeout(() => {
    const textareas = document.querySelectorAll('.paragraph-textarea');
    textareas.forEach((textarea) => {
      const ta = textarea as HTMLTextAreaElement;
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });
  }, 100);
});
</script>

<style scoped>
.editor-container {
  height: 100%;
  overflow-y: auto;
}

.editor-content {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.note-title-input {
  width: 100%;
  font-size: var(--font-size-xl);
  font-weight: 600;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  padding: var(--spacing-md) 0;
  margin-bottom: var(--spacing-lg);
  outline: none;
}

.note-title-input:focus {
  border-bottom: 2px solid var(--color-border-focus);
}

.blocks-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.block-wrapper {
  position: relative;
}

.paragraph-block {
  position: relative;
}

.paragraph-textarea {
  width: 100%;
  min-height: 40px;
  padding: var(--spacing-sm);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  line-height: var(--line-height);
  resize: none;
  overflow: hidden;
  transition: all var(--transition-fast);
}

.paragraph-textarea:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-light);
}

.paragraph-textarea:focus {
  background: var(--color-bg-primary);
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}

.math-block {
  position: relative;
  padding: var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.math-block:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}

.math-block.selected {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}

.math-block.inline {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-sm);
  margin: 0 var(--spacing-xs);
}

.math-content {
  user-select: none;
}

.delete-block-btn {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-danger);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 20px;
  line-height: 1;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.math-block:hover .delete-block-btn {
  opacity: 1;
}

.delete-block-btn:hover {
  background: var(--color-danger-hover);
}

.add-paragraph-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--color-text-tertiary);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.add-paragraph-btn:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
  background: var(--color-accent-light);
}

.editor-footer {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--color-border);
}

.btn-danger {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-danger);
  color: white;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  transition: background var(--transition-fast);
}

.btn-danger:hover {
  background: var(--color-danger-hover);
}

.empty-editor {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-lg);
}

.math-error {
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}
</style>
