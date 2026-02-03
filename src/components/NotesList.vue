<template>
  <div class="notes-list">
    <!-- Search and create -->
    <div class="notes-header">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search notes..."
        class="search-input"
      />
      <button class="btn-primary" @click="createNewNote">
        + New Note
      </button>
    </div>

    <!-- Notes list -->
    <div class="notes-items">
      <div
        v-for="note in filteredNotes"
        :key="note.id"
        class="note-item"
        :class="{ active: notesStore.currentNote?.id === note.id }"
        @click="loadNote(note.id)"
      >
        <div class="note-title">{{ note.title }}</div>
        <div class="note-meta">
          {{ formatDate(note.updatedAt) }}
        </div>
      </div>

      <div v-if="filteredNotes.length === 0" class="empty-state">
        <p v-if="searchQuery">No notes found</p>
        <p v-else>No notes yet. Create one!</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useNotesStore } from '../stores/notesStore';

const notesStore = useNotesStore();
const searchQuery = ref('');

const filteredNotes = computed(() => {
  if (!searchQuery.value) {
    return notesStore.sortedNotes;
  }
  
  const query = searchQuery.value.toLowerCase();
  return notesStore.sortedNotes.filter(note =>
    note.title.toLowerCase().includes(query)
  );
});

async function createNewNote() {
  await notesStore.createNote('Untitled Note');
}

async function loadNote(id: string) {
  await notesStore.loadNote(id);
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
</script>

<style scoped>
.notes-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.notes-header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.search-input {
  width: 100%;
  height: 36px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.btn-primary {
  width: 100%;
  height: 36px;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-accent);
  color: white;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: var(--font-size-sm);
  transition: background var(--transition-fast);
}

.btn-primary:hover {
  background: var(--color-accent-hover);
}

.notes-items {
  flex: 1;
  overflow-y: auto;
}

.note-item {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.note-item:hover {
  background: var(--color-bg-hover);
}

.note-item.active {
  background: var(--color-bg-active);
  border-left: 3px solid var(--color-accent);
  padding-left: calc(var(--spacing-md) - 3px);
}

.note-title {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-meta {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.empty-state {
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--color-text-tertiary);
}
</style>
