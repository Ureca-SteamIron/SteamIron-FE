import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Box from '../shared/components/Box'
import SearchTopBar from '../shared/components/SearchTopBar'
import SortDropdown from '../shared/components/SortDropdown'
import FilterPanel from '../shared/components/FilterPanel'
import WishlistHeartButton from '../shared/components/WishlistHeartButton'
import { getSession } from '../shared/utils/auth'
import {
  appliedFiltersToDraft,
  filtersFromSearchParams,
  normalizeFiltersForRequest,
  writeFiltersToSearchParams,
} from '../shared/constants/gameFilters'
import { getHomeData } from '../features/game/api/homeApi'
import { getAllGames } from '../features/game/api/gameApi'
import { getMyWishlist } from '../features/wishlist/api/wishlistApi'
import { useWishlistToggle } from '../features/wishlist/useWishlistToggle'

const PRICE_COLUMN_WIDTH = '210px'
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

  const setTab = (newTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', newTab)
      return next
    })
  }

  const setSort = (newSort) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('sort', newSort)
      next.set('page', '1')
      return next
    })
  }

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

  // 필터도 tab/sort/page처럼 URL을 단일 소스로 사용한다.
  // (게임 상세에서 뒤로가기로 돌아오거나 브라우저 자체 뒤로가기를 눌렀을 때도 그대로 복원되어야 하므로)
  const appliedFilters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams])
  const filterParamsKey = [
    searchParams.get('genre'),
    searchParams.get('priceType'),
    searchParams.get('minPrice'),
    searchParams.get('maxPrice'),
    searchParams.get('minDiscount'),
    searchParams.get('sale'),
  ].join('|')

  const [draftFilters, setDraftFilters] = useState(() => appliedFiltersToDraft(appliedFilters))

  // URL의 필터 파라미터가 (뒤로가기 등으로) 외부에서 바뀌면 패널 입력값도 그 값으로 맞춘다.
  useEffect(() => {
    setDraftFilters(appliedFiltersToDraft(filtersFromSearchParams(searchParams)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterParamsKey])

  const handleApplyFilters = () => {
    const normalized = normalizeFiltersForRequest(draftFilters)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      writeFiltersToSearchParams(next, normalized)
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
        noDefaultStyle
        onClick={() => navigate(`/games/${game.appId}`)}
        className="flex items-center gap-6 mb-2.5 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] cursor-pointer transition-colors duration-150 hover:bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-border-hover)]"
      >
        <div className="w-[120px] h-[64px] rounded-lg overflow-hidden flex-shrink-0 bg-black">
          <img src={game.headerImage} alt={game.name} className="w-full h-full object-cover" />
        </div>

        <div
          className="flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-[var(--color-text-heading)] font-medium"
          title={game.name}
        >
          {game.name}
        </div>

        <div
          className="flex items-center justify-end gap-2 text-sm flex-shrink-0"
          style={{ width: PRICE_COLUMN_WIDTH }}
        >
          {game.discountPercent > 0 ? (
            <>
              <span className="line-through text-[var(--color-text-tertiary)]">
                {originalPrice.toLocaleString()}원
              </span>
              <span className="text-green-400 font-semibold">-{game.discountPercent}%</span>
              <span className="text-[var(--color-text-heading)] font-semibold">{finalPrice.toLocaleString()}원</span>
            </>
          ) : game.isFree ? (
            <span className="text-green-400 font-semibold">무료</span>
          ) : (
            <span className="text-[var(--color-text-heading)] font-semibold">{finalPrice.toLocaleString()}원</span>
          )}
        </div>

        <WishlistHeartButton liked={liked} disabled={isPending} onClick={(e) => toggleWishlist(e, game)} />
      </Box>
    )
  }

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

      if (filters.genre && filters.genre !== 'all') {
        const genres = g.genres ?? []
        if (!genres.includes(filters.genre)) return false
      }

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

  const displayedWishlist = useMemo(() => {
    const filtered = applyWishlistFilters(wishlist, appliedFilters)
    return applyWishlistSort(filtered, sort)
  }, [wishlist, appliedFilters, sort])

  const tabClass = (name) =>
    `px-6 py-2.5 cursor-pointer text-sm transition-colors duration-150 ${tab === name
      ? 'font-bold text-[var(--color-text-heading)] border-b-2 border-green-400'
      : 'font-normal text-[var(--color-text-secondary)] border-b-2 border-transparent hover:text-[var(--color-text-primary)]'
    }`

  const pageButtonClass = (disabled) =>
    `px-3 py-1.5 rounded-lg text-sm transition-colors duration-150 ${disabled
      ? 'cursor-default opacity-30 text-[var(--color-text-secondary)]'
      : 'cursor-pointer text-[var(--color-text-primary)] hover:bg-[var(--color-bg-row-hover)]'
    }`

  const stateBoxClass = 'mb-2.5 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-center text-[var(--color-text-secondary)] text-sm'

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
      <div className="max-w-[1400px] mx-auto p-5">
        <SearchTopBar />

        <div className="flex justify-center mt-8">
          <div className="flex gap-1 border-b border-[var(--color-border)]">
            <div className={tabClass('all')} onClick={() => setTab('all')}>
              전체 게임
            </div>
            <div className={tabClass('top100')} onClick={() => setTab('top100')}>
              top100
            </div>
            <div className={tabClass('my')} onClick={() => setTab('my')}>
              MY
            </div>
          </div>
        </div>

        <div className="flex gap-8 mt-6">
          <div className="flex-1 min-w-0">
            <div className="flex justify-end mb-3">
              <SortDropdown value={sort} onChange={setSort} hidePopularLabel={tab !== 'top100'} />
            </div>

            {tab === 'top100' && (
              <>
                {topGamesLoading && <div className={stateBoxClass}>불러오는 중...</div>}
                {topGamesError && <div className={`${stateBoxClass} text-red-400`}>에러: {topGamesError}</div>}
                {!topGamesLoading && !topGamesError && topGames.length === 0 && (
                  <div className={stateBoxClass}>표시할 게임이 없습니다</div>
                )}
                {topGames.map(renderGameRow)}
              </>
            )}

            {tab === 'all' && (
              <>
                {allGamesLoading && <div className={stateBoxClass}>불러오는 중...</div>}
                {allGamesError && <div className={`${stateBoxClass} text-red-400`}>에러: {allGamesError}</div>}
                {!allGamesLoading && !allGamesError && allGames.length === 0 && (
                  <div className={stateBoxClass}>표시할 게임이 없습니다</div>
                )}
                {allGames.map(renderGameRow)}

                {!allGamesLoading && !allGamesError && allGamesTotalPages > 0 && (() => {
                  const { pages, end } = getPageNumbers(allGamesPage, allGamesTotalPages)
                  const isFirstPage = allGamesPage === 1
                  const isLastPage = allGamesPage === allGamesTotalPages

                  return (
                    <div className="flex justify-center gap-1.5 mt-6">
                      <div
                        onClick={() => !isFirstPage && setAllGamesPage(1)}
                        className={pageButtonClass(isFirstPage)}
                      >
                        {'<<'}
                      </div>
                      <div
                        onClick={() => !isFirstPage && setAllGamesPage((p) => Math.max(1, p - 1))}
                        className={pageButtonClass(isFirstPage)}
                      >
                        {'<'}
                      </div>

                      {pages.map((p) => (
                        <div
                          key={p}
                          onClick={() => setAllGamesPage(p)}
                          className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors duration-150 ${p === allGamesPage
                            ? 'font-bold text-[var(--color-text-heading)] bg-[var(--color-bg-row-hover)]'
                            : 'font-normal text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-row-hover)] hover:text-[var(--color-text-primary)]'
                            }`}
                        >
                          {p}
                        </div>
                      ))}

                      <div
                        onClick={() => !isLastPage && setAllGamesPage((p) => Math.min(allGamesTotalPages, p + 1))}
                        className={pageButtonClass(isLastPage)}
                      >
                        {'>'}
                      </div>
                      <div
                        onClick={() => !isLastPage && setAllGamesPage(Math.min(allGamesTotalPages, end + 1))}
                        className={pageButtonClass(isLastPage)}
                      >
                        {'>>'}
                      </div>
                    </div>
                  )
                })()}
              </>
            )}

            {tab === 'my' && (
              <>
                {wishlistLoading && <div className={stateBoxClass}>불러오는 중...</div>}
                {wishlistError && <div className={`${stateBoxClass} text-red-400`}>에러: {wishlistError}</div>}
                {!wishlistLoading && !wishlistError && displayedWishlist.length === 0 && (
                  <div className="h-[300px] flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] text-sm">
                    찜한 게임이 없습니다
                  </div>
                )}
                {displayedWishlist.map(renderGameRow)}
              </>
            )}
          </div>

          <FilterPanel draftFilters={draftFilters} setDraftFilters={setDraftFilters} onApply={handleApplyFilters} />
        </div>
      </div>
    </div>
  )
}