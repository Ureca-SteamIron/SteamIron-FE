import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiBell, FiSearch } from 'react-icons/fi'
import Box from './Box'
import Logo from './Logo'
import SearchSuggestionsDropdown from './SearchSuggestionsDropdown'
import { getSession } from '../utils/auth'
import { SEARCH_MIN_KEYWORD_LENGTH, SEARCH_SUGGESTION_LIMIT } from '../constants/gameFilters'
import { searchGames } from '../../features/game/api/gameApi'

// 검색창/알림/마이페이지 버튼 높이를 통일한다.
const BAR_HEIGHT = 'h-11'

const SUGGEST_DEBOUNCE_MS = 300

// MainPage / SearchResultPage 공통 상단 바: 검색창(자동완성 드롭다운 포함) + 알림/마이페이지/로그인.
// initialKeyword를 넘기면 검색창에 미리 채워둔다(검색 결과 화면에서 재검색할 때 편하도록).
export default function SearchTopBar({ initialKeyword = '' }) {
  const navigate = useNavigate()
  const user = getSession()
  const containerRef = useRef(null)

  const [searchKeyword, setSearchKeyword] = useState(initialKeyword)
  const [searchError, setSearchError] = useState('')

  // 자동완성 드롭다운 상태
  const [showDropdown, setShowDropdown] = useState(false)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggestError, setSuggestError] = useState(false)
  const [suggestGames, setSuggestGames] = useState([])
  const [suggestSimilarGames, setSuggestSimilarGames] = useState([])

  const handleSearchSubmit = () => {
    const trimmed = searchKeyword.trim()
    if (trimmed.length < SEARCH_MIN_KEYWORD_LENGTH) {
      setSearchError(`검색어는 ${SEARCH_MIN_KEYWORD_LENGTH}자 이상 입력해주세요`)
      return
    }
    setSearchError('')
    setShowDropdown(false)
    navigate(`/search?keyword=${encodeURIComponent(trimmed)}`)
  }

  // 타이핑할 때마다(디바운스) 자동완성 후보를 가져온다. 2자 미만이면 아예 요청 안 함(최소 글자수 규칙 재사용).
  useEffect(() => {
    const trimmed = searchKeyword.trim()
    if (trimmed.length < SEARCH_MIN_KEYWORD_LENGTH) {
      setShowDropdown(false)
      return
    }

    let cancelled = false
    setSuggestLoading(true)
    setSuggestError(false)
    setShowDropdown(true)

    const timer = setTimeout(() => {
      searchGames(trimmed, 0, {}, SEARCH_SUGGESTION_LIMIT)
        .then((data) => {
          if (cancelled) return
          setSuggestGames(data.games)
          setSuggestSimilarGames(data.similarGames)
        })
        .catch(() => {
          if (!cancelled) {
            setSuggestError(true)
            setSuggestGames([])
            setSuggestSimilarGames([])
          }
        })
        .finally(() => {
          if (!cancelled) setSuggestLoading(false)
        })
    }, SUGGEST_DEBOUNCE_MS)

    // 새 키워드가 들어오면(다음 렌더 전) 이전 타이머를 취소하고, 늦게 도착하는 응답은 cancelled로 무시한다.
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [searchKeyword])

  // 검색창 바깥을 클릭하면 드롭다운을 닫는다.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <div className="flex gap-4 items-center">
        <Logo onClick={() => navigate('/')} className={`${BAR_HEIGHT} w-auto`} />

        <div ref={containerRef} className="relative flex-1 max-w-[600px] mx-auto">
          <Box
            noDefaultStyle
            className={`flex items-center ${BAR_HEIGHT} rounded-xl border bg-[var(--color-bg-surface)] px-4 transition-colors duration-150 ${
              searchError ? 'border-red-500' : 'border-[var(--color-border)] focus-within:border-[var(--color-border-strong)]'
            }`}
          >
            <FiSearch
              size={16}
              onClick={handleSearchSubmit}
              className="flex-shrink-0 mr-2 text-[var(--color-text-tertiary)] cursor-pointer"
            />
            <input
              type="text"
              placeholder="게임 이름으로 검색"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value)
                if (searchError) setSearchError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit()
                if (e.key === 'Escape') setShowDropdown(false)
              }}
              onFocus={() => {
                if (searchKeyword.trim().length >= SEARCH_MIN_KEYWORD_LENGTH) setShowDropdown(true)
              }}
              className="w-full bg-transparent border-none outline-none text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
            />
          </Box>

          {showDropdown && (
            <SearchSuggestionsDropdown
              keyword={searchKeyword.trim()}
              games={suggestGames}
              similarGames={suggestSimilarGames}
              loading={suggestLoading}
              error={suggestError}
              onSelectGame={(appId) => {
                setShowDropdown(false)
                navigate(`/games/${appId}`)
              }}
              onViewAll={handleSearchSubmit}
            />
          )}
        </div>

        <div className="flex gap-2.5">
          <Box
            noDefaultStyle
            onClick={() => navigate('/notifications')}
            aria-label="알림"
            className={`flex items-center justify-center ${BAR_HEIGHT} w-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] cursor-pointer transition-colors duration-150 hover:bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-border-hover)]`}
          >
            <FiBell size={18} />
          </Box>

          {user ? (
            <Box
              noDefaultStyle
              onClick={() => navigate('/me')}
              className={`flex items-center gap-2 ${BAR_HEIGHT} rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 text-sm text-[var(--color-text-primary)] cursor-pointer transition-colors duration-150 hover:bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-border-hover)]`}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full border-2 border-[var(--color-border-hover)] bg-[var(--color-bg-input)]" />
              )}
              <span>마이페이지</span>
            </Box>
          ) : (
            <Box
              noDefaultStyle
              onClick={() => navigate('/login')}
              className={`flex items-center ${BAR_HEIGHT} rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 text-sm text-[var(--color-text-primary)] cursor-pointer transition-colors duration-150 hover:bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-border-hover)]`}
            >
              login (discord)
            </Box>
          )}
        </div>
      </div>

      {searchError && (
        <div className="text-center text-red-400 text-[13px] mt-1.5">{searchError}</div>
      )}
    </>
  )
}