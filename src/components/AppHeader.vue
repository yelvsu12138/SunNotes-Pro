<script setup lang="ts">
import { inject, computed } from 'vue'
import { SunNotesKey } from '../composables/useSunNotes'
import { useTheme } from '../composables/useTheme'
import { formatClock } from '../utils/format'

const api = inject(SunNotesKey)!
const { theme, toggleTheme } = useTheme()

const saveStatus = computed(() =>
  api.lastSavedAt.value ? `已自动保存 ${formatClock(api.lastSavedAt.value)}` : '编辑后自动保存'
)

/** 导出 JSON 备份文件 */
function handleExport(): void {
  const blob = new Blob([api.exportData()], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `sunnotes-backup-${stamp}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** 导入 JSON 备份 */
function handleImportClick(): void {
  if (!window.confirm('导入将覆盖当前所有笔记，确定继续吗？')) return
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json,.json'
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const count = api.importData(String(reader.result))
        window.alert(`导入成功，共恢复 ${count} 条笔记 ☀️`)
      } catch (err) {
        window.alert(`导入失败：${err instanceof Error ? err.message : '文件格式不正确'}`)
      }
    }
    reader.onerror = () => window.alert('读取文件失败，请重试')
    reader.readAsText(file)
  }
  input.click()
}
</script>

<template>
  <header class="app-header">
    <div class="brand">
      <svg class="brand-sun" viewBox="0 0 100 100" width="34" height="34" aria-hidden="true">
        <circle cx="50" cy="50" r="26" fill="#FFB300" />
        <g stroke="#FFB300" stroke-width="8" stroke-linecap="round">
          <path d="M50 5v14M50 81v14M5 50h14M81 50h14M18 18l10 10M72 72l10 10M82 18L72 28M28 72l-10 10" />
        </g>
      </svg>
      <div class="brand-text">
        <h1>SunNotes</h1>
        <span>阳光笔记</span>
      </div>
    </div>

    <div class="search-box">
      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      <input
        v-model="api.searchQuery.value"
        type="search"
        placeholder="搜索笔记标题、内容或标签…"
        aria-label="搜索笔记"
      />
    </div>

    <div class="header-actions">
      <span class="save-status" title="停止输入 500ms 后自动保存到浏览器">
        <span class="save-dot" />
        {{ saveStatus }}
      </span>
      <button class="icon-btn" type="button" @click="handleExport" title="导出 JSON 备份">
        <svg viewBox="0 0 24 24" width="19" height="19">
          <path d="M12 3v12m0 0 4-4m-4 4-4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
      <button class="icon-btn" type="button" @click="handleImportClick" title="从 JSON 导入">
        <svg viewBox="0 0 24 24" width="19" height="19">
          <path d="M12 15V3m0 0 4 4m-4-4-4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
      <button class="icon-btn theme-btn" type="button" @click="toggleTheme" :title="theme === 'light' ? '切换到深色模式' : '切换到浅色模式'">
        <svg v-if="theme === 'light'" viewBox="0 0 24 24" width="19" height="19">
          <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="19" height="19">
          <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2" />
          <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4 19 19M19 5l-1.6 1.6M6.6 17.4 5 19" />
          </g>
        </svg>
      </button>
    </div>
  </header>
</template>
