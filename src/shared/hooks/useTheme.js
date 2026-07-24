import { useEffect, useState } from 'react'

function readTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem('theme', theme)
}

export function toggleTheme() {
  setTheme(readTheme() === 'dark' ? 'light' : 'dark')
}

// html[data-theme]를 구독한다. 테마 토글 버튼은 트리 어디에나 있을 수 있어서(예: 로고),
// 로컬 state가 아니라 MutationObserver로 외부에서 바뀐 테마도 즉시 반영한다.
export function useTheme() {
  const [theme, setThemeState] = useState(readTheme)

  useEffect(() => {
    const observer = new MutationObserver(() => setThemeState(readTheme()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  return theme
}
