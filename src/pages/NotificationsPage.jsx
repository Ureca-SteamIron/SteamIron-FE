import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaBell, FaDiscord } from 'react-icons/fa'
import Box from '../shared/components/Box'
import { getSession } from '../shared/utils/auth'
import DiscordInviteModal from '../features/notification/components/DiscordInviteModal'
import {
  getDiscordNotificationSetting,
  getUnreadNotificationCount,
  getUserNotifications,
  markNotificationAsRead,
  updateDiscordNotificationSetting,
} from '../features/notification/api/notificationApi'

const PAGE_SIZE = 20

function formatPrice(price) {
  return price == null ? '-' : `${price.toLocaleString()}원`
}

function getNotificationTitle(notification) {
  if (notification.notificationType === 'DISCOUNT_START') {
    return `${notification.gameName} 할인이 시작됐어요`
  }
  return `${notification.gameName}이(가) 목표 가격에 도달했어요`
}

function getNotificationDescription(notification) {
  const current = `현재 ${formatPrice(notification.currentPrice)}`
  const discount = notification.discountPercent == null
    ? ''
    : ` · ${notification.discountPercent}% 할인`

  if (notification.notificationType === 'TARGET_PRICE') {
    return `목표 ${formatPrice(notification.targetPrice)} · ${current}${discount}`
  }
  return `${current}${discount}`
}

function formatCreatedAt(createdAt) {
  if (!createdAt) return ''
  return new Date(createdAt).toLocaleString('ko-KR')
}

const cardClass = 'rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)]'
const linkButtonClass =
  'inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] cursor-pointer transition-colors duration-150 hover:bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-border-hover)]'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const user = getSession()

  const [discordEnabled, setDiscordEnabled] = useState(false)
  const [discordUpdating, setDiscordUpdating] = useState(false)
  const [discordInviteOpen, setDiscordInviteOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [pageInfo, setPageInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async (page = 0) => {
    setLoading(true)
    setError(null)

    try {
      const [enabled, history, count] = await Promise.all([
        getDiscordNotificationSetting(),
        getUserNotifications(page, PAGE_SIZE),
        getUnreadNotificationCount(),
      ])

      setDiscordEnabled(enabled)
      setNotifications(history?.content ?? [])
      setPageInfo(history)
      setUnreadCount(count)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) load()
    // 로그인 여부는 페이지 진입 시 한 번 확인한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDiscordToggle = async () => {
    const next = !discordEnabled
    setDiscordUpdating(true)

    try {
      await updateDiscordNotificationSetting(next)
      setDiscordEnabled(next)
      if (next) setDiscordInviteOpen(true)
    } catch (err) {
      alert(err.response?.data?.message ?? err.message)
    } finally {
      setDiscordUpdating(false)
    }
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id)
        setNotifications((current) => current.map((item) => (
          item.id === notification.id ? { ...item, read: true } : item
        )))
        setUnreadCount((current) => Math.max(0, current - 1))
      } catch (err) {
        alert(err.response?.data?.message ?? err.message)
        return
      }
    }

    navigate(`/games/${notification.gameId}`)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
        <div className="w-[min(640px,calc(100vw-40px))] mx-auto p-5">
          <div onClick={() => navigate('/')} className={`${linkButtonClass} inline-flex`}>
            ← 메인으로
          </div>

          <div className={`${cardClass} mt-5 p-8 text-center text-sm text-[var(--color-text-secondary)]`}>
            로그인이 필요합니다.{' '}
            <span
              onClick={() => navigate('/login')}
              className="text-green-400 font-semibold cursor-pointer hover:text-green-300"
            >
              로그인
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
      <div className="w-[min(640px,calc(100vw-40px))] mx-auto p-5">
        <div className="flex items-center justify-between">
          <div onClick={() => navigate('/')} className={linkButtonClass}>
            ← 메인으로
          </div>
          <h1 className="flex items-center gap-2 text-lg font-bold text-[var(--color-text-heading)]">
            <FaBell size={18} className="text-green-400" />
            알림
          </h1>
        </div>

        <div className={`${cardClass} mt-5 p-5 flex items-center flex-wrap gap-3`}>
          <FaDiscord size={22} className="text-[var(--color-text-secondary)] flex-shrink-0" />
          <span className="font-bold text-sm text-[var(--color-text-heading)]">Discord 알림 받기</span>

          <div
            role="switch"
            aria-checked={discordEnabled}
            aria-label="Discord 알림 받기"
            onClick={() => !discordUpdating && handleDiscordToggle()}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-150 ${
              discordUpdating ? 'cursor-wait opacity-60' : 'cursor-pointer'
            } ${discordEnabled ? 'bg-green-400' : 'bg-[var(--color-bg-input)]'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-150 ${
                discordEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </div>

          <span className="w-full text-[13px] text-[var(--color-text-tertiary)]">
            웹 알림은 항상 저장되며, 켜면 같은 알림을 Discord로도 받아요
          </span>
        </div>

        {discordInviteOpen && (
          <DiscordInviteModal onClose={() => setDiscordInviteOpen(false)} />
        )}

        <div className={`${cardClass} mt-5 p-5`}>
          <div className="flex items-center justify-between mb-4">
            <strong className="text-[var(--color-text-heading)]">알림 내역</strong>
            {unreadCount > 0 && (
              <span className="rounded-full bg-green-400 text-[var(--color-text-on-accent)] text-xs font-semibold px-2.5 py-1">
                읽지 않음 {unreadCount}개
              </span>
            )}
          </div>

          {loading && (
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-alt)] text-center text-[var(--color-text-secondary)] text-sm">
              알림을 불러오는 중...
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-alt)] text-center text-red-400 text-sm">
              오류: {error}
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div className="py-10 text-center text-[var(--color-text-secondary)] text-sm">
              아직 도착한 알림이 없습니다.
            </div>
          )}

          {!loading && !error && notifications.map((notification) => (
            <Box
              key={notification.id}
              noDefaultStyle
              onClick={() => handleNotificationClick(notification)}
              className={`mt-2.5 first:mt-0 p-3.5 rounded-xl border cursor-pointer transition-colors duration-150 ${
                notification.read
                  ? 'border-[var(--color-border)] bg-transparent hover:bg-[var(--color-bg-surface-alt)]'
                  : 'border-[var(--color-border-hover)] bg-[var(--color-bg-surface-alt)] hover:bg-[var(--color-bg-row-hover)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {!notification.read && (
                  <span
                    aria-label="읽지 않은 알림"
                    title="읽지 않은 알림"
                    className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"
                  />
                )}
                <strong className="flex-1 min-w-0 text-sm text-[var(--color-text-heading)] whitespace-nowrap overflow-hidden text-ellipsis">
                  {getNotificationTitle(notification)}
                </strong>
                <span className="flex-shrink-0 text-xs text-[var(--color-text-tertiary)]">
                  {formatCreatedAt(notification.createdAt)}
                </span>
              </div>
              <div className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
                {getNotificationDescription(notification)}
              </div>
            </Box>
          ))}

          {!loading && !error && pageInfo?.totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-5">
              <button
                type="button"
                disabled={pageInfo.currentPage <= 1}
                onClick={() => load(pageInfo.currentPage - 2)}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors duration-150 ${
                  pageInfo.currentPage <= 1
                    ? 'cursor-default opacity-30 border-[var(--color-border)] text-[var(--color-text-secondary)]'
                    : 'cursor-pointer border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-row-hover)] hover:border-[var(--color-border-hover)]'
                }`}
              >
                이전
              </button>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {pageInfo.currentPage} / {pageInfo.totalPages}
              </span>
              <button
                type="button"
                disabled={pageInfo.currentPage >= pageInfo.totalPages}
                onClick={() => load(pageInfo.currentPage)}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors duration-150 ${
                  pageInfo.currentPage >= pageInfo.totalPages
                    ? 'cursor-default opacity-30 border-[var(--color-border)] text-[var(--color-text-secondary)]'
                    : 'cursor-pointer border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-row-hover)] hover:border-[var(--color-border-hover)]'
                }`}
              >
                다음
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
