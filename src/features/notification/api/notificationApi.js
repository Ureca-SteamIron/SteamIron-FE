import axiosClient from '../../../shared/api/axiosClient'

export async function getDiscordNotificationSetting() {
  const { data } = await axiosClient.get('/api/v1/users/me/notification-settings/discord')
  if (!data.success) throw new Error(data.message ?? 'Discord 알림 설정 조회 실패')
  return data.data?.enabled ?? false
}

export async function updateDiscordNotificationSetting(enabled) {
  const { data } = await axiosClient.patch('/api/v1/users/me/notification-settings/discord', { enabled })
  if (!data.success) throw new Error(data.message ?? 'Discord 알림 설정 변경 실패')
}

export async function getUserNotifications(page = 0, size = 20) {
  const { data } = await axiosClient.get('/api/v1/users/me/notifications', {
    params: { page, size },
  })
  if (!data.success) throw new Error(data.message ?? '알림 내역 조회 실패')
  return data.data
}

export async function getUnreadNotificationCount() {
  const { data } = await axiosClient.get('/api/v1/users/me/notifications/unread-count')
  if (!data.success) throw new Error(data.message ?? '새 알림 개수 조회 실패')
  return data.data?.unreadCount ?? 0
}

export async function markNotificationAsRead(notificationId) {
  const { data } = await axiosClient.patch(
    `/api/v1/users/me/notifications/${notificationId}/read`,
  )
  if (!data.success) throw new Error(data.message ?? '알림 읽음 처리 실패')
}
