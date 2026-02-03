import { defineStore } from 'pinia';

export interface EditorStoreState {
  theme: 'light' | 'dark';
}

export const useEditorStore = defineStore('editor', {
  state: (): EditorStoreState => ({
    theme: 'light',
  }),

  actions: {
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', this.theme);
      localStorage.setItem('mathwriter-theme', this.theme);
    },

    initTheme() {
      const savedTheme = localStorage.getItem('mathwriter-theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        this.theme = savedTheme;
      } else {
        // Detect system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.theme = prefersDark ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', this.theme);
    },
  },
});
