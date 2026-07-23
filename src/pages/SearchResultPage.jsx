import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Box from '../shared/components/Box'
import SearchTopBar from '../shared/components/SearchTopBar'
import SortDropdown from '../shared/components/SortDropdown'
import FilterPanel from '../shared/components/FilterPanel'
import WishlistHeartButton from '../shared/components/WishlistHeartButton'
import { getSession } from '../shared/utils/auth'
import { DEFAULT_FILTERS, SEARCH_MIN_KEYWORD_LENGTH, normalizeFiltersForRequest } from '../shared/constants/gameFilters'
import { searchGames } from '../features/game/api/gameApi'
import { getMyWishlist } from '../features/wishlist/api/wishlistApi'
import { useWishlistToggle } from '../features/wishlist/useWishlistToggle'

const NAME_COLUMN_WIDTH = '180px'

// 페이지 번호 버튼 목록을 만든다. 전부 다 보여주면 페이지가 많을 때(예: 77페이지) 끝없이 늘어지니,
// 현재 페이지 주변 몇 개 + 처음/끝만 보여주고 나머지는 '...'으로 생략한다.
// current/total은 0-베이스(page 상태와 동일).
function buildPageNumbers(current, total) {
  const delta = 2
  const pages = []
  for (let i = 0; i < total; i++) {
    if (i === 0 || i === total - 1 || (i >= current - delta && i <= current + delta)) {
      pages.push(i)
    }
  }

  const withDots = []
  let prev
  for (const p of pages) {
    if (prev !== undefined && p - prev > 1) {
      withDots.push('...')
    }
    withDots.push(p)
    prev = p
  }
  return withDots
}

// 검색 결과: MainPage와 동일한 상단바(검색/알림/마이페이지/로그인) + 정렬/필터를 그대로 재사용.
// top100처럼 랭킹으로 범위를 좁히지 않고 전체 게임에서 keyword로 검색한 결과를 보여준다.
export default function SearchResultPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get('keyword') ?? ''
  const page = Number(searchParams.get('page') ?? '0')
  const isKeywordTooShort = keyword.length > 0 && keyword.length < SEARCH_MIN_KEYWORD_LENGTH

  const user = getSession()

  // 찜 여부 판단용 id Set. MainPage와 동일한 패턴 — 로그인 시에만 로드.
  const [wishlistIds, setWishlistIds] = useState(new Set())
  const { pendingIds, toggleWishlist } = useWishlistToggle(wishlistIds, setWishlistIds)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getMyWishlist()
      .then((data) => {
        if (!cancelled) setWishlistIds(new Set(data.map((g) => g.appId)))
      })
      .catch(() => { })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 정렬은 선택 즉시 적용, 필터는 "적용" 버튼으로 반영 — MainPage와 동일한 패턴.
  // 둘 다 바뀌면 현재 페이지가 더 이상 유효하지 않을 수 있으니 1페이지로 되돌린다.
  const [sort, setSort] = useState('popular')
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS)

  const handleSortChange = (nextSort) => {
    setSort(nextSort)
    setSearchParams({ keyword, page: '0' })
  }

  const handleApplyFilters = () => {
    setAppliedFilters(normalizeFiltersForRequest(draftFilters))
    setSearchParams({ keyword, page: '0' })
  }

  const [games, setGames] = useState([])
  const [similarGames, setSimilarGames] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const goToPage = (nextPage) => {
    setSearchParams({ keyword, page: String(nextPage) })
  }

  useEffect(() => {
    if (keyword.length < SEARCH_MIN_KEYWORD_LENGTH) {
      setGames([])
      setSimilarGames([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    searchGames(keyword, page, { ...appliedFilters, sort })
      .then((data) => {
        if (cancelled) return
        setGames(data.games)
        setSimilarGames(data.similarGames)
        setTotalElements(data.totalElements)
        setTotalPages(data.totalPages)
        setHasNext(data.hasNext)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [keyword, page, sort, appliedFilters])

  const renderGameRow = (game) => {
    const liked = wishlistIds.has(game.appId)
    const isPending = pendingIds.has(game.appId)
    const originalPrice = game.originalPrice ?? 0
    const finalPrice = game.finalPrice ?? 0

    return (
      <Box
        key={game.appId}
        onClick={() => navigate(`/games/${game.appId}`)}
        style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '10px' }}
      >
        <Box style={{ width: '120px', height: '50px', padding: 0, overflow: 'hidden' }}>
          <img
            src={game.headerImage}
            alt={game.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>
        <div style={{ flex: 1, textAlign: 'center' }}>
          {game.discountPercent > 0 ? (
            <>
              <span style={{ textDecoration: 'line-through', marginRight: '8px' }}>
                {originalPrice.toLocaleString()}원
              </span>
              <span>-{game.discountPercent}%</span>{' '}
              <span>{finalPrice.toLocaleString()}원</span>
            </>
          ) : game.isFree ? (
            <span>무료</span>
          ) : (
            <span>{finalPrice.toLocaleString()}원</span>
          )}
        </div>
        <div
          style={{
            width: NAME_COLUMN_WIDTH,
            textAlign: 'right',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={game.name}
        >
          {game.name}
        </div>
        <WishlistHeartButton
          liked={liked}
          disabled={isPending}
          onClick={(e) => toggleWishlist(e, game)}
        />
      </Box>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* keyword가 바뀌면(다른 검색 결과로 이동/뒤로가기) 검색창 내부 상태를 새로 초기화 */}
      <SearchTopBar key={keyword} initialKeyword={keyword} />

      <Box onClick={() => navigate('/')} style={{ display: 'inline-block', marginTop: '20px' }}>← 메인으로</Box>

      <div style={{ marginTop: '10px', marginBottom: '10px' }}>
        '{keyword}' 검색 결과{!isKeywordTooShort && !loading && !error && ` (${totalElements}건)`}
      </div>

      <div style={{ display: 'flex', gap: '30px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <SortDropdown value={sort} onChange={handleSortChange} />
          </div>

          {isKeywordTooShort && (
            <Box style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              검색어는 {SEARCH_MIN_KEYWORD_LENGTH}자 이상 입력해주세요
            </Box>
          )}
          {!isKeywordTooShort && loading && <Box style={{ marginBottom: '10px' }}>불러오는 중...</Box>}
          {!isKeywordTooShort && error && <Box style={{ marginBottom: '10px' }}>에러: {error}</Box>}
          {!isKeywordTooShort && !loading && !error && games.length === 0 && (
            <Box style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              검색 결과가 없습니다
            </Box>
          )}

          {!isKeywordTooShort && games.map(renderGameRow)}

          {!isKeywordTooShort && !loading && !error && similarGames.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>유사한 게임</div>
              {similarGames.map(renderGameRow)}
            </div>
          )}

          {!isKeywordTooShort && !loading && !error && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
              <Box
                onClick={() => page > 0 && goToPage(page - 1)}
                style={{ cursor: page > 0 ? 'pointer' : 'default', opacity: page > 0 ? 1 : 0.4 }}
              >
                이전
              </Box>

              {buildPageNumbers(page, totalPages).map((p, idx) =>
                p === '...' ? (
                  <span key={`dots-${idx}`} style={{ padding: '0 4px' }}>...</span>
                ) : (
                  <Box
                    key={p}
                    onClick={() => p !== page && goToPage(p)}
                    style={{
                      padding: '10px 14px',
                      cursor: p === page ? 'default' : 'pointer',
                      fontWeight: p === page ? 'bold' : 'normal',
                      textDecoration: p === page ? 'underline' : 'none',
                    }}
                  >
                    {p + 1}
                  </Box>
                )
              )}

              <Box
                onClick={() => hasNext && goToPage(page + 1)}
                style={{ cursor: hasNext ? 'pointer' : 'default', opacity: hasNext ? 1 : 0.4 }}
              >
                다음
              </Box>
            </div>
          )}
        </div>

        <FilterPanel draftFilters={draftFilters} setDraftFilters={setDraftFilters} onApply={handleApplyFilters} />
      </div>
    </div>
  )
}
