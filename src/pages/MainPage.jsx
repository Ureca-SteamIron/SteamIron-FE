import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Box from '../shared/components/Box'
import SearchTopBar from '../shared/components/SearchTopBar'
import SortDropdown from '../shared/components/SortDropdown'
import FilterPanel from '../shared/components/FilterPanel'
import WishlistHeartButton from '../shared/components/WishlistHeartButton'
import { getSession } from '../shared/utils/auth'
import { DEFAULT_FILTERS, normalizeFiltersForRequest } from '../shared/constants/gameFilters'
import { getHomeData } from '../features/game/api/homeApi'
import { getAllGames } from '../features/game/api/gameApi'
import { getMyWishlist } from '../features/wishlist/api/wishlistApi'
import { useWishlistToggle } from '../features/wishlist/useWishlistToggle'

const NAME_COLUMN_WIDTH = '180px'
const PAGE_SIZE = 20
const PAGE_GROUP_SIZE = 10

function getPageNumbers(currentPage, totalPages, groupSize = PAGE_GROUP_SIZE) {
  const currentGroup = Math.floor((currentPage - 1) / groupSize)
  const start = currentGroup * groupSize + 1
  const end = Math.min(start + groupSize - 1, totalPages)
  const pages = []
  for (let p = start; p <= end; p++) pages.push(p)
  return { pages, start, end }
}

export default function MainPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // ===== URL을 단일 소스로 사용 (파생값, useState 없음) =====
  const tab = searchParams.get('tab') || 'top100'
  const sort = searchParams.get('sort') || 'popular'
  const allGamesPage = Number(searchParams.get('page')) || 1

  // 탭 변경: page는 유지하지 않고 초기화할 필요 없음(탭별로 별도 페이지 개념)
  const setTab = (newTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', newTab)
      return next
    })
  }

  // 정렬 변경 시 page를 함께 1로 리셋 → 별도 useEffect 불필요
  const setSort = (newSort) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('sort', newSort)
      next.set('page', '1')
      return next
    })
  }

  // 페이지 변경: 항상 최신 URL 기준으로 계산 (클로저 문제 없음)
  const setAllGamesPage = (updater, options = {}) => {
    setSearchParams((prev) => {
      const currentPage = Number(prev.get('page')) || 1
      const nextPage = typeof updater === 'function' ? updater(currentPage) : updater
      const next = new URLSearchParams(prev)
      next.set('page', String(nextPage))
      return next
    }, options)
  }

  const user = getSession()

  // 필터: draft(임시) / applied(적용) 구분은 그대로 유지
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS)

  // 필터 적용 시 page도 함께 1로 리셋 (한 번의 setSearchParams로 처리)
  const handleApplyFilters = () => {
    const normalized = normalizeFiltersForRequest(draftFilters)
    setAppliedFilters(normalized)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', '1')
      return next
    })
  }

  // ===== top100 =====
  const [topGames, setTopGames] = useState([])
  const [topGamesLoading, setTopGamesLoading] = useState(true)
  const [topGamesError, setTopGamesError] = useState(null)

  useEffect(() => {
    if (tab !== 'top100') return
    let cancelled = false
    setTopGamesLoading(true)
    setTopGamesError(null)

    getHomeData({ ...appliedFilters, sort })
      .then((homeData) => {
        if (!cancelled) setTopGames(homeData.topGames ?? [])
      })
      .catch((err) => {
        if (!cancelled) setTopGamesError(err.message)
      })
      .finally(() => {
        if (!cancelled) setTopGamesLoading(false)
      })

    return () => { cancelled = true }
  }, [tab, sort, appliedFilters])

  const tabStyle = (name) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    fontWeight: tab === name ? 'bold' : 'normal',
    textDecoration: tab === name ? 'underline' : 'none',
  })

  // ===== 전체 게임 탭 =====
  const [allGames, setAllGames] = useState([])
  const [allGamesLoading, setAllGamesLoading] = useState(true)
  const [allGamesError, setAllGamesError] = useState(null)
  const [allGamesTotalPages, setAllGamesTotalPages] = useState(0)

  useEffect(() => {
    if (tab !== 'all') return
    let cancelled = false
    setAllGamesLoading(true)
    setAllGamesError(null)

    getAllGames({ ...appliedFilters, sort, page: allGamesPage, size: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return
        setAllGames(data.content ?? [])
        setAllGamesTotalPages(data.totalPages ?? 0)
      })
      .catch((err) => {
        if (!cancelled) setAllGamesError(err.message)
      })
      .finally(() => {
        if (!cancelled) setAllGamesLoading(false)
      })

    return () => { cancelled = true }
  }, [tab, sort, appliedFilters, allGamesPage])

  // ===== 찜 목록 =====
  const [wishlist, setWishlist] = useState([])
  const [wishlistLoading, setWishlistLoading] = useState(true)
  const [wishlistError, setWishlistError] = useState(null)
  const [wishlistIds, setWishlistIds] = useState(new Set())
  const { pendingIds, toggleWishlist } = useWishlistToggle(wishlistIds, setWishlistIds)

  const loadWishlist = () => {
    if (!user) return
    let cancelled = false
    setWishlistLoading(true)
    setWishlistError(null)

    getMyWishlist()
      .then((data) => {
        if (cancelled) return
        setWishlist(data)
        setWishlistIds(new Set(data.map((g) => g.appId)))
      })
      .catch((err) => {
        if (!cancelled) setWishlistError(err.message)
      })
      .finally(() => {
        if (!cancelled) setWishlistLoading(false)
      })

    return () => { cancelled = true }
  }

  useEffect(() => {
    if (!user) return
    const cancel = loadWishlist()
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (tab !== 'my') return
    if (!user) return
    const cancel = loadWishlist()
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

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
          <img src={game.headerImage} alt={game.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
        <WishlistHeartButton liked={liked} disabled={isPending} onClick={(e) => toggleWishlist(e, game)} />
      </Box>
    )
  }

  // 찜 목록 정렬, 필터링, 페이지네이션은 모두 프론트엔드에서 처리
  // 이름순 그룹 우선순위: 한글 → 영어 → 기타 (백엔드 GameNameSort와 동일한 규칙)
  function nameGroup(name) {
    const ch = name?.[0] ?? ''
    if (/[가-힣]/.test(ch)) return 0
    if (/[a-zA-Z]/.test(ch)) return 1
    return 2
  }

  function compareByName(a, b) {
    const groupDiff = nameGroup(a.name) - nameGroup(b.name)
    if (groupDiff !== 0) return groupDiff
    return a.name.localeCompare(b.name, 'ko')
  }

  function applyWishlistFilters(games, filters) {
    return games.filter((g) => {
      const finalPrice = g.finalPrice ?? 0
      const discountPercent = g.discountPercent ?? 0

      if (filters.priceType === 'free' && !g.isFree) return false
      if (filters.priceType === 'paid' && g.isFree) return false

      if (filters.minPrice !== undefined && filters.minPrice !== '' && finalPrice < Number(filters.minPrice)) return false
      if (filters.maxPrice !== undefined && filters.maxPrice !== '' && finalPrice > Number(filters.maxPrice)) return false

      if (filters.minDiscount && discountPercent < Number(filters.minDiscount)) return false
      if (filters.sale && discountPercent <= 0) return false

      // 장르 필터는 GameSimpleResponse에 genre 정보가 없어 현재 적용 불가
      return true
    })
  }

  function applyWishlistSort(games, sort) {
    const arr = [...games]
    switch (sort) {
      case 'price_asc':
        return arr.sort((a, b) => (a.finalPrice ?? 0) - (b.finalPrice ?? 0))
      case 'price_desc':
        return arr.sort((a, b) => (b.finalPrice ?? 0) - (a.finalPrice ?? 0))
      case 'discount_desc':
        return arr.sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0))
      case 'name_asc':
        return arr.sort(compareByName)
      case 'name_desc':
        return arr.sort((a, b) => -compareByName(a, b))
      default:
        return arr
    }
  }

  function applyWishlistFilters(games, filters) {
    return games.filter((g) => {
      const finalPrice = g.finalPrice ?? 0
      const discountPercent = g.discountPercent ?? 0

      if (filters.priceType === 'free' && !g.isFree) return false
      if (filters.priceType === 'paid' && g.isFree) return false

      if (filters.minPrice !== undefined && filters.minPrice !== '' && finalPrice < Number(filters.minPrice)) return false
      if (filters.maxPrice !== undefined && filters.maxPrice !== '' && finalPrice > Number(filters.maxPrice)) return false

      if (filters.minDiscount && discountPercent < Number(filters.minDiscount)) return false
      if (filters.sale && discountPercent <= 0) return false

      if (filters.genre && filters.genre !== 'all') {
        const genres = g.genres ?? []
        if (!genres.includes(filters.genre)) return false
      }

      return true
    })
  }

  const displayedWishlist = useMemo(() => {
    const filtered = applyWishlistFilters(wishlist, appliedFilters)
    return applyWishlistSort(filtered, sort)
  }, [wishlist, appliedFilters, sort])

  return (
    <div style={{ padding: '20px' }}>
      <SearchTopBar />

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
        <Box style={{ display: 'flex', padding: 0 }}>
          <div style={{ ...tabStyle('all'), borderRight: '2px solid black' }} onClick={() => setTab('all')}>
            전체 게임
          </div>
          <div style={{ ...tabStyle('top100'), borderRight: '2px solid black' }} onClick={() => setTab('top100')}>
            top100
          </div>
          <div style={tabStyle('my')} onClick={() => setTab('my')}>
            MY
          </div>
        </Box>
      </div>

      <div style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <SortDropdown value={sort} onChange={setSort} hidePopularLabel={tab !== 'top100'} />
          </div>

          {tab === 'top100' && (
            <>
              {topGamesLoading && <Box style={{ marginBottom: '10px' }}>불러오는 중...</Box>}
              {topGamesError && <Box style={{ marginBottom: '10px' }}>에러: {topGamesError}</Box>}
              {!topGamesLoading && !topGamesError && topGames.length === 0 && (
                <Box style={{ marginBottom: '10px' }}>표시할 게임이 없습니다</Box>
              )}
              {topGames.map(renderGameRow)}
            </>
          )}

          {tab === 'all' && (
            <>
              {allGamesLoading && <Box style={{ marginBottom: '10px' }}>불러오는 중...</Box>}
              {allGamesError && <Box style={{ marginBottom: '10px' }}>에러: {allGamesError}</Box>}
              {!allGamesLoading && !allGamesError && allGames.length === 0 && (
                <Box style={{ marginBottom: '10px' }}>표시할 게임이 없습니다</Box>
              )}
              {allGames.map(renderGameRow)}

              {!allGamesLoading && !allGamesError && allGamesTotalPages > 0 && (() => {
                const { pages, end } = getPageNumbers(allGamesPage, allGamesTotalPages)
                const isFirstPage = allGamesPage === 1
                const isLastPage = allGamesPage === allGamesTotalPages

                return (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
                    <Box
                      onClick={() => !isFirstPage && setAllGamesPage(1)}
                      style={{ cursor: isFirstPage ? 'default' : 'pointer', opacity: isFirstPage ? 0.4 : 1, padding: '6px 10px' }}
                    >
                      {'<<'}
                    </Box>
                    <Box
                      onClick={() => !isFirstPage && setAllGamesPage((p) => Math.max(1, p - 1))}
                      style={{ cursor: isFirstPage ? 'default' : 'pointer', opacity: isFirstPage ? 0.4 : 1, padding: '6px 10px' }}
                    >
                      {'<'}
                    </Box>

                    {pages.map((p) => (
                      <Box
                        key={p}
                        onClick={() => setAllGamesPage(p)}
                        style={{
                          cursor: 'pointer',
                          padding: '6px 10px',
                          fontWeight: p === allGamesPage ? 'bold' : 'normal',
                          textDecoration: p === allGamesPage ? 'underline' : 'none',
                        }}
                      >
                        {p}
                      </Box>
                    ))}

                    <Box
                      onClick={() => !isLastPage && setAllGamesPage((p) => Math.min(allGamesTotalPages, p + 1))}
                      style={{ cursor: isLastPage ? 'default' : 'pointer', opacity: isLastPage ? 0.4 : 1, padding: '6px 10px' }}
                    >
                      {'>'}
                    </Box>
                    <Box
                      onClick={() => !isLastPage && setAllGamesPage(Math.min(allGamesTotalPages, end + 1))}
                      style={{ cursor: isLastPage ? 'default' : 'pointer', opacity: isLastPage ? 0.4 : 1, padding: '6px 10px' }}
                    >
                      {'>>'}
                    </Box>
                  </div>
                )
              })()}
            </>
          )}

          {tab === 'my' && (
            <>
              {wishlistLoading && <Box style={{ marginBottom: '10px' }}>불러오는 중...</Box>}
              {wishlistError && <Box style={{ marginBottom: '10px' }}>에러: {wishlistError}</Box>}
              {!wishlistLoading && !wishlistError && displayedWishlist.length === 0 && (
                <Box style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  찜한 게임이 없습니다
                </Box>
              )}
              {displayedWishlist.map(renderGameRow)}
            </>
          )}
        </div>

        <FilterPanel draftFilters={draftFilters} setDraftFilters={setDraftFilters} onApply={handleApplyFilters} />
      </div>
    </div>
  )
}