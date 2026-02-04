<template>
  <div
    class="math-expression"
    :class="{
      'is-editing': isEditing,
      'is-active': isActive,
      'display-mode': line.displayMode
    }"
    @click.stop="onExpressionClick"
  >
    <!-- Rendered math (default view) -->
    <div v-if="!isEditing" class="math-render" ref="mathContainer">
      <span class="math-placeholder" v-if="!line.latex">Empty expression</span>
    </div>

    <!-- Inline LaTeX editor (when editing) -->
    <div v-else class="math-editor">
      <div class="math-editor-row">
        <span class="latex-label">LaTeX</span>
        <input
          type="text"
          class="latex-input"
          :value="line.latex"
          @input="updateLatex"
          @blur="finishEditing"
          @keydown="handleEditorKeydown"
          ref="latexInput"
          spellcheck="false"
        />
      </div>
      <div class="math-preview" ref="previewContainer"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import type { MathExpressionLine } from '../types/editor'

interface Props {
  line: MathExpressionLine
  isActive: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  focus: []
  update: [latex: string]
  blur: []
  delete: []
  'navigate-up': []
  'navigate-down': []
}>()

const mathContainer = ref<HTMLElement | null>(null)
const previewContainer = ref<HTMLElement | null>(null)
const latexInput = ref<HTMLInputElement | null>(null)
const isEditing = ref(false)

onMounted(() => {
  renderMath()
})

// Re-render when latex changes externally
watch(() => props.line.latex, () => {
  if (!isEditing.value) {
    nextTick(() => renderMath())
  }
})

function renderMath() {
  if (!mathContainer.value || !props.line.latex) return

  try {
    mathContainer.value.innerHTML = ''
    katex.render(props.line.latex, mathContainer.value, {
      displayMode: props.line.displayMode,
      throwOnError: false,
      trust: true,
      strict: false,
    })
  } catch {
    mathContainer.value.textContent = props.line.latex
  }
}

function renderPreview(latex: string) {
  if (!previewContainer.value) return

  try {
    previewContainer.value.innerHTML = ''
    if (latex.trim()) {
      katex.render(latex, previewContainer.value, {
        displayMode: props.line.displayMode,
        throwOnError: false,
        trust: true,
        strict: false,
      })
    }
  } catch {
    // Silently fail for incomplete expressions
  }
}

function onExpressionClick() {
  isEditing.value = true
  emit('focus')
  nextTick(() => {
    latexInput.value?.focus()
    latexInput.value?.select()
    renderPreview(props.line.latex)
  })
}

function updateLatex(event: Event) {
  const latex = (event.target as HTMLInputElement).value
  emit('update', latex)
  // Live preview while typing
  nextTick(() => renderPreview(latex))
}

function finishEditing() {
  isEditing.value = false
  emit('blur')
  nextTick(() => renderMath())
}

function handleEditorKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' || event.key === 'Enter') {
    finishEditing()
    event.preventDefault()
    event.stopPropagation()
  } else if (event.key === 'Backspace') {
    const input = latexInput.value
    if (input && input.value === '') {
      emit('delete')
      event.preventDefault()
      event.stopPropagation()
    }
  } else if (event.key === 'ArrowUp') {
    emit('navigate-up')
    event.preventDefault()
    event.stopPropagation()
  } else if (event.key === 'ArrowDown') {
    emit('navigate-down')
    event.preventDefault()
    event.stopPropagation()
  }
}

// Expose method for parent to trigger editing
defineExpose({ startEditing: onExpressionClick })
</script>

<style scoped>
.math-expression {
  display: block;
  min-height: 28px;
  padding: 4px 8px;
  margin: 2px 0;
  cursor: pointer;
  user-select: none;
  border-radius: 4px;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.math-expression:hover {
  background: rgba(33, 150, 243, 0.04);
  border-color: rgba(33, 150, 243, 0.15);
}

.math-expression.is-active {
  background: rgba(33, 150, 243, 0.08);
  border-color: rgba(33, 150, 243, 0.25);
}

.math-expression.is-editing {
  background: var(--color-bg-primary);
  border: 2px solid var(--color-accent);
  padding: 8px 12px;
  border-radius: 6px;
}

.math-expression.display-mode {
  text-align: center;
  padding: 8px;
  margin: 4px 0;
}

.math-render {
  font-size: 18px;
  line-height: 1.8;
  min-height: 24px;
  display: block;
}

.math-render :deep(.katex) {
  font-size: 1.1em;
}

.math-render :deep(.katex-display) {
  margin: 4px 0;
}

.math-placeholder {
  color: var(--color-text-disabled);
  font-style: italic;
  font-size: 14px;
}

.math-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.math-editor-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.latex-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-accent);
  background: var(--color-accent-light);
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.latex-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-secondary);
  font-family: 'Courier New', 'Consolas', monospace;
  font-size: 14px;
  outline: none;
  color: var(--color-text-primary);
  transition: border-color 0.15s;
}

.latex-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-light);
}

.math-preview {
  min-height: 24px;
  padding: 4px 0;
  font-size: 18px;
  border-top: 1px solid var(--color-border-light);
  padding-top: 8px;
}

.math-preview:empty {
  display: none;
}

.math-preview :deep(.katex) {
  font-size: 1.1em;
}

/* Dark theme */
[data-theme='dark'] .math-expression.is-editing {
  background: var(--color-bg-secondary);
  border-color: var(--color-accent);
}

[data-theme='dark'] .latex-input {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border);
  color: var(--color-text-primary);
}
</style>
