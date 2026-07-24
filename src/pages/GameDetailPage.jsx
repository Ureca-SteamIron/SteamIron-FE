import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { FaBell, FaBellSlash, FaSteam } from 'react-icons/fa'
import { HiSparkles } from 'react-icons/hi2'
import Box from '../shared/components/Box'
import { getAiSummary, getGameDetail, refreshGame } from '../features/game/api/gameApi'
import {
  createAlert,
  deleteAlert,
  getMyAlerts,
  setAlertActive,
  updateAlert,
} from '../features/alert/api/alertApi'
import AlertForm from '../features/alert/components/AlertForm'
import { getSession } from '../shared/utils/auth'
import CommentSection from '../features/comment/components/CommentSection'
import PriceHistoryChart from '../features/game/components/PriceHistoryChart'

const REFRESH_COOLDOWN_MS = 10 * 60 * 1000 // 10분
const REFRESH_STORAGE_KEY = 'steamiron.lastRefreshAt'

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

export default function GameDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { gameId } = useParams()
  const user = getSession()

  // 목록(메인/검색 결과)에서 정렬·필터가 적용된 채로 들어왔다면 그 상태 그대로 되돌아가야 하므로
  // '/'로 새로 이동하지 않고 브라우저 히스토리를 그대로 되짚어간다.
  // 다만 이 페이지가 히스토리의 첫 진입점(공유 링크 등)이면 뒤로 갈 곳이 없으므로 메인으로 보낸다.
  const handleBack = () => {
    if (location.key === 'default') {
      navigate('/')
    } else {
      navigate(-1)
    }
  }

  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // AI 요약은 Gemini 호출 때문에 느려서(수 초) 게임 상세와 별도 엔드포인트로 분리했다.
  // 상세 화면은 먼저 띄우고, 이건 병렬로 불러오면서 도착 전까지 "요약 중..." 문구를 보여준다.
  const [aiSummary, setAiSummary] = useState(null)
  const [aiSummaryLoading, setAiSummaryLoading] = useState(true)

  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState(null)
  const [cooldownSec, setCooldownSec] = useState(0)

  const [showAlertForm, setShowAlertForm] = useState(false)
  const [savingAlert, setSavingAlert] = useState(false)
  const [loadingAlert, setLoadingAlert] = useState(false)
  const [togglingAlert, setTogglingAlert] = useState(false)
  const [existingAlert, setExistingAlert] = useState(null)
  const [alertMsg, setAlertMsg] = useState('')

  const findCurrentGameAlert = () =>
    getMyAlerts().then((alerts) =>
      alerts.find((item) => String(item.gameId) === String(gameId)) ?? null,
    )

  const handleSaveAlert = (payload) => {
    setSavingAlert(true)
    setAlertMsg('')

    const wasInactive = existingAlert && !existingAlert.isActive
    const request = existingAlert
      ? updateAlert(existingAlert.alertId, payload).then(() =>
          wasInactive ? setAlertActive(existingAlert.alertId, true) : undefined,
        )
      : createAlert(gameId, payload)

    request
      .then(findCurrentGameAlert)
      .then((savedAlert) => {
        setExistingAlert(savedAlert)
        setAlertMsg(
          existingAlert
            ? wasInactive
              ? '알림 설정을 변경하고 다시 켰습니다.'
              : '알림 설정이 변경되었습니다.'
            : '알림이 설정되었습니다.',
        )
        setShowAlertForm(false)
      })
      .catch((err) => setAlertMsg(err.response?.data?.message ?? err.message))
      .finally(() => setSavingAlert(false))
  }

  const handleBellToggle = () => {
    if (togglingAlert) return

    if (!existingAlert) {
      setShowAlertForm((current) => !current)
      setAlertMsg('')
      return
    }

    setTogglingAlert(true)
    setAlertMsg('')

    if (existingAlert.isActive) {
      deleteAlert(existingAlert.alertId)
        .then(() => {
          setExistingAlert(null)
          setShowAlertForm(false)
          setAlertMsg('가격 알림과 저장된 목표가를 삭제했습니다.')
        })
        .catch((err) => setAlertMsg(err.response?.data?.message ?? err.message))
        .finally(() => setTogglingAlert(false))
      return
    }

    setAlertActive(existingAlert.alertId, true)
      .then(() => {
        setExistingAlert((current) => ({ ...current, isActive: true }))
        setShowAlertForm(true)
        setAlertMsg('알림을 다시 켰습니다.')
      })
      .catch((err) => setAlertMsg(err.response?.data?.message ?? err.message))
      .finally(() => setTogglingAlert(false))
  }

  useEffect(() => {
    let cancelled = false

    if (!user) {
      setExistingAlert(null)
      return undefined
    }

    setLoadingAlert(true)
    setExistingAlert(null)
    findCurrentGameAlert()
      .then((alert) => {
        if (!cancelled) setExistingAlert(alert)
      })
      .catch((err) => {
        if (!cancelled) setAlertMsg(err.response?.data?.message ?? err.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingAlert(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  const recalcCooldown = () => {
    const lastAt = getLastRefreshAt(gameId)
    if (!lastAt) {
      setCooldownSec(0)
      return
    }
    const remainingMs = REFRESH_COOLDOWN_MS - (Date.now() - lastAt)
    setCooldownSec(remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0)
  }

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
        // 가격/할인이 바뀌었을 수 있으니 AI 요약도 다시 불러온다.
        loadAiSummary()
      })
      .catch((err) => setRefreshError(err.response?.data?.message ?? err.message))
      .finally(() => setRefreshing(false))
  }

  const handleOpenSteamStore = () => {
    window.open(
      `https://store.steampowered.com/app/${gameId}`,
      '_blank',
      'noopener,noreferrer',
    )
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

  const loadAiSummary = () => {
    let cancelled = false
    setAiSummaryLoading(true)
    setAiSummary(null)

    getAiSummary(gameId)
      .then((text) => {
        if (!cancelled) setAiSummary(text)
      })
      .catch(() => {
        if (!cancelled) setAiSummary('AI 요약을 불러오는 데 실패했습니다.')
      })
      .finally(() => {
        if (!cancelled) setAiSummaryLoading(false)
      })

    return () => {
      cancelled = true
    }
  }

  // 게임 상세 조회와 완전히 독립적으로(병렬로) 불러온다 — 상세 응답을 기다리지 않는다.
  useEffect(() => {
    const cancel = loadAiSummary()
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  const isRefreshDisabled = refreshing || cooldownSec > 0
  const isBellActive = existingAlert ? existingAlert.isActive : showAlertForm

  const refreshLabel = refreshing
    ? '갱신 중...'
    : cooldownSec > 0
      ? `${Math.floor(cooldownSec / 60)}:${String(cooldownSec % 60).padStart(2, '0')} 후 가능`
      : '갱신'

  const cardClass = 'rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)]'
  const linkButtonClass =
    'inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] cursor-pointer transition-colors duration-150 hover:bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-border-hover)]'

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)] overflow-x-hidden">
      <div className="w-[1400px] max-w-full mx-auto p-5">
        <div className="flex justify-between items-center">
          <div onClick={handleBack} className={linkButtonClass}>
            ← 뒤로가기
          </div>
          <div className="flex items-center gap-2.5">
            <div
              onClick={handleRefresh}
              className={`rounded-xl border px-4 py-2.5 text-sm transition-colors duration-150 ${
                isRefreshDisabled
                  ? 'cursor-default opacity-40 border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]'
                  : 'cursor-pointer border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-border-hover)]'
              }`}
            >
              {refreshLabel}
            </div>
            <div onClick={handleOpenSteamStore} className={linkButtonClass}>
              <FaSteam size={18} />
              <span>Steam Store</span>
            </div>
          </div>
        </div>

        {refreshError && (
          <div className={`${cardClass} mt-3 p-3 text-sm text-red-400`}>
            갱신 실패: {refreshError}
          </div>
        )}

        {loading && (
          <div className={`${cardClass} mt-6 p-4 text-center text-sm text-[var(--color-text-secondary)]`}>
            불러오는 중...
          </div>
        )}
        {error && (
          <div className={`${cardClass} mt-6 p-4 text-center text-sm text-red-400`}>
            에러: {error}
          </div>
        )}

        {!loading && !error && game && (
          <>
            <div className="flex gap-6 mt-6">
              <div className={`${cardClass} w-[320px] h-[190px] overflow-hidden flex-shrink-0`}>
                <img
                  src={game.headerImage}
                  alt={game.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className={`${cardClass} flex-1 min-w-0 p-5`}>
                <div className="text-lg font-bold text-[var(--color-text-heading)]">
                  {game.name}
                  {game.isWishlisted && (
                    <span className="ml-2 text-sm font-normal text-green-400">(찜함)</span>
                  )}
                </div>

                <div className="mt-2 text-sm">
                  {game.discountPercent > 0 ? (
                    <span className="flex items-center gap-2">
                      <span className="line-through text-[var(--color-text-tertiary)]">
                        {game.originalPrice.toLocaleString()}원
                      </span>
                      <span className="text-green-400 font-semibold">-{game.discountPercent}%</span>
                      <span className="text-[var(--color-text-heading)] font-semibold">
                        {game.finalPrice.toLocaleString()}원
                      </span>
                    </span>
                  ) : (
                    <span className="text-[var(--color-text-heading)] font-semibold">
                      {game.finalPrice.toLocaleString()}원
                    </span>
                  )}
                </div>

                {user ? (
                  <div className="mt-4">
                    {loadingAlert ? (
                      <div className="text-sm text-[var(--color-text-secondary)]">알림 설정을 불러오는 중...</div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleBellToggle}
                            disabled={togglingAlert}
                            aria-label={isBellActive ? '가격 알림 끄기' : '가격 알림 켜기'}
                            title={isBellActive ? '가격 알림 끄기' : '가격 알림 켜기'}
                            className={`flex items-center justify-center rounded-xl border px-3.5 py-2.5 text-xl transition-colors duration-150 ${
                              togglingAlert
                                ? 'cursor-default opacity-40 border-[var(--color-border)] text-[var(--color-text-secondary)]'
                                : isBellActive
                                  ? 'cursor-pointer border-green-400 text-green-400 hover:bg-green-400/10'
                                  : 'cursor-pointer border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]'
                            }`}
                          >
                            {isBellActive ? <FaBell /> : <FaBellSlash />}
                          </button>
                          <span
                            className={`text-sm font-medium ${
                              isBellActive ? 'text-green-400' : 'text-[var(--color-text-secondary)]'
                            }`}
                          >
                            {isBellActive ? '가격 알림 ON' : '가격 알림 OFF'}
                          </span>

                          {existingAlert?.isActive && !showAlertForm && (
                            <div
                              onClick={() => setShowAlertForm(true)}
                              className="text-sm text-[var(--color-text-secondary)] cursor-pointer transition-colors duration-150 hover:text-[var(--color-text-primary)] underline"
                            >
                              수정
                            </div>
                          )}
                        </div>

                        {existingAlert?.isActive && !showAlertForm && (
                          <div className="mt-3 text-sm text-[var(--color-text-secondary)] space-y-1">
                            <div>
                              할인 시작 알림: {existingAlert.discountStartEnabled ? 'ON' : 'OFF'}
                            </div>
                            <div>
                              지정 할인율 알림: {existingAlert.targetDiscountEnabled
                                ? `${existingAlert.discountRate}% 이상 · 목표가 약 ${existingAlert.targetPrice?.toLocaleString()}원`
                                : 'OFF'}
                            </div>
                          </div>
                        )}

                        {isBellActive && showAlertForm && (
                          <div className="mt-3">
                            <AlertForm
                              originalPrice={game.originalPrice}
                              initialDiscountStartEnabled={existingAlert?.discountStartEnabled ?? false}
                              initialTargetDiscountEnabled={existingAlert?.targetDiscountEnabled ?? true}
                              initialRate={existingAlert?.discountRate ?? 30}
                              submitting={savingAlert}
                              onSubmit={handleSaveAlert}
                              onCancel={() => setShowAlertForm(false)}
                            />
                          </div>
                        )}
                      </>
                    )}
                    {alertMsg && <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{alertMsg}</div>}
                  </div>
                ) : (
                  <div
                    onClick={() => navigate('/login')}
                    className="inline-block mt-4 text-sm text-green-400 cursor-pointer transition-colors duration-150 hover:text-green-300 underline"
                  >
                    로그인하고 알림 설정
                  </div>
                )}
              </div>
            </div>

            <div className={`${cardClass} mt-6 p-4`}>
              <div className="mb-2.5 text-sm text-[var(--color-text-secondary)]">가격 변동 (할인율)</div>
              <PriceHistoryChart gameId={gameId} />
            </div>

            <div className="relative mt-6">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-green-400 via-cyan-400 to-violet-400 opacity-40 blur-lg animate-pulse pointer-events-none" />

              <div className="relative rounded-xl p-[1px] bg-gradient-to-r from-green-400/70 via-cyan-400/60 to-violet-400/70">
                <div className="relative overflow-hidden rounded-[11px] bg-[var(--color-bg-surface)] p-5 min-h-[120px]">
                  <HiSparkles className="absolute -right-4 -bottom-4 text-[90px] text-green-400/10 pointer-events-none" />

                  <div className="relative flex items-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 via-cyan-400 to-violet-400 text-[var(--color-text-on-accent)] flex-shrink-0">
                      <HiSparkles size={15} />
                    </span>
                    <span className="text-sm font-bold text-[var(--color-text-heading)]">AI 요약</span>
                  </div>

                  <p className="relative text-sm leading-relaxed text-[var(--color-text-primary)] whitespace-pre-line">
                    {aiSummaryLoading ? 'AI가 요약을 만드는 중...' : aiSummary}
                  </p>
                </div>
              </div>
            </div>

            <CommentSection gameId={gameId} />
          </>
        )}
      </div>
    </div>
  )
}