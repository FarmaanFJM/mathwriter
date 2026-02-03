// Pinia store for editor state management
import { defineStore } from 'pinia';
import type { MathAst } from '../types';

interface EditorState {
  caretPosition: number; // Index of the block where caret is
  selectedBlockId: string | null;
  searchQuery: string;
  theme: 'light' | 'dark';
}

export const useEditorStore = defineStore('editor', {
  state: (): EditorState => ({
    caretPosition: 0,
    selectedBlockId: null,
    searchQuery: '',
    theme: 'light',
  }),

  actions: {
    setCaretPosition(position: number) {
      this.caretPosition = position;
    },

    selectBlock(blockId: string | null) {
      this.selectedBlockId = blockId;
    },

    setSearchQuery(query: string) {
      this.searchQuery = query;
    },

    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      // Apply theme to document
      document.documentElement.setAttribute('data-theme', this.theme);
    },

    initTheme() {
      // Load theme from localStorage or system preference
      const savedTheme = localStorage.getItem('mathwriter-theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        this.theme = savedTheme;
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.theme = prefersDark ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', this.theme);
    },
  },

});
