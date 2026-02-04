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
}>()

const mathContainer = ref<HTMLElement | null>(null)
const latexInput = ref<HTMLInputElement | null>(null)
const isEditing = ref(false)

onMounted(() => {
  renderMath()
})

watch(
  () => [props.line.latex, props.line.displayMode],
  () => {
    renderMath()
  }
)

function renderMath() {
  if (!mathContainer.value) return

  try {
    mathContainer.value.innerHTML = ''
    katex.render(props.line.latex, mathContainer.value, {
      displayMode: props.line.displayMode,
      throwOnError: false,
      trust: true
    })
  } catch {
    mathContainer.value.textContent = props.line.latex
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
  emit('update', latex)

  if (mathContainer.value) {
    try {
      mathContainer.value.innerHTML = ''
      katex.render(latex, mathContainer.value, {
        displayMode: props.line.displayMode,
        throwOnError: false
      })
    } catch {
      mathContainer.value.textContent = latex
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
  min-width: 0;
  padding: 0;
  margin: 0;
  cursor: pointer;
  user-select: none;
  border-radius: 0;
  transition: all 0.15s;
  font-family: 'Cambria Math', 'TeX Gyre Termes', serif;
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
  margin: 8px 0;
}

.math-render {
  font-size: 16px;
  line-height: 1.7;
  min-height: 24px;
  display: inline-block;
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
