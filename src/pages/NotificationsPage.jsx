import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '../shared/components/Box'
import { getSession } from '../shared/utils/auth'
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

export default function NotificationsPage() {
  const navigate = useNavigate()
  const user = getSession()

  const [discordEnabled, setDiscordEnabled] = useState(false)
  const [discordUpdating, setDiscordUpdating] = useState(false)
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
      <div style={{ padding: '20px' }}>
        <Box onClick={() => navigate('/')} style={{ display: 'inline-block' }}>← 메인으로</Box>
        <Box style={{ marginTop: '20px' }}>
          로그인이 필요합니다.{' '}
          <span
            onClick={() => navigate('/login')}
            style={{ textDecoration: 'underline', cursor: 'pointer' }}
          >
            로그인
          </span>
        </Box>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', width: 'min(840px, calc(100vw - 40px))' }}>
      <Box onClick={() => navigate('/')} style={{ display: 'inline-block' }}>← 메인으로</Box>

      <Box
        style={{
          marginTop: '20px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <span style={{ fontWeight: 'bold' }}>Discord 알림 받기</span>
        <label style={{ cursor: discordUpdating ? 'wait' : 'pointer' }}>
          <input
            type="checkbox"
            checked={discordEnabled}
            disabled={discordUpdating}
            onChange={handleDiscordToggle}
          />{' '}
          {discordEnabled ? '켜짐' : '꺼짐'}
        </label>
        <span style={{ color: '#888', fontSize: '13px' }}>
          웹 알림은 항상 저장되며, 켜면 같은 알림을 Discord로도 받아요
        </span>
      </Box>

      <Box style={{ marginTop: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <strong>알림 내역</strong>
          <span style={{ color: '#777', fontSize: '13px' }}>
            읽지 않음 {unreadCount}개
          </span>
        </div>

        {loading && <div>알림을 불러오는 중...</div>}
        {error && <div style={{ color: '#c62828' }}>오류: {error}</div>}

        {!loading && !error && notifications.length === 0 && (
          <div style={{ color: '#777', padding: '24px 0', textAlign: 'center' }}>
            아직 도착한 알림이 없습니다.
          </div>
        )}

        {!loading && !error && notifications.map((notification) => (
          <Box
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            style={{
              marginTop: '10px',
              background: notification.read ? 'transparent' : 'rgba(255, 255, 255, 0.08)',
              borderWidth: notification.read ? '2px' : '3px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {!notification.read && (
                <span
                  aria-label="읽지 않은 알림"
                  title="읽지 않은 알림"
                  style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }}
                />
              )}
              <strong style={{ flex: 1 }}>{getNotificationTitle(notification)}</strong>
              <span style={{ color: '#888', fontSize: '12px' }}>
                {formatCreatedAt(notification.createdAt)}
              </span>
            </div>
            <div style={{ marginTop: '8px', color: '#aaa' }}>
              {getNotificationDescription(notification)}
            </div>
          </Box>
        ))}

        {!loading && !error && pageInfo?.totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              marginTop: '16px',
            }}
          >
            <button
              type="button"
              disabled={pageInfo.currentPage <= 1}
              onClick={() => load(pageInfo.currentPage - 2)}
            >
              이전
            </button>
            <span>{pageInfo.currentPage} / {pageInfo.totalPages}</span>
            <button
              type="button"
              disabled={pageInfo.currentPage >= pageInfo.totalPages}
              onClick={() => load(pageInfo.currentPage)}
            >
              다음
            </button>
          </div>
        )}
      </Box>
    </div>
  )
}
