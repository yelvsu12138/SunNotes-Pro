<script setup lang="ts">
import { inject, ref } from 'vue'
import { SunNotesKey } from '../composables/useSunNotes'
import { formatDate, formatClock, formatRelative } from '../utils/format'

const api = inject(SunNotesKey)!

const tagInput = ref('')

/** 回车或逗号提交标签 */
function commitTag(): void {
  const note = api.activeNote.value
  if (!note) return
  const value = tagInput.value.trim().replace(/,$/, '').trim()
  if (!value) {
    tagInput.value = ''
    return
  }
  if (!note.tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
    api.updateActiveNote({ tags: [...note.tags, value] })
  }
  tagInput.value = ''
}

function removeTag(tag: string): void {
  const note = api.activeNote.value
  if (!note) return
  api.updateActiveNote({ tags: note.tags.filter((t) => t !== tag) })
}

/** 输入框为空时按退格键删除最后一个标签 */
function onTagKeydown(event: KeyboardEvent): void {
  const note = api.activeNote.value
  if (!note) return
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    commitTag()
  } else if (event.key === 'Backspace' && !tagInput.value && note.tags.length) {
    removeTag(note.tags[note.tags.length - 1])
  }
}

/** textarea 中按 Tab 插入两个空格，而非切换焦点 */
function onTextareaKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Tab') return
  event.preventDefault()
  const target = event.target as HTMLTextAreaElement
  const { selectionStart: start, selectionEnd: end } = target
  const indent = '  '
  target.setRangeText(indent, start, end, 'end')
  api.updateActiveNote({ content: target.value })
}
</script>

<template>
  <section class="editor pane">
    <template v-if="api.activeNote.value">
      <div class="editor-toolbar">
        <span class="pane-label">编辑</span>
        <button
          class="pin-toggle"
          :class="{ pinned: api.activeNote.value.pinned }"
          type="button"
          @click="api.togglePin(api.activeNote.value.id)"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path
              d="M14 3 9.5 8.5 4 10l5 4-2 7 5-5 5 5-2-7 5-4-5.5-1.5L10 3"
              :fill="api.activeNote.value.pinned ? 'currentColor' : 'none'"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
          </svg>
          {{ api.activeNote.value.pinned ? '已置顶' : '置顶' }}
        </button>
      </div>

      <input
        class="title-input"
        :value="api.activeNote.value.title"
        type="text"
        placeholder="无标题笔记"
        @input="api.updateActiveNote({ title: ($event.target as HTMLInputElement).value })"
      />

      <!-- 标签编辑 -->
      <div class="tag-editor">
        <span v-for="tag in api.activeNote.value.tags" :key="tag" class="tag-pill">
          #{{ tag }}
          <button type="button" :title="`移除标签 ${tag}`" @click="removeTag(tag)">×</button>
        </span>
        <input
          v-model="tagInput"
          type="text"
          placeholder="添加标签后按回车…"
          @keydown="onTagKeydown"
          @blur="commitTag"
        />
      </div>

      <textarea
        class="content-input"
        :value="api.activeNote.value.content"
        placeholder="在这里开始书写，支持 Markdown 语法…"
        spellcheck="false"
        @input="api.updateActiveNote({ content: ($event.target as HTMLTextAreaElement).value })"
        @keydown="onTextareaKeydown"
      />

      <div class="editor-footer">
        <span>创建于 {{ formatDate(api.activeNote.value.createdAt) }} {{ formatClock(api.activeNote.value.createdAt) }}</span>
        <span>更新于 {{ formatRelative(api.activeNote.value.updatedAt) }}</span>
      </div>
    </template>

    <div v-else class="editor-empty">
      <svg viewBox="0 0 100 100" width="84" height="84" aria-hidden="true">
        <circle cx="50" cy="50" r="22" fill="#FFB300" />
        <g stroke="#FFB300" stroke-width="7" stroke-linecap="round">
          <path d="M50 8v12M50 80v12M8 50h12M80 50h12M20 20l9 9M71 71l9 9M80 20l-9 9M29 71l-9 9" />
        </g>
      </svg>
      <h2>选择或创建一条笔记</h2>
      <p>点击左上方「新建笔记」，让阳光照进你的灵感 ☀️</p>
    </div>
  </section>
</template>
