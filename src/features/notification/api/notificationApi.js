// features/notification/api/notificationApi.js
// Discord 알림 전역 on/off (마스터 스위치). 게임별 목표가와 별개로, 이게 꺼져 있으면 알림이 안 간다.
import axiosClient from '../../../shared/api/axiosClient'

// 현재 on/off 조회 → boolean
export async function getDiscordNotificationSetting() {
  const { data } = await axiosClient.get('/api/v1/users/me/notification-settings/discord')
  if (!data.success) throw new Error(data.message ?? '알림 설정 조회 실패')
  return data.data?.enabled ?? false
}

// on/off 변경
export async function updateDiscordNotificationSetting(enabled) {
  const { data } = await axiosClient.patch('/api/v1/users/me/notification-settings/discord', { enabled })
  if (!data.success) throw new Error(data.message ?? '알림 설정 변경 실패')
}
