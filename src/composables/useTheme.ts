/**
 * useTheme —— 深色 / 浅色主题切换
 * 基于 CSS Variables（见 styles/main.css），持久化到 localStorage。
 */
import { ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark'

const THEME_KEY = 'sunnotes:theme'

function getInitialTheme(): ThemeMode {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const theme = ref<ThemeMode>(getInitialTheme())

  watch(
    theme,
    (mode) => {
      document.documentElement.dataset.theme = mode
      localStorage.setItem(THEME_KEY, mode)
    },
    { immediate: true }
  )

  function toggleTheme(): void {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return { theme, toggleTheme }
}
