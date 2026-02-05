import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

interface SelectionRange {
  lineId: string
  start: number
  end: number
}

interface FormattingPatch {
  fontSize?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
}

export const useEditorStore = defineStore('editor', () => {
  const theme = ref<'light' | 'dark'>('light')

  const currentFontSize = ref<number>(16)
  const isBold = ref(false)
  const isItalic = ref(false)
  const isUnderline = ref(false)
  const selection = ref<SelectionRange | null>(null)

  const hasSelection = computed(() => {
    if (!selection.value) return false
    return selection.value.start !== selection.value.end
  })

  function initTheme() {
    const saved = localStorage.getItem('mathwriter-theme')
    if (saved === 'light' || saved === 'dark') {
      theme.value = saved
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      theme.value = prefersDark ? 'dark' : 'light'
    }
    applyTheme()
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    applyTheme()
    localStorage.setItem('mathwriter-theme', theme.value)
  }

  function initFormatting() {
    const savedFontSize = Number(localStorage.getItem('mathwriter-font-size'))
    if (!Number.isNaN(savedFontSize) && savedFontSize >= 8 && savedFontSize <= 72) {
      currentFontSize.value = savedFontSize
    }

    isBold.value = localStorage.getItem('mathwriter-bold') === 'true'
    isItalic.value = localStorage.getItem('mathwriter-italic') === 'true'
    isUnderline.value = localStorage.getItem('mathwriter-underline') === 'true'
  }

  function setSelection(nextSelection: SelectionRange | null) {
    selection.value = nextSelection
  }

  function clearSelection() {
    selection.value = null
  }

  function setToolbarState(format: FormattingPatch) {
    if (typeof format.fontSize === 'number') {
      currentFontSize.value = format.fontSize
    }
    if (typeof format.bold === 'boolean') {
      isBold.value = format.bold
    }
    if (typeof format.italic === 'boolean') {
      isItalic.value = format.italic
    }
    if (typeof format.underline === 'boolean') {
      isUnderline.value = format.underline
    }
  }

  function setFontSize(fontSize: number): FormattingPatch {
    currentFontSize.value = fontSize
    localStorage.setItem('mathwriter-font-size', String(fontSize))
    return { fontSize }
  }

  function toggleBold(): FormattingPatch {
    const nextValue = !isBold.value
    isBold.value = nextValue
    localStorage.setItem('mathwriter-bold', String(nextValue))
    return { bold: nextValue }
  }

  function toggleItalic(): FormattingPatch {
    const nextValue = !isItalic.value
    isItalic.value = nextValue
    localStorage.setItem('mathwriter-italic', String(nextValue))
    return { italic: nextValue }
  }

  function toggleUnderline(): FormattingPatch {
    const nextValue = !isUnderline.value
    isUnderline.value = nextValue
    localStorage.setItem('mathwriter-underline', String(nextValue))
    return { underline: nextValue }
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  watch(theme, () => {
    applyTheme()
  })

  return {
    theme,
    currentFontSize,
    isBold,
    isItalic,
    isUnderline,
    selection,
    hasSelection,
    initTheme,
    initFormatting,
    toggleTheme,
    setToolbarState,
    setSelection,
    clearSelection,
    setFontSize,
    toggleBold,
    toggleItalic,
    toggleUnderline
  }
})
