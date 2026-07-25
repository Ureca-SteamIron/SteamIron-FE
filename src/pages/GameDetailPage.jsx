import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { FaBell, FaBellSlash, FaHeart, FaRegHeart, FaSteam } from 'react-icons/fa'
import { HiSparkles } from 'react-icons/hi2'
import Box from '../shared/components/Box'
import SearchTopBar from '../shared/components/SearchTopBar'
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
import { useWishlistToggle } from '../features/wishlist/useWishlistToggle'

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

  // 알림 팝오버가 화면 아래쪽에서 열리면 저장/취소 버튼이 화면 밖으로 나갈 수 있어서,
  // 열릴 때 팝오버 전체가 보이도록 스크롤해준다.
  const alertPanelRef = useRef(null)

  // 찜 토글: 목록 화면들과 동일한 훅을 재사용한다. 이 페이지는 게임이 하나뿐이라
  // Set에는 항상 이 게임의 appId 하나만 들어있거나 비어있다.
  const [wishlistIds, setWishlistIds] = useState(new Set())
  const { pendingIds: wishlistPendingIds, toggleWishlist } = useWishlistToggle(wishlistIds, setWishlistIds)

  useEffect(() => {
    if (!game) return
    setWishlistIds(game.isWishlisted ? new Set([game.appId]) : new Set())
  }, [game?.appId, game?.isWishlisted])

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
    if (togglingAlert || game?.isFree) return

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
  const isFreeGame = game?.isFree === true
  const isBellActive = !isFreeGame && (existingAlert ? existingAlert.isActive : showAlertForm)
  const isAlertPanelOpen = !isFreeGame && ((existingAlert?.isActive && !showAlertForm) || (isBellActive && showAlertForm))

  useEffect(() => {
    if (isAlertPanelOpen) {
      alertPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isAlertPanelOpen])

  // 찜 개수: 서버가 내려준 초기값(game.wishlistCount)에서, 최초 상태(game.isWishlisted) 대비
  // 지금 찜 상태(wishlistIds)가 바뀐 만큼만 화면에서 즉시 보정한다(다시 조회하지 않고도 정확).
  const wishlistCount = game
    ? Math.max(
        0,
        (game.wishlistCount ?? 0) + (wishlistIds.has(game.appId) ? 1 : 0) - (game.isWishlisted ? 1 : 0),
      )
    : 0

  const lastRefreshAt = gameId ? getLastRefreshAt(gameId) : null
  const lastRefreshLabel = lastRefreshAt
    ? `마지막 갱신 ${new Date(lastRefreshAt).toLocaleString('ko-KR')}`
    : null

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
      <div className="w-[1200px] max-w-full mx-auto p-5">
        <SearchTopBar />

        <div className="flex justify-between items-center mt-6">
          <div onClick={handleBack} className={linkButtonClass}>
            ← 뒤로가기
          </div>
          <div onClick={handleOpenSteamStore} className={linkButtonClass}>
            <FaSteam size={18} />
            <span>Steam Store</span>
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
            <div className="grid grid-cols-[2fr_3fr] gap-6 mt-6">
              {/* 왼쪽 컬럼: 사진(높이 고정) + 차트(남은 높이를 채워서 오른쪽 컬럼과 아래쪽이 맞도록) */}
              <div className="flex flex-col gap-6">
                <div className={`${cardClass} h-[280px] flex-shrink-0 overflow-hidden`}>
                  <img
                    src={game.headerImage}
                    alt={game.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className={`${cardClass} flex-1 min-h-0 flex flex-col p-4`}>
                  <div className="mb-2.5 text-sm text-[var(--color-text-secondary)] flex-shrink-0">가격 변동 (할인율)</div>
                  <div className="flex-1 min-h-0">
                    <PriceHistoryChart gameId={gameId} />
                  </div>
                </div>
              </div>

              {/* 오른쪽 컬럼: 정보 표 + AI 요약 + 액션 버튼 */}
              <div className="flex flex-col gap-6">
                <div className={`${cardClass} overflow-hidden`}>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-[var(--color-border)]">
                      <tr className="border-b border-[var(--color-border)]">
                        <th className="w-[110px] px-4 py-3 text-left text-[var(--color-text-secondary)] font-medium bg-[var(--color-bg-surface-alt)]">
                          App ID
                        </th>
                        <td className="px-4 py-3 text-[var(--color-text-primary)]">{game.appId}</td>
                      </tr>
                      <tr className="border-b border-[var(--color-border)]">
                        <th className="px-4 py-3 text-left text-[var(--color-text-secondary)] font-medium bg-[var(--color-bg-surface-alt)]">
                          제목
                        </th>
                        <td className="px-4 py-3 text-[var(--color-text-heading)] font-semibold">{game.name}</td>
                      </tr>
                      <tr className="border-b border-[var(--color-border)]">
                        <th className="px-4 py-3 text-left text-[var(--color-text-secondary)] font-medium bg-[var(--color-bg-surface-alt)]">
                          장르
                        </th>
                        <td className="px-4 py-3 text-[var(--color-text-primary)]">
                          {game.genres?.length ? game.genres.join(', ') : '-'}
                        </td>
                      </tr>
                      <tr className="border-b border-[var(--color-border)]">
                        <th className="px-4 py-3 text-left text-[var(--color-text-secondary)] font-medium bg-[var(--color-bg-surface-alt)]">
                          가격
                        </th>
                        <td className="px-4 py-3">
                          {game.isFree ? (
                            <span className="text-green-400 font-semibold">무료</span>
                          ) : game.discountPercent > 0 ? (
                            <span className="flex items-center gap-2">
                              <span className="line-through text-[var(--color-text-tertiary)]">
                                {game.originalPrice.toLocaleString()}원
                              </span>
                              <span className="text-[var(--color-text-heading)] font-semibold">
                                {game.finalPrice.toLocaleString()}원
                              </span>
                            </span>
                          ) : (
                            <span className="text-[var(--color-text-heading)] font-semibold">
                              {game.finalPrice.toLocaleString()}원
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th className="px-4 py-3 text-left text-[var(--color-text-secondary)] font-medium bg-[var(--color-bg-surface-alt)]">
                          할인율
                        </th>
                        <td className="px-4 py-3">
                          {game.discountPercent > 0 ? (
                            <span className="text-green-400 font-semibold">-{game.discountPercent}%</span>
                          ) : (
                            <span className="text-[var(--color-text-secondary)]">-</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="relative">
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-green-400 via-cyan-400 to-violet-400 opacity-40 blur-lg animate-pulse pointer-events-none" />

                  <div className="relative rounded-xl p-[1px] bg-gradient-to-r from-green-400/70 via-cyan-400/60 to-violet-400/70">
                    {/* 높이를 고정해서 로딩 중(짧은 문구)→완료(긴 요약) 전환 시 패널이 커졌다 작아지는 현상을 없앤다.
                        내용이 넘치면 이 안에서만 스크롤한다. */}
                    <div className="relative overflow-hidden rounded-[11px] bg-[var(--color-bg-surface)] p-5 h-[200px] flex flex-col">
                      <HiSparkles className="absolute -right-4 -bottom-4 text-[90px] text-green-400/10 pointer-events-none" />

                      <div className="relative flex items-center gap-2 mb-3 flex-shrink-0">
                        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 via-cyan-400 to-violet-400 text-[var(--color-text-on-accent)] flex-shrink-0">
                          <HiSparkles size={15} />
                        </span>
                        <span className="text-sm font-bold text-[var(--color-text-heading)]">AI 요약</span>
                      </div>

                      <div className="relative flex-1 min-h-0 overflow-y-auto pr-1">
                        <p className="text-sm leading-relaxed text-[var(--color-text-primary)] whitespace-pre-line">
                          {aiSummaryLoading ? 'AI가 요약을 만드는 중...' : aiSummary}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 찜 추가 / 알림 추가 / 갱신 한 줄 */}
                {user ? (
                  <div className={`${cardClass} p-3 flex items-center gap-3`}>
                    <button
                      type="button"
                      onClick={(e) => toggleWishlist(e, game)}
                      disabled={wishlistPendingIds.has(game.appId)}
                      aria-label={game.isWishlisted ? '찜 해제' : '찜 추가'}
                      className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm transition-colors duration-150 ${
                        wishlistPendingIds.has(game.appId)
                          ? 'cursor-not-allowed opacity-40 border-[var(--color-border)] text-[var(--color-text-secondary)]'
                          : wishlistIds.has(game.appId)
                            ? 'cursor-pointer border-red-400 text-red-400 hover:bg-red-400/10'
                            : 'cursor-pointer border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      {wishlistIds.has(game.appId) ? <FaHeart /> : <FaRegHeart />}
                      {wishlistIds.has(game.appId) ? '찜 해제' : '찜 추가'}
                      <span className="text-[var(--color-text-tertiary)]">{wishlistCount.toLocaleString()}</span>
                    </button>

                    {/* relative 앵커: 알림 패널을 이 버튼 기준으로 절대배치해서 아래 패널들을 밀어내지 않게 한다 */}
                    <div className="relative flex-shrink-0">
                      <button
                        type="button"
                        onClick={handleBellToggle}
                        disabled={togglingAlert || isFreeGame || loadingAlert}
                        aria-label={
                          isFreeGame ? '무료 게임은 알림을 설정할 수 없습니다' : isBellActive ? '가격 알림 끄기' : '가격 알림 켜기'
                        }
                        title={
                          isFreeGame ? '무료 게임은 알림을 설정할 수 없습니다' : isBellActive ? '가격 알림 끄기' : '가격 알림 켜기'
                        }
                        className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm transition-colors duration-150 ${
                          togglingAlert || isFreeGame || loadingAlert
                            ? 'cursor-not-allowed opacity-40 border-[var(--color-border)] text-[var(--color-text-secondary)]'
                            : isBellActive
                              ? 'cursor-pointer border-green-400 text-green-400 hover:bg-green-400/10'
                              : 'cursor-pointer border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]'
                        }`}
                      >
                        {isBellActive ? <FaBell /> : <FaBellSlash />}
                        알림 {isBellActive ? 'ON' : '추가'}
                      </button>

                      {/* 알림 세부 정보 / 수정 폼: 문서 흐름에서 빼서(absolute) 다른 패널을 밀어내지 않고 위에 뜬다 */}
                      {user && isAlertPanelOpen && (
                        <>
                          {showAlertForm && (
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setShowAlertForm(false)}
                            />
                          )}
                          <div
                            ref={alertPanelRef}
                            className="absolute top-[calc(100%+8px)] left-0 z-50 w-[320px] max-h-[70vh] overflow-y-auto shadow-2xl shadow-black/50 rounded-xl"
                          >
                            {existingAlert?.isActive && !showAlertForm && (
                              <div className={`${cardClass} p-4 text-sm text-[var(--color-text-secondary)] space-y-1`}>
                                <div className="flex items-center justify-between">
                                  <span>알림 설정</span>
                                  <span
                                    onClick={() => setShowAlertForm(true)}
                                    className="text-[var(--color-text-secondary)] cursor-pointer transition-colors duration-150 hover:text-[var(--color-text-primary)] underline"
                                  >
                                    수정
                                  </span>
                                </div>
                                <div>할인 시작 알림: {existingAlert.discountStartEnabled ? 'ON' : 'OFF'}</div>
                                <div>
                                  지정 할인율 알림: {existingAlert.targetDiscountEnabled
                                    ? `${existingAlert.discountRate}% 이상 · 목표가 약 ${existingAlert.targetPrice?.toLocaleString()}원`
                                    : 'OFF'}
                                </div>
                              </div>
                            )}

                            {isBellActive && showAlertForm && (
                              <AlertForm
                                originalPrice={game.originalPrice}
                                initialDiscountStartEnabled={existingAlert?.discountStartEnabled ?? false}
                                initialTargetDiscountEnabled={existingAlert?.targetDiscountEnabled ?? true}
                                initialRate={existingAlert?.discountRate ?? 30}
                                submitting={savingAlert}
                                onSubmit={handleSaveAlert}
                                onCancel={() => setShowAlertForm(false)}
                              />
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div
                      onClick={handleRefresh}
                      className={`flex-1 flex flex-col items-center justify-center text-center rounded-xl border px-4 py-2 text-sm transition-colors duration-150 ${
                        isRefreshDisabled
                          ? 'cursor-default opacity-40 border-[var(--color-border)] text-[var(--color-text-secondary)]'
                          : 'cursor-pointer border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-border-hover)]'
                      }`}
                    >
                      <span>{refreshLabel}</span>
                      {lastRefreshLabel && (
                        <span className="text-[11px] text-[var(--color-text-tertiary)]">{lastRefreshLabel}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`${cardClass} p-4 text-center text-sm text-[var(--color-text-secondary)]`}>
                    <span
                      onClick={() => navigate('/login')}
                      className="text-green-400 font-semibold cursor-pointer hover:text-green-300 underline"
                    >
                      로그인
                    </span>
                    하면 찜·알림을 이용할 수 있어요
                  </div>
                )}

                {alertMsg && <div className="text-sm text-[var(--color-text-secondary)]">{alertMsg}</div>}
              </div>
            </div>

            <CommentSection gameId={gameId} />
          </>
        )}
      </div>
    </div>
  )
}
