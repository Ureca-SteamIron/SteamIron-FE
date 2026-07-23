import Box from './Box'
import { GENRE_OPTIONS } from '../constants/gameFilters'

// draftFilters: 입력 중인 값(모아뒀다가 onApply로 한번에 반영). setDraftFilters로 값 갱신.
export default function FilterPanel({ draftFilters, setDraftFilters, onApply }) {
  return (
    <Box
      noDefaultStyle
      className="w-[220px] flex flex-col gap-5 p-5 rounded-xl border border-[#2c2c33] bg-[#1b1b1f] h-fit"
    >
      <div>
        <div className="font-bold text-sm text-[#f2f2f4] mb-2">장르</div>
        <div className="relative">
          <select
            value={draftFilters.genre}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, genre: e.target.value }))}
            className="w-full bg-[#26262c] text-[#e8e8ea] text-sm rounded-lg border border-[#2c2c33] px-3 py-2 outline-none cursor-pointer appearance-none pr-8"
          >
            {GENRE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#1b1b1f] text-[#e8e8ea]">
                {opt.label}
              </option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9aa2] pointer-events-none text-xs">
            ▼
          </span>
        </div>
      </div>

      <div>
        <div className="font-bold text-sm text-[#f2f2f4] mb-2">가격</div>
        <div className="flex flex-col gap-1.5">
          {['all', 'free', 'paid'].map((value) => (
            <label
              key={value}
              className="flex items-center gap-2 cursor-pointer text-sm text-[#e8e8ea]"
            >
              <input
                type="radio"
                name="priceType"
                value={value}
                checked={draftFilters.priceType === value}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, priceType: e.target.value }))}
                className="accent-green-400 w-4 h-4 cursor-pointer"
              />
              {value === 'all' ? '전체' : value === 'free' ? '무료' : '유료'}
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="font-bold text-sm text-[#f2f2f4] mb-2">가격 범위</div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="최소"
            value={draftFilters.minPrice}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
            className="w-[70px] bg-[#26262c] text-[#e8e8ea] text-sm rounded-lg border border-[#2c2c33] px-2.5 py-1.5 outline-none placeholder:text-[#7a7a82] focus:border-[#4a4a52]"
          />
          <span className="text-[#9a9aa2] text-sm">~</span>
          <input
            type="number"
            min="0"
            placeholder="최대"
            value={draftFilters.maxPrice}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
            className="w-[70px] bg-[#26262c] text-[#e8e8ea] text-sm rounded-lg border border-[#2c2c33] px-2.5 py-1.5 outline-none placeholder:text-[#7a7a82] focus:border-[#4a4a52]"
          />
        </div>
      </div>

      <div>
        <div className="font-bold text-sm text-[#f2f2f4] mb-2">최소 할인율(%)</div>
        <input
          type="number"
          min="0"
          max="100"
          value={draftFilters.minDiscount}
          onChange={(e) => setDraftFilters((prev) => ({ ...prev, minDiscount: e.target.value }))}
          className="w-full bg-[#26262c] text-[#e8e8ea] text-sm rounded-lg border border-[#2c2c33] px-3 py-2 outline-none focus:border-[#4a4a52]"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-sm text-[#e8e8ea]">
        <input
          type="checkbox"
          checked={draftFilters.sale}
          onChange={(e) => setDraftFilters((prev) => ({ ...prev, sale: e.target.checked }))}
          className="accent-green-400 w-4 h-4 cursor-pointer"
        />
        할인중인 게임만
      </label>

      <Box
        noDefaultStyle
        onClick={onApply}
        className="text-center cursor-pointer font-semibold text-sm text-[#0e0e10] bg-green-400 rounded-lg py-2.5 transition-colors duration-150 hover:bg-green-300"
      >
        적용
      </Box>
    </Box>
  )
}