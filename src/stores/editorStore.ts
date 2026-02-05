import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useEditorStore = defineStore('editor', () => {
  const theme = ref<'light' | 'dark'>('light')

  const currentFontSize = ref<number>(16)
  const isBold = ref(false)
  const isItalic = ref(false)
  const isUnderline = ref(false)

  // Initialize theme from localStorage or system preference
  function initTheme() {
    const saved = localStorage.getItem('mathwriter-theme')
    if (saved === 'light' || saved === 'dark') {
      theme.value = saved
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      theme.value = prefersDark ? 'dark' : 'light'
    }
    applyTheme()
  }

  // Toggle between light and dark
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

  function setFontSize(fontSize: number) {
    currentFontSize.value = fontSize
    localStorage.setItem('mathwriter-font-size', String(fontSize))
  }

  function toggleBold() {
    isBold.value = !isBold.value
    localStorage.setItem('mathwriter-bold', String(isBold.value))
  }

  function toggleItalic() {
    isItalic.value = !isItalic.value
    localStorage.setItem('mathwriter-italic', String(isItalic.value))
  }

  function toggleUnderline() {
    isUnderline.value = !isUnderline.value
    localStorage.setItem('mathwriter-underline', String(isUnderline.value))
  }

  // Apply theme to document
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  // Watch theme changes
  watch(theme, () => {
    applyTheme()
  })

  return {
    theme,
    currentFontSize,
    isBold,
    isItalic,
    isUnderline,
    initTheme,
    initFormatting,
    toggleTheme,
    setFontSize,
    toggleBold,
    toggleItalic,
    toggleUnderline
  }
})
