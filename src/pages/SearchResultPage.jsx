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
      <div
        key={game.appId}
        onClick={() => navigate(`/games/${game.appId}`)}
        className="flex items-center gap-6 mb-2.5 p-3 rounded-xl border border-[#2c2c33] bg-[#1b1b1f] cursor-pointer transition-colors duration-150 hover:bg-[#22222a] hover:border-[#3a3a42]"
      >
        <div className="w-[120px] h-[64px] rounded-lg overflow-hidden flex-shrink-0 bg-black">
          <img
            src={game.headerImage}
            alt={game.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 flex items-center justify-center gap-2 text-sm">
          {game.discountPercent > 0 ? (
            <>
              <span className="line-through text-[#7a7a82]">
                {originalPrice.toLocaleString()}원
              </span>
              <span className="text-green-400 font-semibold">-{game.discountPercent}%</span>
              <span className="text-[#f2f2f4] font-semibold">{finalPrice.toLocaleString()}원</span>
            </>
          ) : game.isFree ? (
            <span className="text-green-400 font-semibold">무료</span>
          ) : (
            <span className="text-[#f2f2f4] font-semibold">{finalPrice.toLocaleString()}원</span>
          )}
        </div>

        <div
          className="text-right whitespace-nowrap overflow-hidden text-ellipsis text-[#f2f2f4] font-medium"
          style={{ width: NAME_COLUMN_WIDTH }}
          title={game.name}
        >
          {game.name}
        </div>

        <WishlistHeartButton
          liked={liked}
          disabled={isPending}
          onClick={(e) => toggleWishlist(e, game)}
        />
      </div>
    )
  }

  const stateBoxClass = 'mb-2.5 p-4 rounded-xl border border-[#2c2c33] bg-[#1b1b1f] text-center text-[#9a9aa2] text-sm'
  const emptyBoxClass = 'h-[200px] flex items-center justify-center rounded-xl border border-[#2c2c33] bg-[#1b1b1f] text-[#9a9aa2] text-sm'

  return (
    <div className="min-h-screen bg-[#0e0e10] text-[#e8e8ea]">
      <div className="max-w-[1400px] mx-auto p-5">
        <SearchTopBar key={keyword} initialKeyword={keyword} />

        <div
          onClick={() => navigate('/')}
          className="inline-block mt-5 text-sm text-[#9a9aa2] cursor-pointer transition-colors duration-150 hover:text-[#e8e8ea]"
        >
          ← 메인으로
        </div>

        <div className="mt-3 mb-3 text-sm text-[#9a9aa2]">
          '{keyword}' 검색 결과{!isKeywordTooShort && !loading && !error && ` (${totalElements}건)`}
        </div>

        <div className="flex gap-8">
          <div className="flex-1">
            <div className="flex justify-end mb-3">
              <SortDropdown value={sort} onChange={handleSortChange} />
            </div>

            {isKeywordTooShort && (
              <div className={emptyBoxClass}>
                검색어는 {SEARCH_MIN_KEYWORD_LENGTH}자 이상 입력해주세요
              </div>
            )}
            {!isKeywordTooShort && loading && <div className={stateBoxClass}>불러오는 중...</div>}
            {!isKeywordTooShort && error && (
              <div className={`${stateBoxClass} text-red-400`}>에러: {error}</div>
            )}
            {!isKeywordTooShort && !loading && !error && games.length === 0 && (
              <div className={emptyBoxClass}>검색 결과가 없습니다</div>
            )}

            {!isKeywordTooShort && games.map(renderGameRow)}

            {!isKeywordTooShort && !loading && !error && similarGames.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 font-bold text-sm text-[#f2f2f4]">유사한 게임</div>
                {similarGames.map(renderGameRow)}
              </div>
            )}

            {!isKeywordTooShort && !loading && !error && totalPages > 1 && (
              <div className="flex justify-center items-center gap-1.5 mt-6">
                <div
                  onClick={() => page > 0 && goToPage(page - 1)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors duration-150 ${page > 0
                    ? 'cursor-pointer text-[#e8e8ea] hover:bg-[#2a2a31]'
                    : 'cursor-default opacity-30 text-[#9a9aa2]'
                    }`}
                >
                  이전
                </div>

                {buildPageNumbers(page, totalPages).map((p, idx) =>
                  p === '...' ? (
                    <span key={`dots-${idx}`} className="px-1 text-[#9a9aa2] text-sm">
                      ...
                    </span>
                  ) : (
                    <div
                      key={p}
                      onClick={() => p !== page && goToPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors duration-150 ${p === page
                        ? 'font-bold text-white bg-[#2a2a31] cursor-default'
                        : 'font-normal text-[#9a9aa2] cursor-pointer hover:bg-[#2a2a31] hover:text-[#e8e8ea]'
                        }`}
                    >
                      {p + 1}
                    </div>
                  )
                )}

                <div
                  onClick={() => hasNext && goToPage(page + 1)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors duration-150 ${hasNext
                    ? 'cursor-pointer text-[#e8e8ea] hover:bg-[#2a2a31]'
                    : 'cursor-default opacity-30 text-[#9a9aa2]'
                    }`}
                >
                  다음
                </div>
              </div>
            )}
          </div>

          <FilterPanel draftFilters={draftFilters} setDraftFilters={setDraftFilters} onApply={handleApplyFilters} />
        </div>
      </div>
    </div>
  )
}