import { FiMoon, FiSun } from 'react-icons/fi'
import { toggleTheme, useTheme } from '../hooks/useTheme'

function ThemeToggleButton() {
  const theme = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-lg transition-colors duration-150 hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-surface-alt)] cursor-pointer"
    >
      {theme === 'dark' ? <FiMoon size={20} /> : <FiSun size={20} />}
    </button>
  )
}

export default ThemeToggleButton
