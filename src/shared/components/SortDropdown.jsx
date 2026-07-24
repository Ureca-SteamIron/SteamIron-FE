import Box from './Box'
import { SORT_OPTIONS } from '../constants/gameFilters'

export default function SortDropdown({ value, onChange, hidePopularLabel = false }) {
  return (
    <Box
      noDefaultStyle
      className="relative w-[250px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-2.5"
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-[var(--color-text-primary)] text-sm outline-none cursor-pointer appearance-none pr-6"
      >
        {SORT_OPTIONS.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]"
          >
            {opt.value === 'popular' && hidePopularLabel ? '기본순' : opt.label}
          </option>
        ))}
      </select>
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none text-xs">
        ▼
      </span>
    </Box>
  )
}