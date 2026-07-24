import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FaBell, FaHeart } from 'react-icons/fa'
import { FiBell, FiHeart, FiMessageSquare, FiUser } from 'react-icons/fi'
import { clearSession, getSession } from '../shared/utils/auth'
import { getMyAccount, updateCredentials, withdraw } from '../features/user/api/userApi'
import { getMyWishlist, removeWishlist } from '../features/wishlist/api/wishlistApi'
import { deleteComment as deleteMyComment, getMyComments } from '../features/comment/api/commentApi'
import { deleteAlert, getMyAlerts, setAlertActive, updateAlert } from '../features/alert/api/alertApi'
import AlertForm from '../features/alert/components/AlertForm'
import { getGameDetail } from '../features/game/api/gameApi'

const PRICE_COLUMN_WIDTH = '210px'
const HEART_COLUMN_WIDTH = '36px'

const cardClass = 'rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)]'
const inputClass =
  'w-full bg-[var(--color-bg-input)] text-[var(--color-text-primary)] text-sm rounded-lg border border-[var(--color-border)] px-3 py-2 outline-none focus:border-[var(--color-border-strong)] mt-1.5'
const linkButtonClass =
  'inline-flex items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] cursor-pointer transition-colors duration-150 hover:bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-border-hover)]'

const SECTIONS = [
  { key: 'info', label: '내 정보 수정', icon: FiUser },
  { key: 'wishlist', label: '관심목록', icon: FiHeart },
  { key: 'alerts', label: '알림 등록한 게임', icon: FiBell },
  { key: 'comments', label: '내 커뮤니티 글', icon: FiMessageSquare },
]

// 마이페이지: 왼쪽 사이드바(항목 전환) + 오른쪽 콘텐츠(내 정보 조회/수정 / 관심목록 / 내 커뮤니티 글 / 회원탈퇴 / 로그아웃)
export default function MyPage() {
  const navigate = useNavigate()
  const user = getSession()
  const [searchParams, setSearchParams] = useSearchParams()

  const tab = SECTIONS.some((s) => s.key === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'info'

  const setTab = (nextTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', nextTab)
      return next
    })
  }

  const handleLogout = () => {
    clearSession()
    navigate('/')
  }

  // 회원 탈퇴: 되돌릴 수 없으므로 확인 후 진행. 성공하면 로그아웃과 동일하게 세션 정리 후 메인으로.
  const [withdrawing, setWithdrawing] = useState(false)
  const handleWithdraw = () => {
    if (withdrawing) return
    const confirmed = window.confirm(
      '정말 탈퇴하시겠습니까?\n' +
        '관심목록·알림 등 내 데이터는 삭제되며, 작성한 댓글은 "알 수 없는 사용자"로 남습니다.\n' +
        '이 작업은 되돌릴 수 없습니다.'
    )
    if (!confirmed) return

    setWithdrawing(true)
    withdraw()
      .then(() => {
        alert('탈퇴가 완료되었습니다.')
        clearSession()
        navigate('/')
      })
      .catch((err) => {
        alert(err.response?.data?.message ?? err.message)
        setWithdrawing(false)
      })
  }

  const [accountLoading, setAccountLoading] = useState(true)
  const [loginId, setLoginId] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!user) {
      setAccountLoading(false)
      return
    }
    getMyAccount()
      .then((account) => setLoginId(account.loginId ?? ''))
      .catch((err) => setMsg(err.response?.data?.message ?? err.message))
      .finally(() => setAccountLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = () => {
    if (newPassword && newPassword !== confirmPassword) {
      setMsg('새 비밀번호가 일치하지 않습니다.')
      return
    }
    setSaving(true)
    setMsg('')
    updateCredentials({ loginId, currentPassword, newPassword: newPassword || null })
      .then(() => {
        setMsg('수정되었습니다.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      })
      .catch((err) => setMsg(err.response?.data?.message ?? err.message))
      .finally(() => setSaving(false))
  }

  const [wishlist, setWishlist] = useState([])
  const [wishlistLoading, setWishlistLoading] = useState(true)
  const [wishlistError, setWishlistError] = useState(null)
  const [pendingIds, setPendingIds] = useState(new Set())

  const loadWishlist = () => {
    if (!user) {
      setWishlistLoading(false)
      return
    }
    let cancelled = false
    setWishlistLoading(true)
    setWishlistError(null)

    getMyWishlist()
      .then((data) => {
        if (!cancelled) setWishlist(data)
      })
      .catch((err) => {
        if (!cancelled) setWishlistError(err.response?.data?.message ?? err.message)
      })
      .finally(() => {
        if (!cancelled) setWishlistLoading(false)
      })

    return () => {
      cancelled = true
    }
  }

  useEffect(() => {
    const cancel = loadWishlist()
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRemoveWishlist = async (e, gameId) => {
    e.stopPropagation()
    if (pendingIds.has(gameId)) return

    setPendingIds((prev) => new Set(prev).add(gameId))
    try {
      await removeWishlist(gameId)
      setWishlist((prev) => prev.filter((g) => g.appId !== gameId))
    } catch (err) {
      alert(err.response?.data?.message ?? err.message)
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(gameId)
        return next
      })
    }
  }

  const renderWishlistRow = (game) => {
    const isPending = pendingIds.has(game.appId)
    const originalPrice = game.originalPrice ?? 0
    const finalPrice = game.finalPrice ?? 0

    return (
      <div
        key={game.appId}
        onClick={() => navigate(`/games/${game.appId}`)}
        className="flex items-center gap-6 mt-2.5 first:mt-0 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] cursor-pointer transition-colors duration-150 hover:bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-border-hover)]"
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
          className="flex items-center justify-end gap-2 text-sm flex-shrink-0 flex-wrap"
          style={{ width: PRICE_COLUMN_WIDTH }}
        >
          {finalPrice === 0 ? (
            <span className="text-green-400 font-semibold">무료</span>
          ) : game.discountPercent > 0 ? (
            <>
              <span className="line-through text-[var(--color-text-tertiary)]">
                {originalPrice.toLocaleString()}원
              </span>
              <span className="text-green-400 font-semibold">-{game.discountPercent}%</span>
              <span className="text-[var(--color-text-heading)] font-semibold">{finalPrice.toLocaleString()}원</span>
            </>
          ) : (
            <span className="text-[var(--color-text-heading)] font-semibold">{finalPrice.toLocaleString()}원</span>
          )}
        </div>

        <button
          onClick={(e) => !isPending && handleRemoveWishlist(e, game.appId)}
          disabled={isPending}
          aria-label="찜 해제"
          className={`flex items-center justify-center border-none bg-none p-0 transition-opacity duration-150 ${
            isPending ? 'cursor-default opacity-50' : 'cursor-pointer opacity-100 hover:opacity-70'
          }`}
          style={{ width: HEART_COLUMN_WIDTH }}
        >
          <FaHeart size={18} className="text-red-400" />
        </button>
      </div>
    )
  }

  // ===== 알림 등록한 게임 =====
  const [alerts, setAlerts] = useState([])
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [alertsError, setAlertsError] = useState(null)
  const [selectedAlertIds, setSelectedAlertIds] = useState(new Set())
  const [bulkRemoving, setBulkRemoving] = useState(false)

  // AlertForm은 한 번에 하나만 펼친다. originalPrice는 alerts 목록엔 없어서
  // 펼칠 때 게임 상세를 한 번 불러와 채운다(게임 상세 페이지와 동일한 계산식을 쓰기 위해).
  const [expandedAlertId, setExpandedAlertId] = useState(null)
  const [expandedOriginalPrice, setExpandedOriginalPrice] = useState(null)
  const [expandedPriceLoading, setExpandedPriceLoading] = useState(false)
  const [savingAlertId, setSavingAlertId] = useState(null)

  const loadAlerts = () => {
    if (!user) {
      setAlertsLoading(false)
      return
    }
    let cancelled = false
    setAlertsLoading(true)
    setAlertsError(null)

    getMyAlerts()
      .then((data) => {
        if (!cancelled) setAlerts(data)
      })
      .catch((err) => {
        if (!cancelled) setAlertsError(err.response?.data?.message ?? err.message)
      })
      .finally(() => {
        if (!cancelled) setAlertsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }

  useEffect(() => {
    const cancel = loadAlerts()
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggleAlertForm = (item) => {
    if (expandedAlertId === item.alertId) {
      setExpandedAlertId(null)
      return
    }

    setExpandedAlertId(item.alertId)
    setExpandedOriginalPrice(null)
    setExpandedPriceLoading(true)
    getGameDetail(item.gameId)
      .then((game) => setExpandedOriginalPrice(game.originalPrice ?? null))
      .catch(() => setExpandedOriginalPrice(null))
      .finally(() => setExpandedPriceLoading(false))
  }

  // 게임 상세 페이지의 handleSaveAlert와 동일한 규칙: 꺼져 있던 알림을 수정하면 같이 다시 켠다.
  const handleSaveAlert = (item, payload) => {
    setSavingAlertId(item.alertId)
    const wasInactive = !item.isActive

    updateAlert(item.alertId, payload)
      .then(() => (wasInactive ? setAlertActive(item.alertId, true) : undefined))
      .then(() => {
        setAlerts((prev) =>
          prev.map((a) => (a.alertId === item.alertId ? { ...a, ...payload, isActive: true } : a)),
        )
        setExpandedAlertId(null)
      })
      .catch((err) => alert(err.response?.data?.message ?? err.message))
      .finally(() => setSavingAlertId(null))
  }

  const toggleSelectAlert = (alertId) => {
    setSelectedAlertIds((prev) => {
      const next = new Set(prev)
      if (next.has(alertId)) next.delete(alertId)
      else next.add(alertId)
      return next
    })
  }

  const toggleSelectAllAlerts = () => {
    setSelectedAlertIds((prev) =>
      prev.size === alerts.length ? new Set() : new Set(alerts.map((a) => a.alertId)),
    )
  }

  const handleBulkRemoveAlerts = async () => {
    if (selectedAlertIds.size === 0 || bulkRemoving) return

    setBulkRemoving(true)
    try {
      await Promise.all([...selectedAlertIds].map((id) => deleteAlert(id)))
      setAlerts((prev) => prev.filter((a) => !selectedAlertIds.has(a.alertId)))
      if (expandedAlertId && selectedAlertIds.has(expandedAlertId)) setExpandedAlertId(null)
      setSelectedAlertIds(new Set())
    } catch (err) {
      alert(err.response?.data?.message ?? err.message)
    } finally {
      setBulkRemoving(false)
    }
  }

  const renderAlertRow = (item) => {
    const isExpanded = expandedAlertId === item.alertId
    const isSelected = selectedAlertIds.has(item.alertId)
    const isSaving = savingAlertId === item.alertId

    return (
      <div key={item.alertId} className="mt-2.5 first:mt-0">
        <div className="flex items-center gap-4 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] transition-colors duration-150 hover:bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-border-hover)]">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelectAlert(item.alertId)}
            aria-label={`${item.gameName} 선택`}
            className="accent-green-400 w-4 h-4 cursor-pointer flex-shrink-0"
          />

          <div
            onClick={() => navigate(`/games/${item.gameId}`)}
            className="w-[120px] h-[64px] rounded-lg overflow-hidden flex-shrink-0 bg-black cursor-pointer"
          >
            <img src={item.headerImage} alt={item.gameName} className="w-full h-full object-cover" />
          </div>

          <div
            onClick={() => navigate(`/games/${item.gameId}`)}
            className="flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-[var(--color-text-heading)] font-medium cursor-pointer"
            title={item.gameName}
          >
            {item.gameName}
          </div>

          <div
            className="flex items-center justify-end text-sm flex-shrink-0"
            style={{ width: PRICE_COLUMN_WIDTH }}
          >
            <span className="text-[var(--color-text-heading)] font-semibold">
              {(item.currentPrice ?? 0).toLocaleString()}원
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleToggleAlertForm(item)}
            aria-label={item.isActive ? '알림 등록됨 · 설정 보기' : '알림 꺼짐 · 설정 보기'}
            title={item.isActive ? '알림 등록됨' : '알림 꺼짐'}
            className={`flex items-center justify-center border-none bg-none p-0 transition-opacity duration-150 cursor-pointer opacity-100 hover:opacity-70 ${
              item.isActive ? 'text-green-400' : 'text-[var(--color-text-secondary)]'
            }`}
            style={{ width: HEART_COLUMN_WIDTH }}
          >
            <FaBell size={18} />
          </button>
        </div>

        {isExpanded && (
          <div className="mt-1 ml-[46px]">
            {expandedPriceLoading ? (
              <div className="p-4 text-sm text-[var(--color-text-secondary)]">불러오는 중...</div>
            ) : (
              <AlertForm
                originalPrice={expandedOriginalPrice}
                initialDiscountStartEnabled={item.discountStartEnabled ?? false}
                initialTargetDiscountEnabled={item.targetDiscountEnabled ?? true}
                initialRate={item.discountRate ?? 30}
                submitting={isSaving}
                onSubmit={(payload) => handleSaveAlert(item, payload)}
                onCancel={() => setExpandedAlertId(null)}
              />
            )}
          </div>
        )}
      </div>
    )
  }

  const [myComments, setMyComments] = useState([])
  const [myCommentsLoading, setMyCommentsLoading] = useState(true)
  const [myCommentsError, setMyCommentsError] = useState(null)

  const loadMyComments = () => {
    if (!user) {
      setMyCommentsLoading(false)
      return
    }
    setMyCommentsLoading(true)
    setMyCommentsError(null)
    getMyComments()
      .then((page) => setMyComments(page.content ?? []))
      .catch((err) => setMyCommentsError(err.response?.data?.message ?? err.message))
      .finally(() => setMyCommentsLoading(false))
  }

  useEffect(() => {
    loadMyComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDeleteMyComment = (commentId) => {
    deleteMyComment(commentId)
      .then(() => setMyComments((prev) => prev.filter((c) => c.id !== commentId)))
      .catch((err) => alert(err.response?.data?.message ?? err.message))
  }

  const renderAccountSection = () => (
    <div className={`${cardClass} p-5`}>
      <div className="w-[360px]">
        <div className="font-bold text-sm text-[var(--color-text-heading)]">
          내 정보 {user?.nickname ? `(${user.nickname})` : ''}
        </div>

        {!user && (
          <div
            onClick={() => navigate('/login')}
            className="mt-4 inline-block px-4 py-2 rounded-lg text-sm font-semibold text-[var(--color-text-on-accent)] bg-green-400 cursor-pointer transition-colors duration-150 hover:bg-green-300"
          >
            로그인
          </div>
        )}

        {user && !accountLoading && (
          <div className="mt-4">
            <div className="flex flex-col gap-3">
              <label className="text-sm text-[var(--color-text-primary)]">
                아이디
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-sm text-[var(--color-text-primary)]">
                현재 비밀번호
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-sm text-[var(--color-text-primary)]">
                새 비밀번호{' '}
                <span className="text-[var(--color-text-tertiary)] text-xs">(비우면 그대로)</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-sm text-[var(--color-text-primary)]">
                새 비밀번호 확인
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            {msg && <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{msg}</div>}

            <div className="flex items-center justify-between mt-4">
              <div
                onClick={withdrawing ? undefined : handleWithdraw}
                className={`px-3.5 py-1.5 rounded-lg text-sm text-red-400 border border-[var(--color-border)] transition-colors duration-150 hover:bg-red-400/10 hover:border-red-400/40 ${
                  withdrawing ? 'cursor-default opacity-50' : 'cursor-pointer'
                }`}
              >
                {withdrawing ? '탈퇴 중...' : '회원탈퇴'}
              </div>
              <div
                onClick={saving ? undefined : handleSave}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                  saving
                    ? 'cursor-default opacity-50 text-[var(--color-text-on-accent)] bg-green-400'
                    : 'cursor-pointer text-[var(--color-text-on-accent)] bg-green-400 hover:bg-green-300'
                }`}
              >
                {saving ? '저장 중...' : '저장'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderWishlistSection = () => (
    <div className={`${cardClass} p-5`}>
      <div className="font-bold text-sm text-[var(--color-text-heading)]">관심목록</div>

      {!user && (
        <div className="mt-2.5 text-sm text-[var(--color-text-secondary)]">로그인이 필요합니다</div>
      )}
      {user && wishlistLoading && (
        <div className="mt-2.5 text-sm text-[var(--color-text-secondary)]">불러오는 중...</div>
      )}
      {user && wishlistError && (
        <div className="mt-2.5 text-sm text-red-400">에러: {wishlistError}</div>
      )}
      {user && !wishlistLoading && !wishlistError && wishlist.length === 0 && (
        <div className="mt-2.5 text-sm text-[var(--color-text-secondary)]">찜한 게임이 없습니다</div>
      )}

      {user && !wishlistLoading && !wishlistError && (
        <div className="mt-2.5">{wishlist.map(renderWishlistRow)}</div>
      )}
    </div>
  )

  const renderAlertsSection = () => (
    <div className={`${cardClass} p-5`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="font-bold text-sm text-[var(--color-text-heading)]">알림 등록한 게임</div>

        {user && !alertsLoading && !alertsError && alerts.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={selectedAlertIds.size === alerts.length}
                onChange={toggleSelectAllAlerts}
                className="accent-green-400 w-4 h-4 cursor-pointer"
              />
              전체 선택
            </label>
            <div
              onClick={handleBulkRemoveAlerts}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                selectedAlertIds.size === 0 || bulkRemoving
                  ? 'cursor-default opacity-40 text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                  : 'cursor-pointer text-red-400 border border-[var(--color-border)] hover:bg-red-400/10 hover:border-red-400/40'
              }`}
            >
              {bulkRemoving ? '해제 중...' : `선택한 알림 해제 (${selectedAlertIds.size})`}
            </div>
          </div>
        )}
      </div>

      {!user && (
        <div className="mt-2.5 text-sm text-[var(--color-text-secondary)]">로그인이 필요합니다</div>
      )}
      {user && alertsLoading && (
        <div className="mt-2.5 text-sm text-[var(--color-text-secondary)]">불러오는 중...</div>
      )}
      {user && alertsError && (
        <div className="mt-2.5 text-sm text-red-400">에러: {alertsError}</div>
      )}
      {user && !alertsLoading && !alertsError && alerts.length === 0 && (
        <div className="mt-2.5 text-sm text-[var(--color-text-secondary)]">등록된 알림이 없습니다</div>
      )}

      {user && !alertsLoading && !alertsError && (
        <div className="mt-2.5">{alerts.map(renderAlertRow)}</div>
      )}
    </div>
  )

  const renderCommentsSection = () => (
    <div className={`${cardClass} p-5`}>
      <div className="font-bold text-sm text-[var(--color-text-heading)]">
        내 커뮤니티 글 (내가 쓴 글 / 댓글 목록)
      </div>

      {!user && (
        <div className="mt-2.5 text-sm text-[var(--color-text-secondary)]">로그인이 필요합니다</div>
      )}
      {user && myCommentsLoading && (
        <div className="mt-2.5 text-sm text-[var(--color-text-secondary)]">불러오는 중...</div>
      )}
      {user && myCommentsError && (
        <div className="mt-2.5 text-sm text-red-400">에러: {myCommentsError}</div>
      )}
      {user && !myCommentsLoading && !myCommentsError && myComments.length === 0 && (
        <div className="mt-2.5 text-sm text-[var(--color-text-secondary)]">작성한 댓글이 없습니다</div>
      )}

      {user &&
        !myCommentsLoading &&
        !myCommentsError &&
        myComments.map((comment) => (
          <div
            key={comment.id}
            className="flex items-center gap-3 mt-2.5 p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-alt)]"
          >
            <div
              onClick={() => navigate(`/games/${comment.gameId}`)}
              className="flex-1 min-w-0 cursor-pointer"
            >
              <div className="text-xs text-[var(--color-text-tertiary)]">{comment.gameName}</div>
              <div className="text-sm text-[var(--color-text-primary)] mt-1 truncate">{comment.content}</div>
              <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                {new Date(comment.createdAt).toLocaleString()}
              </div>
            </div>
            <div
              onClick={() => handleDeleteMyComment(comment.id)}
              className="text-sm text-[var(--color-text-secondary)] cursor-pointer transition-colors duration-150 hover:text-red-400 flex-shrink-0"
            >
              삭제
            </div>
          </div>
        ))}
    </div>
  )

  const sectionRenderers = {
    info: renderAccountSection,
    wishlist: renderWishlistSection,
    alerts: renderAlertsSection,
    comments: renderCommentsSection,
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)] overflow-x-hidden">
      <div className="w-[1400px] max-w-full mx-auto p-5">
        <div className="flex justify-between">
          <div onClick={() => navigate('/')} className={linkButtonClass}>
            ← 메인으로
          </div>
          <div onClick={handleLogout} className={linkButtonClass}>
            로그아웃
          </div>
        </div>

        <div className="flex gap-8 mt-6">
          <aside className="w-[220px] flex-shrink-0">
            <div className={`${cardClass} p-2`}>
              {SECTIONS.map(({ key, label, icon: Icon }) => (
                <div
                  key={key}
                  onClick={() => setTab(key)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm cursor-pointer transition-colors duration-150 ${
                    tab === key
                      ? "font-bold text-[var(--color-text-heading)] bg-[var(--color-bg-row-hover)] before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-green-400"
                      : 'font-normal text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-alt)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </div>
              ))}
            </div>
          </aside>

          <div className="flex-1 min-w-0">{sectionRenderers[tab]()}</div>
        </div>
      </div>
    </div>
  )
}
