import Box from './Box'
import { GENRE_OPTIONS } from '../constants/gameFilters'

// draftFilters: 입력 중인 값(모아뒀다가 onApply로 한번에 반영). setDraftFilters로 값 갱신.
export default function FilterPanel({ draftFilters, setDraftFilters, onApply }) {
  return (
    <Box style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>장르</div>
        <select
          value={draftFilters.genre}
          onChange={(e) => setDraftFilters((prev) => ({ ...prev, genre: e.target.value }))}
          style={{ width: '100%' }}
        >
          {GENRE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>가격</div>
        {['all', 'free', 'paid'].map((value) => (
          <label key={value} style={{ display: 'block', cursor: 'pointer' }}>
            <input
              type="radio"
              name="priceType"
              value={value}
              checked={draftFilters.priceType === value}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, priceType: e.target.value }))}
            />
            {' '}
            {value === 'all' ? '전체' : value === 'free' ? '무료' : '유료'}
          </label>
        ))}
      </div>

      <div>
        <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>가격 범위</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="number"
            min="0"
            placeholder="최소"
            value={draftFilters.minPrice}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
            style={{ width: '70px' }}
          />
          <span>~</span>
          <input
            type="number"
            min="0"
            placeholder="최대"
            value={draftFilters.maxPrice}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
            style={{ width: '70px' }}
          />
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>최소 할인율(%)</div>
        <input
          type="number"
          min="0"
          max="100"
          value={draftFilters.minDiscount}
          onChange={(e) => setDraftFilters((prev) => ({ ...prev, minDiscount: e.target.value }))}
          style={{ width: '100%' }}
        />
      </div>

      <label style={{ display: 'block', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={draftFilters.sale}
          onChange={(e) => setDraftFilters((prev) => ({ ...prev, sale: e.target.checked }))}
        />
        {' '}
        할인중인 게임만
      </label>

      <Box onClick={onApply} style={{ textAlign: 'center', cursor: 'pointer' }}>
        적용
      </Box>
    </Box>
  )
}
