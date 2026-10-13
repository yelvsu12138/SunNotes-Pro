/** 单条笔记的数据结构 */
export interface Note {
  /** 唯一 ID */
  id: string
  /** 笔记标题 */
  title: string
  /** Markdown 正文 */
  content: string
  /** 标签列表 */
  tags: string[]
  /** 是否置顶 */
  pinned: boolean
  /** 创建时间戳（ms） */
  createdAt: number
  /** 最后更新时间戳（ms） */
  updatedAt: number
}

/** 创建笔记时的初始字段 */
export type NoteDraft = Partial<Pick<Note, 'title' | 'content' | 'tags' | 'pinned'>>

/** 导出文件的 JSON 结构 */
export interface SunNotesBackup {
  app: 'SunNotes'
  version: 1
  exportedAt: string
  notes: Note[]
}
