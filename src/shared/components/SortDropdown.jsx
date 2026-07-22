import Box from './Box'
import { SORT_OPTIONS } from '../constants/gameFilters'

export default function SortDropdown({ value, onChange }) {
  return (
    <Box style={{ width: '250px' }}>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%' }}>
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Box>
  )
}
