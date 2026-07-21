
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '../shared/components/Box'
import SearchTopBar from '../shared/components/SearchTopBar'
import SortDropdown from '../shared/components/SortDropdown'
import FilterPanel from '../shared/components/FilterPanel'
import WishlistHeartButton from '../shared/components/WishlistHeartButton'
import { getSession } from '../shared/utils/auth'
import { DEFAULT_FILTERS, normalizeFiltersForRequest } from '../shared/constants/gameFilters'
import { getHomeData } from '../features/game/api/homeApi'
import { getMyWishlist } from '../features/wishlist/api/wishlistApi'
import { useWishlistToggle } from '../features/wishlist/useWishlistToggle'

const NAME_COLUMN_WIDTH = '180px'

// 메인: 검색 / login(discord)·마이페이지 / top100·MY 탭(화면 전환 없이 목록만 교체) / 정렬 / 필터
export default function MainPage() {
  const navigate = useNavigate()

  // top100 ↔ my(찜목록) 탭. 페이지 이동 없이 아래 목록 영역만 바뀐다
  const [tab, setTab] = useState('top100')

  // 로그인 세션(토큰+유저정보). 있으면 login 자리에 프사/이름 표시. 새로고침해도 유지됨
  const user = getSession()

  // 정렬은 선택 즉시 적용. 필터(장르/가격/할인)는 값을 모아뒀다가 "적용" 버튼으로 한번에 반영
  const [sort, setSort] = useState('popular')
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS)

  const handleApplyFilters = () => {
    setAppliedFilters(normalizeFiltersForRequest(draftFilters))
  }

  // top100: /api/home 에서 로드 (로그인 여부와 무관한 공개 데이터). 정렬/필터가 바뀔 때마다 재조회
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

    return () => {
      cancelled = true
    }
  }, [tab, sort, appliedFilters])

  const tabStyle = (name) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    fontWeight: tab === name ? 'bold' : 'normal',
    textDecoration: tab === name ? 'underline' : 'none',
  })

  // 찜 목록: /api/users/me/wishlist 에서 로드 (로그인 필요)
  const [wishlist, setWishlist] = useState([])
  const [wishlistLoading, setWishlistLoading] = useState(true)
  const [wishlistError, setWishlistError] = useState(null)

  // 찜 여부 판단용 id Set. top100에서도 하트 상태를 보여주기 위해 로그인 시 항상 로드해둔다
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

    return () => {
      cancelled = true
    }
  }

  // 로그인 상태면 최초 진입 시 찜 목록/ID를 미리 로드 (top100에서도 하트 표시가 필요하므로)
  useEffect(() => {
    if (!user) return
    const cancel = loadWishlist()
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // MY 탭을 눌렀을 때도 최신 상태로 재조회 (top100과 동일한 패턴 유지)
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
                {game.originalPrice.toLocaleString()}원
              </span>
              <span>-{game.discountPercent}%</span>{' '}
              <span>{game.finalPrice.toLocaleString()}원</span>
            </>
          ) : (
            <span>{game.finalPrice.toLocaleString()}원</span>
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
      <SearchTopBar />

      {/* 탭: top100 / MY — 클릭하면 아래 목록만 교체 */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
        <Box style={{ display: 'flex', padding: 0 }}>
          <div style={{ ...tabStyle('top100'), borderRight: '2px solid black' }} onClick={() => setTab('top100')}>
            top100
          </div>
          <div style={tabStyle('my')} onClick={() => setTab('my')}>
            MY
          </div>
        </Box>
      </div>

      <div style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
        {/* 목록 영역 — 탭에 따라 내용 교체 */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <SortDropdown value={sort} onChange={setSort} />
          </div>

          {tab === 'top100' ? (
            <>
              {topGamesLoading && <Box style={{ marginBottom: '10px' }}>불러오는 중...</Box>}
              {topGamesError && <Box style={{ marginBottom: '10px' }}>에러: {topGamesError}</Box>}
              {!topGamesLoading && !topGamesError && topGames.length === 0 && (
                <Box style={{ marginBottom: '10px' }}>표시할 게임이 없습니다</Box>
              )}
              {topGames.map(renderGameRow)}
            </>
          ) : (
            <>
              {/* MY 탭: 찜 목록 로딩/에러/빈 목록/실제 데이터 렌더링 (top100과 동일한 상태 처리 패턴) */}
              {wishlistLoading && <Box style={{ marginBottom: '10px' }}>불러오는 중...</Box>}
              {wishlistError && <Box style={{ marginBottom: '10px' }}>에러: {wishlistError}</Box>}
              {!wishlistLoading && !wishlistError && wishlist.length === 0 && (
                <Box style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  찜한 게임이 없습니다
                </Box>
              )}
              {wishlist.map(renderGameRow)}
            </>
          )}
        </div>

        <FilterPanel draftFilters={draftFilters} setDraftFilters={setDraftFilters} onApply={handleApplyFilters} />
      </div>
    </div>
  )
}
