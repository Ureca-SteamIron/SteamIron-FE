import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Box from '../shared/components/Box'
import { getGameDetail, refreshGame } from '../features/game/api/gameApi'
import { createAlert } from '../features/alert/api/alertApi'
import AlertForm from '../features/alert/components/AlertForm'
import { getSession } from '../shared/utils/auth'
import CommentSection from '../features/comment/components/CommentSection'

const REFRESH_COOLDOWN_MS = 10 * 60 * 1000 // 10분
const REFRESH_STORAGE_KEY = 'steamiron.lastRefreshAt'

// 게임별 마지막 갱신 시각을 localStorage에서 읽어온다 (새로고침해도 쿨다운 유지)
function getLastRefreshAt(gameId) {
  try {
    const raw = localStorage.getItem(REFRESH_STORAGE_KEY)
    const map = raw ? JSON.parse(raw) : {}
    return map[gameId] ?? null
  } catch {
    return null
  }
}

function setLastRefreshAt(gameId, timestamp) {
  try {
    const raw = localStorage.getItem(REFRESH_STORAGE_KEY)
    const map = raw ? JSON.parse(raw) : {}
    map[gameId] = timestamp
    localStorage.setItem(REFRESH_STORAGE_KEY, JSON.stringify(map))
  } catch {
    // localStorage 접근 실패 시 쿨다운 기능만 조용히 스킵
  }
}

// 상세페이지: 상세정보(썸네일/가격) / 가격 히스토리 차트 / AI 요약 / 커뮤니티(댓글)
export default function GameDetailPage() {
  const navigate = useNavigate()
  const { gameId } = useParams()
  const user = getSession()

  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState(null)
  // 남은 쿨다운(초). 0이면 갱신 가능
  const [cooldownSec, setCooldownSec] = useState(0)

  const [showAlertForm, setShowAlertForm] = useState(false)
  const [savingAlert, setSavingAlert] = useState(false)
  const [alertMsg, setAlertMsg] = useState('')

  const handleCreateAlert = (payload) => {
    setSavingAlert(true)
    setAlertMsg('')
    createAlert(gameId, payload)
      .then(() => {
        setAlertMsg('알림이 설정되었습니다.')
        setShowAlertForm(false)
      })
      .catch((err) => setAlertMsg(err.response?.data?.message ?? err.message))
      .finally(() => setSavingAlert(false))
  }

  // 남은 쿨다운을 계산해서 state에 반영 (초 단위, 0 이하면 0으로 클램프)
  const recalcCooldown = () => {
    const lastAt = getLastRefreshAt(gameId)
    if (!lastAt) {
      setCooldownSec(0)
      return
    }
    const remainingMs = REFRESH_COOLDOWN_MS - (Date.now() - lastAt)
    setCooldownSec(remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0)
  }

  // 게임 진입 시 쿨다운 상태 확인 + 1초마다 카운트다운 갱신
  useEffect(() => {
    recalcCooldown()
    const timer = setInterval(recalcCooldown, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  const handleRefresh = () => {
    if (refreshing || cooldownSec > 0) return

    setRefreshing(true)
    setRefreshError(null)

    refreshGame(gameId)
      .then((data) => {
        setGame(data)
        setLastRefreshAt(gameId, Date.now())
        recalcCooldown()
      })
      .catch((err) => setRefreshError(err.response?.data?.message ?? err.message))
      .finally(() => setRefreshing(false))
  }

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

  const isRefreshDisabled = refreshing || cooldownSec > 0

  const refreshLabel = refreshing
    ? '갱신 중...'
    : cooldownSec > 0
      ? `${Math.floor(cooldownSec / 60)}:${String(cooldownSec % 60).padStart(2, '0')} 후 가능`
      : '갱신'

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box onClick={() => navigate('/')} style={{ display: 'inline-block' }}>
          ← 메인으로
        </Box>
        <Box
          onClick={handleRefresh}
          style={{
            display: 'inline-block',
            cursor: isRefreshDisabled ? 'default' : 'pointer',
            opacity: isRefreshDisabled ? 0.5 : 1,
          }}
        >
          {refreshLabel}
        </Box>
      </div>

      {refreshError && <Box style={{ marginTop: '10px' }}>갱신 실패: {refreshError}</Box>}

      {loading && <Box style={{ marginTop: '20px' }}>불러오는 중...</Box>}
      {error && <Box style={{ marginTop: '20px' }}>에러: {error}</Box>}

      {!loading && !error && game && (
        <>
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
              {user ? (
                <div style={{ marginTop: '10px' }}>
                  <Box
                    onClick={() => setShowAlertForm((v) => !v)}
                    style={{ display: 'inline-block', cursor: 'pointer' }}
                  >
                    가격 변동 알림 설정
                  </Box>
                  {showAlertForm && (
                    <AlertForm
                      originalPrice={game.originalPrice}
                      submitting={savingAlert}
                      onSubmit={handleCreateAlert}
                      onCancel={() => setShowAlertForm(false)}
                    />
                  )}
                  {alertMsg && <div style={{ marginTop: '8px' }}>{alertMsg}</div>}
                </div>
              ) : (
                <Box
                  onClick={() => navigate('/login')}
                  style={{ display: 'inline-block', marginTop: '10px', cursor: 'pointer' }}
                >
                  로그인하고 알림 설정
                </Box>
              )}
            </Box>
          </div>

          <Box style={{ height: '200px', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            가격 변동 (할인) 차트
          </Box>

          <Box style={{ height: '120px', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {game.aiExplanation ?? 'AI 요약 (게임정보, 할인 정보 등)'}
          </Box>

          <CommentSection gameId={gameId} />
        </>
      )}
    </div>
  )
}