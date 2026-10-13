<script setup lang="ts">
import { provide } from 'vue'
import { useSunNotes, SunNotesKey } from './composables/useSunNotes'
import { useTheme } from './composables/useTheme'
import AppHeader from './components/AppHeader.vue'
import NoteSidebar from './components/NoteSidebar.vue'
import NoteEditor from './components/NoteEditor.vue'
import MarkdownPreview from './components/MarkdownPreview.vue'

// 笔记数据逻辑完全抽离到 useSunNotes，通过 provide/inject 共享
const sunnotes = useSunNotes()
provide(SunNotesKey, sunnotes)

useTheme()
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <div class="app-body">
      <NoteSidebar />
      <main class="workspace">
        <NoteEditor />
        <MarkdownPreview />
      </main>
    </div>
  </div>
</template>
