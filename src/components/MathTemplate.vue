<template>
  <span
    class="math-template"
    :class="{
      'is-active': isAnySlotActive,
      'is-large-operator': template?.isLargeOperator,
    }"
    @click.stop="handleSlotClick"
  >
    <!-- Rendered KaTeX output -->
    <span class="math-template-render" ref="renderContainer" @click.stop="handleSlotClick"></span>
  </span>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import type { MathTemplateSpan } from '../types/editor'
import { mathTemplates } from '../utils/mathTemplates'

interface Props {
  span: MathTemplateSpan
  activeSlotName: string | null  // which slot is being edited, or null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  focusSlot: [spanId: string, slotName: string]
}>()

const renderContainer = ref<HTMLElement | null>(null)

const template = computed(() => mathTemplates[props.span.templateId])

const isAnySlotActive = computed(() => props.activeSlotName !== null)

// Compile and render
const compiledLatex = computed(() => {
  if (!template.value) return ''

  // Build slot values with visual markers for active slot
  const values: Record<string, string> = {}
  for (const slot of template.value.slots) {
    const val = props.span.slotValues[slot.name] || ''
    const isActive = props.activeSlotName === slot.name
    const isPlaceholder = !val
    const slotContent = val ? val : `\\text{${slot.placeholder}}`
    const slotClasses = [
      'slot-hit',
      `slot-${slot.name}`,
      isActive ? 'slot-active' : '',
      isPlaceholder ? 'slot-placeholder' : ''
    ].filter(Boolean).join(' ')
    values[slot.name] = `\\class{${slotClasses}}{${slotContent}}`
  }

  return template.value.compile(values)
})

function renderMath() {
  if (!renderContainer.value) return
  try {
    renderContainer.value.innerHTML = ''
    katex.render(compiledLatex.value, renderContainer.value, {
      displayMode: false,
      throwOnError: false,
      trust: true,
    })
  } catch {
    renderContainer.value.textContent = compiledLatex.value
  }
}

onMounted(() => {
  renderMath()
})

watch(compiledLatex, () => {
  nextTick(() => renderMath())
})

function handleSlotClick(event: MouseEvent) {
  if (!template.value) return
  const target = event.target as HTMLElement
  const slotEl = target.closest('.slot-hit') as HTMLElement | null
  if (slotEl) {
    const slotClass = Array.from(slotEl.classList).find((cls) => cls.startsWith('slot-') && cls !== 'slot-hit' && cls !== 'slot-active' && cls !== 'slot-placeholder')
    if (slotClass) {
      const slotName = slotClass.replace('slot-', '')
      if (slotName) {
        emit('focusSlot', props.span.id, slotName)
        return
      }
    }
  }
  const bodySlot = template.value.slots.find((slot) => slot.name === 'body')
  const fallbackSlot = bodySlot ?? template.value.slots[0]
  if (fallbackSlot) {
    emit('focusSlot', props.span.id, fallbackSlot.name)
  }
}
</script>

<style scoped>
.math-template {
  display: inline-flex;
  align-items: center;
  position: relative;
  cursor: text;
  user-select: none;
  vertical-align: middle;
  padding: 0 2px;
  border-radius: 0;
  transition: none;
}

.math-template:hover {
  background: transparent;
}

.math-template.is-active {
  background: transparent;
  outline: none;
}

.math-template.is-large-operator {
  /* Large operators get more breathing room */
  padding: 2px 4px;
}

.math-template-render {
  display: inline-block;
  line-height: normal;
}

/* Large operator sizing - 2-2.5x */
.math-template.is-large-operator :deep(.katex) {
  font-size: 1.1em;
}

.math-template.is-large-operator :deep(.katex .op-limits > .vlist-t) {
  font-size: 1em;
}

/* Slot styling */
.math-template :deep(.slot-hit) {
  cursor: text;
}

.math-template :deep(.slot-placeholder) {
  color: var(--color-text-tertiary);
}

.math-template :deep(.slot-active) {
  position: relative;
}

.math-template :deep(.slot-active)::after {
  content: '';
  display: inline-block;
  width: 1px;
  height: 1em;
  background: var(--color-text-primary);
  margin-left: 1px;
  animation: slotBlink 1s infinite;
  vertical-align: -2px;
}

@keyframes slotBlink {
  0%, 49%, 100% { opacity: 1; }
  50%, 99% { opacity: 0; }
}

/* Dark theme */
[data-theme='dark'] .math-template:hover {
  background: transparent;
}

[data-theme='dark'] .math-template.is-active {
  background: transparent;
  outline-color: transparent;
}
</style>
