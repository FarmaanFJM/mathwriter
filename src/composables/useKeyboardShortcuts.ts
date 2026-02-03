// Keyboard shortcuts composable
import { onMounted, onUnmounted } from 'vue';
import { useNotesStore } from '../stores/notesStore';
import { useEditorStore } from '../stores/editorStore';
import { useMathBuilderStore } from '../stores/mathBuilderStore';

export function useKeyboardShortcuts() {
  const notesStore = useNotesStore();
  const editorStore = useEditorStore();
  const mathBuilderStore = useMathBuilderStore();

  function handleKeyDown(event: KeyboardEvent) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? event.metaKey : event.ctrlKey;

    // Ctrl/Cmd + N: New note
    if (modifier && event.key === 'n') {
      event.preventDefault();
      notesStore.createNote('Untitled Note');
      return;
    }

    // Ctrl/Cmd + F: Focus search
    if (modifier && event.key === 'f') {
      event.preventDefault();
      const searchInput = document.querySelector('.search-input') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
      return;
    }

    // Escape: Exit edit mode
    if (event.key === 'Escape') {
      if (mathBuilderStore.mode === 'edit') {
        event.preventDefault();
        mathBuilderStore.exitEditMode();
        editorStore.selectBlock(null);
      }
      return;
    }

    // Ctrl/Cmd + S: Manual save (auto-save is already active, but this provides feedback)
    if (modifier && event.key === 's') {
      event.preventDefault();
      if (notesStore.currentNote) {
        notesStore.saveCurrentNote();
        // Could show a toast notification here
      }
      return;
    }

    // Ctrl/Cmd + K: Command palette (future feature)
    if (modifier && event.key === 'k') {
      event.preventDefault();
      // Placeholder for future command palette
      console.log('Command palette (not implemented yet)');
      return;
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  return {
    // Expose any methods if needed
  };
}
