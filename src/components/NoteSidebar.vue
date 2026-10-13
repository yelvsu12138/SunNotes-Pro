<script setup lang="ts">
import { inject } from 'vue'
import { SunNotesKey } from '../composables/useSunNotes'
import { formatRelative } from '../utils/format'

const api = inject(SunNotesKey)!

function handleDelete(id: string, title: string): void {
  const name = title.trim() || '无标题笔记'
  if (window.confirm(`确定删除「${name}」吗？此操作不可撤销。`)) {
    api.deleteNote(id)
  }
}
</script>

<template>
  <aside class="sidebar">
    <button class="new-note-btn" type="button" @click="api.createNote()">
      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
        <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
      </svg>
      新建笔记
    </button>

    <!-- 标签筛选 -->
    <div v-if="api.allTags.value.length" class="tag-filter">
      <button
        class="tag-chip"
        :class="{ active: api.activeTag.value === null }"
        type="button"
        @click="api.setTagFilter(null)"
      >
        全部
      </button>
      <button
        v-for="tag in api.allTags.value"
        :key="tag.name"
        class="tag-chip"
        :class="{ active: api.activeTag.value === tag.name }"
        type="button"
        @click="api.setTagFilter(api.activeTag.value === tag.name ? null : tag.name)"
      >
        #{{ tag.name }}
        <span class="tag-count">{{ tag.count }}</span>
      </button>
    </div>

    <!-- 笔记列表 -->
    <div class="note-list">
      <article
        v-for="note in api.filteredNotes.value"
        :key="note.id"
        class="note-card"
        :class="{ active: note.id === api.activeId.value }"
        @click="api.selectNote(note.id)"
      >
        <div class="note-card-head">
          <h3 class="note-card-title">{{ note.title.trim() || '无标题笔记' }}</h3>
          <button
            class="pin-btn"
            :class="{ pinned: note.pinned }"
            type="button"
            :title="note.pinned ? '取消置顶' : '置顶'"
            @click.stop="api.togglePin(note.id)"
          >
            <svg viewBox="0 0 24 24" width="15" height="15">
              <path
                d="M14 3 9.5 8.5 4 10l5 4-2 7 5-5 5 5-2-7 5-4-5.5-1.5L10 3"
                :fill="note.pinned ? 'currentColor' : 'none'"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <p class="note-card-snippet">{{ note.content.trim() || '点击开始编辑…' }}</p>

        <div class="note-card-meta">
          <div class="note-card-tags">
            <span v-for="tag in note.tags.slice(0, 3)" :key="tag" class="mini-tag">#{{ tag }}</span>
          </div>
          <time>{{ formatRelative(note.updatedAt) }}</time>
        </div>

        <button
          class="delete-btn"
          type="button"
          title="删除笔记"
          @click.stop="handleDelete(note.id, note.title)"
        >
          <svg viewBox="0 0 24 24" width="15" height="15">
            <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7"
              fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </article>

      <div v-if="!api.filteredNotes.value.length" class="empty-list">
        <svg viewBox="0 0 100 100" width="52" height="52" aria-hidden="true">
          <circle cx="50" cy="50" r="24" fill="currentColor" opacity="0.25" />
          <g stroke="currentColor" stroke-width="6" stroke-linecap="round" opacity="0.4">
            <path d="M50 10v10M50 80v10M10 50h10M80 50h10" />
          </g>
        </svg>
        <p>没有匹配的笔记</p>
      </div>
    </div>
  </aside>
</template>
