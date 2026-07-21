
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '../shared/components/Box'
import { getSession } from '../shared/utils/auth'
import { getHomeData } from '../features/game/api/homeApi'
import { getMyWishlist, addWishlist, removeWishlist } from '../features/wishlist/api/wishlistApi'
import { FaHeart, FaRegHeart } from 'react-icons/fa'

// BE GameFilterRequest.genre 후보 (별도 장르 목록 API가 없어 스팀 장르명으로 하드코딩)
const GENRE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'Action', label: '액션' },
  { value: 'Adventure', label: '어드벤처' },
  { value: 'RPG', label: 'RPG' },
  { value: 'Strategy', label: '전략' },
  { value: 'Simulation', label: '시뮬레이션' },
  { value: 'Casual', label: '캐주얼' },
  { value: 'Sports', label: '스포츠' },
  { value: 'Racing', label: '레이싱' },
]

const SORT_OPTIONS = [
  { value: 'popular', label: '인기순' },
  { value: 'price_asc', label: '낮은 가격순' },
  { value: 'price_desc', label: '높은 가격순' },
  { value: 'discount_desc', label: '할인율 높은순' },
  { value: 'name_asc', label: '이름순 (가나다)' },
  { value: 'name_desc', label: '이름 역순' },
]

const DEFAULT_FILTERS = {
  genre: 'all',
  priceType: 'all',
  minPrice: '',
  maxPrice: '',
  minDiscount: 0,
  sale: false,
}

const NAME_COLUMN_WIDTH = '180px'
const HEART_COLUMN_WIDTH = '36px'

// BE GameService.SEARCH_MIN_KEYWORD_LENGTH와 동일 기준 (1글자 검색은 결과가 너무 많아 느려짐)
const SEARCH_MIN_KEYWORD_LENGTH = 2

// 하트 토글 버튼: 찜 여부(liked)에 따라 add/remove API를 호출
function WishlistHeartButton({ liked, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        border: 'none',
        background: 'none',
        cursor: disabled ? 'default' : 'pointer',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: HEART_COLUMN_WIDTH,
        opacity: disabled ? 0.5 : 1,
      }}
      aria-label={liked ? '찜 해제' : '찜 추가'}
    >
      {liked ? <FaHeart size={18} color="#e74c3c" /> : <FaRegHeart size={18} color="#999" />}
    </button>
  )
}

// 메인: 검색 / login(discord)·마이페이지 / top100·MY 탭(화면 전환 없이 목록만 교체) / 정렬 / 필터
export default function MainPage() {
  const navigate = useNavigate()

  // 검색창 입력값. Enter 시 /search?keyword=...로 이동 (검색 결과는 별도 화면)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchError, setSearchError] = useState('')

  const handleSearchSubmit = () => {
    const trimmed = searchKeyword.trim()
    if (trimmed.length < SEARCH_MIN_KEYWORD_LENGTH) {
      setSearchError(`검색어는 ${SEARCH_MIN_KEYWORD_LENGTH}자 이상 입력해주세요`)
      return
    }
    setSearchError('')
    navigate(`/search?keyword=${encodeURIComponent(trimmed)}`)
  }

  // top100 ↔ my(찜목록) 탭. 페이지 이동 없이 아래 목록 영역만 바뀐다
  const [tab, setTab] = useState('top100')

  // 로그인 세션(토큰+유저정보). 있으면 login 자리에 프사/이름 표시. 새로고침해도 유지됨
  const user = getSession()

  // 정렬은 선택 즉시 적용. 필터(장르/가격/할인)는 값을 모아뒀다가 "적용" 버튼으로 한번에 반영
  const [sort, setSort] = useState('popular')
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS)

  const handleApplyFilters = () => {
    setAppliedFilters({
      genre: draftFilters.genre,
      priceType: draftFilters.priceType,
      minPrice: draftFilters.minPrice === '' ? undefined : Number(draftFilters.minPrice),
      maxPrice: draftFilters.maxPrice === '' ? undefined : Number(draftFilters.maxPrice),
      minDiscount: draftFilters.minDiscount === '' ? 0 : Number(draftFilters.minDiscount),
      sale: draftFilters.sale,
    })
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
  // 하트 클릭 중복 호출 방지 (게임별 요청 진행 상태)
  const [pendingIds, setPendingIds] = useState(new Set())

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

  // 하트 토글: 이미 찜한 상태면 삭제, 아니면 추가. Box의 navigate 클릭과 겹치지 않도록 stopPropagation
  const handleToggleWishlist = async (e, game) => {
    e.stopPropagation()

    if (!user) {
      navigate('/login')
      return
    }

    const gameId = game.appId
    if (pendingIds.has(gameId)) return

    const liked = wishlistIds.has(gameId)

    setPendingIds((prev) => new Set(prev).add(gameId))
    try {
      if (liked) {
        await removeWishlist(gameId)
        setWishlistIds((prev) => {
          const next = new Set(prev)
          next.delete(gameId)
          return next
        })
        setWishlist((prev) => prev.filter((g) => g.appId !== gameId))
      } else {
        await addWishlist(gameId)
        setWishlistIds((prev) => new Set(prev).add(gameId))
        setWishlist((prev) => [...prev, game])
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(gameId)
        return next
      })
    }
  }

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
          onClick={(e) => handleToggleWishlist(e, game)}
        />
      </Box>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* 상단: 검색 + 알림/마이페이지/로그인 */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <Box style={{ flex: 1, maxWidth: '600px', margin: '0 auto', padding: '4px 10px' }}>
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
            }}
            style={{ width: '100%', border: 'none', outline: 'none' }}
          />
        </Box>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Box onClick={() => navigate('/notifications')}>알림</Box>
          <Box onClick={() => navigate('/me')}>마이페이지</Box>
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
              <span>{user.username}</span>
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
            <Box style={{ width: '250px' }}>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{ width: '100%' }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Box>
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

        {/* 우측 필터 */}
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

          <Box onClick={handleApplyFilters} style={{ textAlign: 'center', cursor: 'pointer' }}>
            적용
          </Box>
        </Box>
      </div>
    </div>
  )
}
