<template>
  <div class="app">
    <MathWriter />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useEditorStore } from './stores/editorStore';
import MathWriter from './components/MathWriter.vue';

const editorStore = useEditorStore();

onMounted(() => {
  // Initialize theme
  editorStore.initTheme();
});
</script>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
