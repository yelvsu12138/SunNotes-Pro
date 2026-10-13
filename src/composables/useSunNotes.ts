/**
 * useSunNotes —— SunNotes 的核心 Composable
 *
 * 笔记的全部数据逻辑（增删改查、置顶、标签、搜索、本地持久化、
 * 500ms 防抖自动保存、JSON 导入导出）都在此抽离，
 * 组件层只负责渲染与交互。
 */
import { ref, computed, watch, type InjectionKey } from 'vue'
import type { Note, NoteDraft, SunNotesBackup } from '../types'

const STORAGE_KEY = 'sunnotes:notes:v1'
const AUTOSAVE_DELAY = 500

/** 生成唯一 ID */
function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

/** 从 localStorage 读取笔记 */
function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidNote)
  } catch {
    return []
  }
}

/** 运行时校验一条数据是否为合法 Note（导入数据时同样使用） */
function isValidNote(value: unknown): value is Note {
  if (typeof value !== 'object' || value === null) return false
  const n = value as Record<string, unknown>
  return (
    typeof n.id === 'string' &&
    typeof n.title === 'string' &&
    typeof n.content === 'string' &&
    Array.isArray(n.tags) &&
    n.tags.every((t) => typeof t === 'string') &&
    typeof n.pinned === 'boolean' &&
    typeof n.createdAt === 'number' &&
    typeof n.updatedAt === 'number'
  )
}

/** 将任意输入规范化为 Note，无法识别返回 null */
function normalizeNote(value: unknown): Note | null {
  if (typeof value !== 'object' || value === null) return null
  const n = value as Record<string, unknown>
  const now = Date.now()
  const tags = Array.isArray(n.tags)
    ? n.tags.filter((t): t is string => typeof t === 'string')
    : []
  return {
    id: typeof n.id === 'string' && n.id ? n.id : uid(),
    title: typeof n.title === 'string' ? n.title : '',
    content: typeof n.content === 'string' ? n.content : '',
    tags: [...new Set(tags.map((t) => t.trim()).filter(Boolean))],
    pinned: n.pinned === true,
    createdAt: typeof n.createdAt === 'number' ? n.createdAt : now,
    updatedAt: typeof n.updatedAt === 'number' ? n.updatedAt : now
  }
}

/** 首次使用时的示例笔记 */
function createWelcomeNote(): Note {
  const now = Date.now()
  return {
    id: uid(),
    title: '欢迎使用 SunNotes',
    pinned: true,
    tags: ['指南', 'Markdown'],
    createdAt: now,
    updatedAt: now,
    content: `# 欢迎使用 SunNotes 🌞

一款**阳光明媚**的在线笔记应用，所有数据都安全地保存在你的浏览器本地。

## ✨ 核心功能

- **Markdown 实时预览**：边写边看，即刻呈现
- 🏷️ **标签分类**：给笔记打上标签，快速筛选
- 📌 **置顶管理**：重要笔记永远排在最前
- 🌙 **深色 / 浅色主题**：一键切换，昼夜相宜
- 💾 **自动保存**：停止输入 500ms 后自动写入本地
- 📦 **备份恢复**：支持 JSON 导出与导入

## Markdown 语法示例

### 文本样式

这里是 **粗体**、*斜体*、~~删除线~~ 和 \`行内代码\`。

### 代码块

\`\`\`ts
// 解析器会自动转义，防止 XSS 攻击
const greet = (name: string): string => {
  return \`Hello, \${name}!\`
}
\`\`\`

### 引用

> 阳光正好，微风不燥 —— 记录此刻的想法吧。

### 列表

1. 点击左侧「新建笔记」开始写作
2. 用标签整理你的灵感
3. 随时导出 JSON 备份数据

---

祝你记录愉快！☀️`
  }
}

export function useSunNotes() {
  // ---------- 响应式状态 ----------
  const notes = ref<Note[]>([])
  const activeId = ref<string | null>(null)
  const searchQuery = ref('')
  const activeTag = ref<string | null>(null)
  /** 最近一次保存成功的时间戳 */
  const lastSavedAt = ref<number | null>(null)
  /** 防抖计时器句柄 */
  let saveTimer: ReturnType<typeof setTimeout> | undefined

  // ---------- 初始化 ----------
  const stored = loadNotes()
  if (stored.length > 0) {
    notes.value = stored
  } else {
    const welcome = createWelcomeNote()
    notes.value = [welcome]
    // 首次写入示例数据
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.value))
  }
  activeId.value = notes.value[0]?.id ?? null

  // ---------- 500ms 防抖自动保存 ----------
  watch(
    notes,
    (value) => {
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
          lastSavedAt.value = Date.now()
        } catch (err) {
          // 存储空间不足等异常
          console.error('[SunNotes] 自动保存失败：', err)
        }
      }, AUTOSAVE_DELAY)
    },
    { deep: true }
  )

  // ---------- 计算属性 ----------

  /** 全部标签及其使用次数 */
  const allTags = computed(() => {
    const counter = new Map<string, number>()
    for (const note of notes.value) {
      for (const tag of note.tags) {
        counter.set(tag, (counter.get(tag) ?? 0) + 1)
      }
    }
    return [...counter.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  })

  /** 经过标签 + 关键词筛选后的笔记，置顶优先，再按更新时间倒序 */
  const filteredNotes = computed(() => {
    const keyword = searchQuery.value.trim().toLowerCase()
    return notes.value
      .filter((note) => (activeTag.value ? note.tags.includes(activeTag.value) : true))
      .filter((note) => {
        if (!keyword) return true
        return (
          note.title.toLowerCase().includes(keyword) ||
          note.content.toLowerCase().includes(keyword) ||
          note.tags.some((t) => t.toLowerCase().includes(keyword))
        )
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)
  })

  /** 当前选中的笔记 */
  const activeNote = computed(
    () => notes.value.find((note) => note.id === activeId.value) ?? null
  )

  // ---------- 操作方法 ----------

  function selectNote(id: string): void {
    activeId.value = id
  }

  function createNote(): Note {
    const now = Date.now()
    const note: Note = {
      id: uid(),
      title: '',
      content: '',
      tags: activeTag.value ? [activeTag.value] : [],
      pinned: false,
      createdAt: now,
      updatedAt: now
    }
    notes.value.unshift(note)
    activeId.value = note.id
    return note
  }

  /** 更新当前笔记（局部字段合并，自动刷新 updatedAt） */
  function updateActiveNote(patch: NoteDraft): void {
    const note = notes.value.find((n) => n.id === activeId.value)
    if (!note) return
    if (patch.tags) {
      patch.tags = [...new Set(patch.tags.map((t) => t.trim()).filter(Boolean))]
    }
    Object.assign(note, patch, { updatedAt: Date.now() })
  }

  function deleteNote(id: string): void {
    const index = notes.value.findIndex((n) => n.id === id)
    if (index === -1) return
    notes.value.splice(index, 1)
    if (activeId.value === id) {
      activeId.value = notes.value[0]?.id ?? null
    }
  }

  function togglePin(id: string): void {
    const note = notes.value.find((n) => n.id === id)
    if (note) note.pinned = !note.pinned
  }

  function setTagFilter(tag: string | null): void {
    activeTag.value = tag
  }

  // ---------- 导入 / 导出 ----------

  /** 导出为格式化的 JSON 字符串 */
  function exportData(): string {
    const backup: SunNotesBackup = {
      app: 'SunNotes',
      version: 1,
      exportedAt: new Date().toISOString(),
      notes: notes.value
    }
    return JSON.stringify(backup, null, 2)
  }

  /**
   * 从 JSON 文本恢复笔记（整体覆盖）。
   * 格式非法或无有效笔记时抛出异常。返回导入条数。
   */
  function importData(json: string): number {
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      throw new Error('文件不是合法的 JSON')
    }

    // 兼容备份文件 { notes: [] } 与裸数组 []
    const list: unknown =
      typeof parsed === 'object' && parsed !== null && 'notes' in parsed
        ? (parsed as Record<string, unknown>).notes
        : parsed

    if (!Array.isArray(list)) {
      throw new Error('文件中未找到笔记数组')
    }

    const normalized = list
      .map(normalizeNote)
      .filter((n): n is Note => n !== null)

    if (normalized.length === 0) {
      throw new Error('文件中没有可导入的有效笔记')
    }

    notes.value = normalized
    activeId.value = normalized[0].id
    activeTag.value = null
    searchQuery.value = ''
    return normalized.length
  }

  return {
    // 状态
    notes,
    activeId,
    activeNote,
    searchQuery,
    activeTag,
    lastSavedAt,
    // 计算属性
    allTags,
    filteredNotes,
    // 方法
    selectNote,
    createNote,
    updateActiveNote,
    deleteNote,
    togglePin,
    setTagFilter,
    exportData,
    importData
  }
}

export type SunNotesApi = ReturnType<typeof useSunNotes>

/** provide / inject 键 */
export const SunNotesKey: InjectionKey<SunNotesApi> = Symbol('SunNotes')
