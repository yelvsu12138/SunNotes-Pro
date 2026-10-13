/**
 * SunNotes 轻量级 Markdown 解析器（零依赖）
 *
 * 设计要点：
 * 1. 先提取 ``` 围栏代码块与 ` 行内代码，用占位符替换，避免其内部被二次解析；
 * 2. 对剩余文本整体进行 HTML 转义，从根源上杜绝 XSS；
 * 3. 再做块级（标题/引用/列表/分割线/段落）与行内（粗体/斜体/删除线/链接）解析；
 * 4. 最后还原占位符。
 *
 * 解析过程为少量线性正则替换，常规笔记（<10KB）解析耗时远低于 1ms。
 */

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

/** 转义所有可能注入 HTML 的字符 */
function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch] ?? ch)
}

/** 围栏代码块：```lang\n code ```（支持未闭合的情况） */
const FENCE_RE = /```([^\n`]*)\r?\n?([\s\S]*?)(?:```|$)/g

interface StashedNode {
  token: string
  html: string
}

/**
 * 将 Markdown 渲染为安全的 HTML 字符串。
 * 输出内容已全部经过转义，可直接用于 v-html。
 */
export function renderMarkdown(source: string): string {
  if (!source) return ''

  const stashed: StashedNode[] = []
  const stash = (html: string): string => {
    // 使用不会出现在正常文本中的控制字符作为占位符
    const token = `\u0001${stashed.length}\u0002`
    stashed.push({ token, html })
    return token
  }

  // 1. 提取围栏代码块（内部内容原样转义，不做任何解析）
  let text = source.replace(FENCE_RE, (_match, rawLang: string, rawCode: string) => {
    const lang = rawLang.trim()
    const langAttr = lang ? ` language-${escapeHtml(lang)}` : ''
    const code = escapeHtml(rawCode.replace(/\n$/, ''))
    return `\n\n${stash(`<pre class="md-pre"><code${langAttr}>${code}</code></pre>`)}\n\n`
  })

  // 2. 对剩余文本做 HTML 转义 —— XSS 防护的核心
  text = escapeHtml(text)

  // 3. 提取行内代码（此时内容已转义）
  text = text.replace(/`([^`\n]+)`/g, (_match, code: string) =>
    stash(`<code class="md-code">${code}</code>`)
  )

  // 4. 行内语法
  const renderInline = (input: string): string => {
    let out = input
    // 链接 [text](url)：仅允许安全协议，阻止 javascript: 等危险 URL
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label: string, url: string) => {
      const decoded = url.replace(/&amp;/g, '&')
      if (/^(https?:\/\/|mailto:|#|\/)/i.test(decoded)) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
      }
      return match
    })
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>')
    out = out.replace(/(^|[\s([])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    return out
  }

  // 5. 块级语法：按行扫描
  const lines = text.split(/\r?\n/)
  const blocks: string[] = []

  let paragraph: string[] = []
  const flushParagraph = (): void => {
    if (paragraph.length) {
      blocks.push(`<p>${renderInline(paragraph.join('<br>'))}</p>`)
      paragraph = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // 代码块占位符：独占一行，直接输出
    if (trimmed.charCodeAt(0) === 1 && trimmed.charCodeAt(trimmed.length - 1) === 2) {
      flushParagraph()
      blocks.push(trimmed)
      continue
    }

    // 空行
    if (!trimmed) {
      flushParagraph()
      continue
    }

    // 标题 #{1,6}
    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed)
    if (heading) {
      flushParagraph()
      const level = heading[1].length
      blocks.push(`<h${level}>${renderInline(heading[2])}</h${level}>`)
      continue
    }

    // 分割线
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph()
      blocks.push('<hr>')
      continue
    }

    // 引用块（连续的 > 行合并）
    if (/^&gt;\s?/.test(trimmed)) {
      flushParagraph()
      const quoteLines: string[] = []
      while (i < lines.length && /^&gt;\s?/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^&gt;\s?/, ''))
        i++
      }
      i--
      blocks.push(`<blockquote>${renderInline(quoteLines.join('<br>'))}</blockquote>`)
      continue
    }

    // 无序列表
    if (/^[-*+]\s+/.test(trimmed)) {
      flushParagraph()
      const items: string[] = []
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        items.push(`<li>${renderInline(lines[i].trim().replace(/^[-*+]\s+/, ''))}</li>`)
        i++
      }
      i--
      blocks.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    // 有序列表
    if (/^\d+[.)]\s+/.test(trimmed)) {
      flushParagraph()
      const items: string[] = []
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(`<li>${renderInline(lines[i].trim().replace(/^\d+[.)]\s+/, ''))}</li>`)
        i++
      }
      i--
      blocks.push(`<ol>${items.join('')}</ol>`)
      continue
    }

    // 普通文本归入段落
    paragraph.push(trimmed)
  }
  flushParagraph()

  // 6. 还原被暂存的代码块 / 行内代码
  let html = blocks.join('\n')
  for (const node of stashed) {
    html = html.split(node.token).join(node.html)
  }
  return html
}
