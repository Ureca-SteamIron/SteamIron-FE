import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '../shared/components/Box'
import { getSession } from '../shared/utils/auth'
import { getHomeData } from '../features/game/api/homeApi'

// 메인: 검색 / login(discord)·마이페이지 / top100·MY 탭(화면 전환 없이 목록만 교체) / 정렬 / 필터
export default function MainPage() {
  const navigate = useNavigate()

  // top100 ↔ my(찜목록) 탭. 페이지 이동 없이 아래 목록 영역만 바뀐다
  const [tab, setTab] = useState('top100')

  // 로그인 세션(토큰+유저정보). 있으면 login 자리에 프사/이름 표시. 새로고침해도 유지됨
  const user = getSession()

  // top100: /api/home 에서 로드 (로그인 여부와 무관한 공개 데이터)
  const [topGames, setTopGames] = useState([])
  const [topGamesLoading, setTopGamesLoading] = useState(true)
  const [topGamesError, setTopGamesError] = useState(null)

  useEffect(() => {
    let cancelled = false

    getHomeData()
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
  }, [])

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
            <Box style={{ width: '250px' }}>정렬</Box>
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
        <Box style={{ width: '220px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          필터
        </Box>
      </div>
    </div>
  )
}
