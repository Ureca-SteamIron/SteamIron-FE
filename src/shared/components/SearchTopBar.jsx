import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from './Box'
import SearchSuggestionsDropdown from './SearchSuggestionsDropdown'
import { getSession } from '../utils/auth'
import { SEARCH_MIN_KEYWORD_LENGTH, SEARCH_SUGGESTION_LIMIT } from '../constants/gameFilters'
import { searchGames } from '../../features/game/api/gameApi'

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
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div ref={containerRef} style={{ position: 'relative', flex: 1, maxWidth: '600px', margin: '0 auto' }}>
          <Box style={{ padding: '4px 10px' }}>
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
              style={{ width: '100%', border: 'none', outline: 'none' }}
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
        <div style={{ display: 'flex', gap: '10px' }}>
          <Box onClick={() => navigate('/notifications')}>알림</Box>
          {user ? (
            <Box onClick={() => navigate('/me')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                />
              ) : (
                <div style={{ width: '28px', height: '28px', border: '2px solid black', borderRadius: '50%' }} />
              )}
              <span>마이페이지</span>
            </Box>
          ) : (
            <Box onClick={() => navigate('/login')}>login (discord)</Box>
          )}
        </div>
      </div>

      {searchError && (
        <div style={{ textAlign: 'center', color: 'red', fontSize: '13px', marginTop: '6px' }}>
          {searchError}
        </div>
      )}
    </>
  )
}
