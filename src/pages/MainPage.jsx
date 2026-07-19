import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '../shared/components/Box'
import { getSession } from '../shared/utils/auth'
import { getHomeData } from '../features/game/api/homeApi'

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

  return (
    <div style={{ padding: '20px' }}>
      {/* 상단: 검색 + 알림/마이페이지/로그인 */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <Box style={{ flex: 1, maxWidth: '600px', margin: '0 auto' }}>검색</Box>
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
              {topGames.map((game) => (
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
                    {/* 가격이 null인 게임이 있음 (미수집/판매중지 등) — 그대로 toLocaleString() 하면 화면 전체가 죽는다 */}
                    {game.finalPrice == null ? (
                      <span>가격 정보 없음</span>
                    ) : game.discountPercent > 0 ? (
                      <>
                        <span style={{ textDecoration: 'line-through', marginRight: '8px' }}>
                          {(game.originalPrice ?? game.finalPrice).toLocaleString()}원
                        </span>
                        <span>-{game.discountPercent}%</span>{' '}
                        <span>{game.finalPrice.toLocaleString()}원</span>
                      </>
                    ) : (
                      <span>{game.finalPrice.toLocaleString()}원</span>
                    )}
                  </div>
                  <div style={{ width: '200px', textAlign: 'center' }}>{game.name}</div>
                </Box>
              ))}
            </>
          ) : (
            <>
              {[1, 2].map((gameId) => (
                <Box
                  key={gameId}
                  onClick={() => navigate(`/games/${gameId}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '10px' }}
                >
                  <Box style={{ width: '120px', height: '50px' }}>이미지</Box>
                  <div style={{ flex: 1, textAlign: 'center' }}>가격 할인율 등</div>
                  <div style={{ width: '200px', textAlign: 'center' }}>찜한 게임 {gameId}</div>
                </Box>
              ))}
              <Box style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                찜목록 (관심목록)
              </Box>
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
