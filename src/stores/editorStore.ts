import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useEditorStore = defineStore('editor', () => {
  const theme = ref<'light' | 'dark'>('light')

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
    initTheme,
    toggleTheme
  }
})
