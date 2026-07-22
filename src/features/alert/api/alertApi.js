// features/alert/api/alertApi.js
import axiosClient from '../../../shared/api/axiosClient'

// 내 가격 알림 목록
// BE: ApiResponse<List<PriceAlertResponse>>
//   PriceAlertResponse = { alertId, gameId, gameName, headerImage, targetPrice, currentPrice, isActive }
export async function getMyAlerts() {
  const { data } = await axiosClient.get('/api/v1/users/me/alerts')
  if (!data.success) throw new Error(data.message ?? '알림 목록 조회 실패')
  return data.data ?? []
}

// 알림 생성 — payload: { discountStartEnabled, targetDiscountEnabled, discountRate }
export async function createAlert(gameId, payload) {
  const { data } = await axiosClient.post(`/api/v1/games/${gameId}/alerts`, payload)
  if (!data.success) throw new Error(data.message ?? '알림 설정 실패')
}

// 목표가/방식 수정 — payload 형식은 생성과 동일
export async function updateAlert(alertId, payload) {
  const { data } = await axiosClient.patch(`/api/v1/alerts/${alertId}`, payload)
  if (!data.success) throw new Error(data.message ?? '알림 수정 실패')
}

// 알림 켜기/끄기 (하드 삭제 대신 활성 상태 토글)
export async function setAlertActive(alertId, active) {
  const { data } = await axiosClient.patch(`/api/v1/alerts/${alertId}/active`, { active })
  if (!data.success) throw new Error(data.message ?? '알림 상태 변경 실패')
}

// 종 알림 OFF — 이 게임의 저장된 알림 조건과 목표가를 모두 삭제
export async function deleteAlert(alertId) {
  const { data } = await axiosClient.delete(`/api/v1/alerts/${alertId}`)
  if (!data.success) throw new Error(data.message ?? '알림 설정 삭제 실패')
}
