# SunNotes Pro · 在线笔记应用

![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

> 纯前端在线笔记应用：Markdown 实时预览、标签分类、置顶管理、深色/浅色主题切换，数据存储在浏览器 localStorage，支持 JSON 导出/导入备份。

## ✨ 特性

- **笔记管理**：增删改查、标签分类、置顶管理、关键词搜索
- **Markdown 实时预览**：自研轻量级解析器，支持标题、粗体、代码块、引用等语法，HTML 转义防范 XSS 攻击，解析耗时控制在 1ms 以内
- **自动保存**：500ms 防抖机制，平衡编辑流畅度与数据安全
- **备份恢复**：JSON 格式数据导出/导入，读取时做运行时类型校验，拦截非法数据
- **主题切换**：基于 CSS Variables 的深色/浅色主题，切换即时生效
- **逻辑抽离**：笔记数据逻辑全部封装在 `useSunNotes` Composable，通过 `ref/computed/watch` 构建响应式数据流，组件层只负责渲染与交互

## 🛠 技术栈

- **框架**：Vue 3.5（`<script setup>` + Composition API）+ TypeScript
- **构建**：Vite 5 + vue-tsc 类型检查
- **存储**：localStorage（无后端依赖，纯前端运行）
- **Markdown**：自研解析器，零第三方依赖

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务
npm run dev

# 生产构建
npm run build

# 类型检查
npm run build
```

## 📦 目录结构

```
SunNotes Pro
├── src/
│   ├── components/
│   │   ├── AppHeader.vue        # 顶部栏（搜索 / 主题切换 / 导入导出）
│   │   ├── NoteSidebar.vue      # 侧边栏（笔记列表 / 标签 / 置顶）
│   │   ├── NoteEditor.vue       # 编辑器
│   │   └── MarkdownPreview.vue  # Markdown 实时预览
│   ├── composables/
│   │   ├── useSunNotes.ts       # 核心数据逻辑（CRUD / 持久化 / 防抖保存 / 导入导出）
│   │   └── useTheme.ts          # 主题切换（CSS Variables）
│   ├── utils/
│   │   ├── markdown.ts          # 自研 Markdown 解析器（含 HTML 转义防 XSS）
│   │   └── format.ts            # 格式化工具
│   ├── types/index.ts           # 类型定义
│   ├── App.vue
│   └── main.ts
└── vite.config.ts
```

## 📄 License

MIT
