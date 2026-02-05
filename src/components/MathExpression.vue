<template>
  <div
    class="math-expression"
    :class="{
      'is-editing': isEditing,
      'is-active': isActive,
      'display-mode': line.displayMode
    }"
    @click="onExpressionClick"
  >
    <div v-if="!isEditing" class="math-render" ref="mathContainer"></div>

    <div v-else class="math-editor">
      <input
        type="text"
        class="latex-input"
        :value="line.latex"
        @input="updateLatex"
        @blur="finishEditing"
        @keydown="handleEditorKeydown"
        ref="latexInput"
      />
      <span class="latex-hint">LaTeX</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import type { MathExpressionLine } from '../types/editor'
import { sanitizeLatex } from '../utils/latexMapping'

interface Props {
  line: MathExpressionLine
  isActive: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  focus: []
  update: [latex: string]
  blur: []
}>()

const mathContainer = ref<HTMLElement | null>(null)
const latexInput = ref<HTMLInputElement | null>(null)
const isEditing = ref(false)

onMounted(() => {
  renderMath()
})

const sanitizedLatex = computed(() => sanitizeLatex(props.line.latex))

watch(
  () => [sanitizedLatex.value, props.line.displayMode],
  () => {
    renderMath()
  }
)

function renderMath() {
  if (!mathContainer.value) return

  try {
    mathContainer.value.innerHTML = ''
    katex.render(sanitizedLatex.value, mathContainer.value, {
      displayMode: props.line.displayMode,
      throwOnError: false,
      trust: true
    })
  } catch {
    mathContainer.value.textContent = sanitizedLatex.value
  }
}

function onExpressionClick() {
  isEditing.value = true
  emit('focus')
  nextTick(() => {
    latexInput.value?.focus()
  })
}

function updateLatex(event: Event) {
  const latex = (event.target as HTMLInputElement).value
  emit('update', sanitizeLatex(latex))
  const sanitized = sanitizeLatex(latex)

  if (mathContainer.value) {
    try {
      mathContainer.value.innerHTML = ''
      katex.render(sanitized, mathContainer.value, {
        displayMode: props.line.displayMode,
        throwOnError: false
      })
    } catch {
      mathContainer.value.textContent = sanitized
    }
  }
}

function finishEditing() {
  isEditing.value = false
  emit('blur')
}

function handleEditorKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    finishEditing()
    event.preventDefault()
  }
}
</script>

<style scoped>
.math-expression {
  display: inline-block;
  vertical-align: baseline;
  min-width: 0;
  padding: 0;
  margin: 0;
  cursor: pointer;
  user-select: none;
  border-radius: 0;
  transition: all 0.15s;
  font-family: 'Cambria Math', 'TeX Gyre Termes', serif;
  line-height: var(--math-row-line-height);
  vertical-align: baseline;
}


.math-expression:hover {
  background: transparent;
}

.math-expression.is-active {
  background: transparent;
  border: none;
  border-radius: 0;
}

.math-expression.is-editing {
  background: transparent;
  border: none;
  padding: 0;
}

.math-expression.display-mode {
  display: block;
  margin: 0.5em 0;
}

.math-render {
  font-size: 1rem;
  line-height: inherit;
  min-height: 1.5em;
  display: inline-block;
  vertical-align: baseline;
}

.math-render :deep(.katex),
.math-render :deep(.katex .array),
.math-render :deep(.katex .array td) {
  font-size: inherit;
  font-family: inherit;
}

.math-render :deep(.katex .array td) {
  vertical-align: baseline;
}

.math-render :deep(.katex .array) {
  margin: 0;
}

.math-editor {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.latex-input {
  padding: 4px 8px;
  border: none;
  background: transparent;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  outline: none;
  width: auto;
  min-width: 100px;
  color: var(--color-text-primary);
}

.latex-hint {
  font-size: 10px;
  color: #999;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 2px;
}

[data-theme='dark'] .math-expression {
  color: #e9ecef;
}

[data-theme='dark'] .math-expression.is-editing {
  background: transparent;
  border-color: transparent;
}

[data-theme='dark'] .latex-hint {
  background: #373a40;
  color: #adb5bd;
}
</style>
