<template>
  <span
    class="math-template"
    :class="{
      'is-active': isAnySlotActive,
      'is-large-operator': template?.isLargeOperator,
    }"
    @click.stop="handleClick"
  >
    <!-- Rendered KaTeX output -->
    <span class="math-template-render" ref="renderContainer"></span>

    <!-- Slot overlay buttons (positioned over the rendered output) -->
    <span
      v-for="slot in slotPositions"
      :key="slot.name"
      class="slot-overlay"
      :class="{
        'is-active-slot': activeSlotName === slot.name,
        'is-empty': !span.slotValues[slot.name],
      }"
      :style="slot.style"
      :data-slot-name="slot.name"
      @click.stop="$emit('focusSlot', span.id, slot.name)"
    >
      <!-- When editing this slot, show input indicator -->
      <span v-if="activeSlotName === slot.name" class="slot-caret"></span>
    </span>
  </span>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import type { MathTemplateSpan } from '../types/editor'
import { mathTemplates, compileTemplate, type SlotDefinition } from '../utils/mathTemplates'

interface Props {
  span: MathTemplateSpan
  activeSlotName: string | null  // which slot is being edited, or null
}

const props = defineProps<Props>()

defineEmits<{
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
    if (props.activeSlotName === slot.name) {
      // Show placeholder with cursor indicator when editing empty slot
      if (!val) {
        values[slot.name] = `\\textcolor{#4dabf7}{\\text{${slot.placeholder}}}`
      } else {
        values[slot.name] = val
      }
    } else {
      if (!val) {
        values[slot.name] = `\\textcolor{#adb5bd}{\\text{${slot.placeholder}}}`
      } else {
        values[slot.name] = val
      }
    }
  }

  return template.value.compile(values)
})

// Slot hit regions (simplified: we use the whole template as click target
// and let the parent determine which slot to focus based on template layout)
const slotPositions = computed(() => {
  if (!template.value) return []
  // We return slot definitions - actual positioning handled by CSS overlay
  return template.value.slots.map((slot: SlotDefinition) => ({
    name: slot.name,
    placeholder: slot.placeholder,
    style: {} // positioned via CSS flow
  }))
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

function handleClick(event: MouseEvent) {
  // If no slot is active, focus the first slot
  if (!template.value) return
  // Determine which slot to focus based on click position
  // For simplicity, if clicking the template and no slot is active, focus first slot
}
</script>

<style scoped>
.math-template {
  display: inline-flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  user-select: none;
  vertical-align: middle;
  padding: 0 2px;
  border-radius: 3px;
  transition: background 0.15s;
}

.math-template:hover {
  background: rgba(77, 171, 247, 0.06);
}

.math-template.is-active {
  background: rgba(77, 171, 247, 0.1);
  outline: 1.5px solid rgba(77, 171, 247, 0.3);
  outline-offset: 1px;
}

.math-template.is-large-operator {
  /* Large operators get more breathing room */
  padding: 2px 4px;
}

.math-template-render {
  display: inline-block;
  line-height: 1;
}

/* Large operator sizing - 2-2.5x */
.math-template.is-large-operator :deep(.katex) {
  font-size: 1.1em;
}

.math-template.is-large-operator :deep(.katex .op-symbol.large-op) {
  font-size: 2.4em !important;
}

.math-template.is-large-operator :deep(.katex .op-limits > .vlist-t) {
  font-size: 1em;
}

/* Slot overlay - invisible click targets */
.slot-overlay {
  position: absolute;
  cursor: text;
  z-index: 1;
  /* These are invisible by default - just hit targets */
  opacity: 0;
  pointer-events: none;
}

.slot-overlay.is-active-slot {
  opacity: 1;
  pointer-events: auto;
}

.slot-caret {
  display: inline-block;
  width: 1.5px;
  height: 1em;
  background: #2196F3;
  animation: slotBlink 1s infinite;
  position: absolute;
  right: -1px;
  top: 50%;
  transform: translateY(-50%);
}

@keyframes slotBlink {
  0%, 49%, 100% { opacity: 1; }
  50%, 99% { opacity: 0; }
}

/* Dark theme */
[data-theme='dark'] .math-template:hover {
  background: rgba(77, 171, 247, 0.08);
}

[data-theme='dark'] .math-template.is-active {
  background: rgba(77, 171, 247, 0.15);
  outline-color: rgba(77, 171, 247, 0.4);
}
</style>
