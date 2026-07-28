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

  // 자동완성은 (state가 아니라) 실제 입력 이벤트에서만 트리거한다. initialKeyword로 마운트되는
  // 첫 렌더(검색 결과 화면 진입 직후 등)에도 useEffect(deps:[searchKeyword])는 항상 한 번 실행되기
  // 때문에, "마운트인지 타이핑인지"를 이펙트 안에서 구분하려 하면 StrictMode의 이펙트 2회 실행 때문에
  // 그 구분 플래그가 깨진다. 아예 이펙트를 쓰지 않고 onChange에서만 디바운스+요청을 걸면
  // 진짜 사용자 입력에만 반응하게 되어 이 문제 자체가 생기지 않는다.
  const debounceTimerRef = useRef(null)
  const requestTokenRef = useRef(0)

  useEffect(() => () => clearTimeout(debounceTimerRef.current), [])

  // 타이핑(onChange)뿐 아니라 다시 포커스했을 때도 이걸로 불러온다. searchKeyword가 initialKeyword로
  // 채워진 채 마운트된 경우 onChange가 한 번도 안 일어나서 suggestGames가 비어있는 채로 남는데,
  // 그 상태에서 입력창을 다시 클릭하면(onFocus) 빈 결과를 그대로 보여줘 "검색 결과가 없다"고
  // 잘못 뜨는 문제가 있었다 — 그래서 포커스 시에도 항상 새로 조회한다.
  const triggerSuggestFetch = (value) => {
    clearTimeout(debounceTimerRef.current)

    const trimmed = value.trim()
    if (trimmed.length < SEARCH_MIN_KEYWORD_LENGTH) {
      setShowDropdown(false)
      return
    }

    setSuggestLoading(true)
    setSuggestError(false)
    setShowDropdown(true)

    // 늦게 도착하는 응답이 그 사이 타이핑한 최신 검색어 결과를 덮어쓰지 않도록 토큰으로 구분한다.
    const myToken = ++requestTokenRef.current
    debounceTimerRef.current = setTimeout(() => {
      searchGames(trimmed, 0, {}, SEARCH_SUGGESTION_LIMIT)
        .then((data) => {
          if (requestTokenRef.current !== myToken) return
          setSuggestGames(data.games)
          setSuggestSimilarGames(data.similarGames)
        })
        .catch(() => {
          if (requestTokenRef.current !== myToken) return
          setSuggestError(true)
          setSuggestGames([])
          setSuggestSimilarGames([])
        })
        .finally(() => {
          if (requestTokenRef.current === myToken) setSuggestLoading(false)
        })
    }, SUGGEST_DEBOUNCE_MS)
  }

  const handleKeywordChange = (value) => {
    setSearchKeyword(value)
    if (searchError) setSearchError('')
    triggerSuggestFetch(value)
  }

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
              onChange={(e) => handleKeywordChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit()
                if (e.key === 'Escape') setShowDropdown(false)
              }}
              onFocus={() => triggerSuggestFetch(searchKeyword)}
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