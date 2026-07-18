import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Box from '../shared/components/Box'
import { getGameDetail } from '../features/game/api/gameApi'

// 상세페이지: 상세정보(썸네일/가격) / 가격 히스토리 차트 / AI 요약 / 커뮤니티(댓글)
export default function GameDetailPage() {
  const navigate = useNavigate()
  const { gameId } = useParams()

  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getGameDetail(gameId)
      .then((data) => {
        if (!cancelled) setGame(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message ?? err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [gameId])

  return (
    <div style={{ padding: '20px' }}>
      <Box onClick={() => navigate('/')} style={{ display: 'inline-block' }}>← 메인으로</Box>

      {loading && <Box style={{ marginTop: '20px' }}>불러오는 중...</Box>}
      {error && <Box style={{ marginTop: '20px' }}>에러: {error}</Box>}

      {!loading && !error && game && (
        <>
          {/* 상세정보 */}
          <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
            <Box style={{ width: '300px', height: '180px', padding: 0, overflow: 'hidden' }}>
              <img
                src={game.headerImage}
                alt={game.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
            <Box style={{ flex: 1 }}>
              <div>
                {game.name} {game.isWishlisted ? '(찜함)' : ''}
              </div>
              <div>
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
              <Box onClick={() => navigate('/notifications')} style={{ display: 'inline-block', marginTop: '10px' }}>
                가격 변동 알림 설정
              </Box>
            </Box>
          </div>

          {/* 가격 히스토리 */}
          <Box style={{ height: '200px', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            가격 변동 (할인) 차트
          </Box>

          {/* AI 요약 */}
          <Box style={{ height: '120px', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {game.aiExplanation ?? 'AI 요약 (게임정보, 할인 정보 등)'}
          </Box>

          {/* 커뮤니티 */}
          <Box style={{ marginTop: '20px' }}>
            <div>커뮤니티 (댓글 / 대댓글)</div>
            <Box style={{ marginTop: '10px' }}>댓글 1</Box>
            <Box style={{ marginTop: '10px' }}>댓글 2</Box>
            <Box style={{ marginTop: '10px' }}>댓글 입력</Box>
          </Box>
        </>
      )}
    </div>
  )
}
