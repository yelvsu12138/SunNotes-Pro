<script setup lang="ts">
import { inject, computed } from 'vue'
import { SunNotesKey } from '../composables/useSunNotes'
import { renderMarkdown } from '../utils/markdown'

const api = inject(SunNotesKey)!

// computed 缓存：仅在正文变化时重新解析
const renderedHtml = computed(() =>
  renderMarkdown(api.activeNote.value?.content ?? '')
)
</script>

<template>
  <section class="preview pane">
    <div class="preview-toolbar">
      <span class="pane-label">预览</span>
    </div>

    <div v-if="api.activeNote.value" class="md-body" v-html="renderedHtml" />

    <div v-else class="preview-empty">
      <p>预览区</p>
    </div>
  </section>
</template>
