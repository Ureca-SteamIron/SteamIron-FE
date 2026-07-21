import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '../shared/components/Box'
import { getSession } from '../shared/utils/auth'
import { getMyAlerts, updateAlert, setAlertActive } from '../features/alert/api/alertApi'
import {
  getDiscordNotificationSetting,
  updateDiscordNotificationSetting,
} from '../features/notification/api/notificationApi'
import AlertForm from '../features/alert/components/AlertForm'

// 알림: Discord 전역 on/off / 내 가격 알림 목록(목표가·현재가·도달여부) / 수정·켜기끄기
export default function NotificationsPage() {
  const navigate = useNavigate()
  const user = getSession()

  const [enabled, setEnabled] = useState(false) // Discord 전역 알림 on/off
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null) // 수정 폼 열려있는 알림 id

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([getDiscordNotificationSetting(), getMyAlerts()])
      .then(([isEnabled, list]) => {
        setEnabled(isEnabled)
        setAlerts(list)
      })
      .catch((err) => setError(err.response?.data?.message ?? err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (user) load()
    // user는 세션 스냅샷이라 마운트 시 1회만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Discord 전역 알림 on/off
  const handleToggleGlobal = () => {
    const next = !enabled
    updateDiscordNotificationSetting(next)
      .then(() => setEnabled(next))
      .catch((err) => alert(err.response?.data?.message ?? err.message))
  }

  // 개별 알림 켜기/끄기 (삭제 대신)
  const handleToggleAlert = (alertId, nextActive) => {
    setAlertActive(alertId, nextActive)
      .then(load)
      .catch((err) => alert(err.response?.data?.message ?? err.message))
  }

  // 목표가/방식 수정
  const handleEdit = (alertId, payload) => {
    updateAlert(alertId, payload)
      .then(() => {
        setEditingId(null)
        load()
      })
      .catch((err) => alert(err.response?.data?.message ?? err.message))
  }

  // 비로그인
  if (!user) {
    return (
      <div style={{ padding: '20px' }}>
        <Box onClick={() => navigate('/')} style={{ display: 'inline-block' }}>← 메인으로</Box>
        <Box style={{ marginTop: '20px' }}>
          로그인이 필요합니다.{' '}
          <span onClick={() => navigate('/login')} style={{ textDecoration: 'underline', cursor: 'pointer' }}>
            로그인
          </span>
        </Box>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <Box onClick={() => navigate('/')} style={{ display: 'inline-block' }}>← 메인으로</Box>

      {/* Discord 전역 알림 on/off (마스터 스위치) */}
      <Box style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontWeight: 'bold' }}>Discord 알림 받기</span>
        <label style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={enabled} onChange={handleToggleGlobal} /> {enabled ? '켜짐' : '꺼짐'}
        </label>
        <span style={{ color: '#888', fontSize: '13px' }}>
          꺼두면 목표가에 도달해도 알림이 오지 않습니다
        </span>
      </Box>

      {/* 내 가격 알림 목록 */}
      <Box style={{ marginTop: '20px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>내 가격 알림</div>

        {loading && <div>불러오는 중...</div>}
        {error && <div>에러: {error}</div>}
        {!loading && !error && alerts.length === 0 && (
          <div>설정한 알림이 없습니다. 게임 상세 페이지에서 알림을 설정해보세요.</div>
        )}

        {alerts.map((a) => {
          const reached =
            a.currentPrice != null && a.targetPrice != null && a.currentPrice <= a.targetPrice
          return (
            <Box key={a.alertId} style={{ marginTop: '10px', opacity: a.isActive ? 1 : 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/games/${a.gameId}`)}>
                  {a.gameName}
                </div>
                <div>목표가 {a.targetPrice?.toLocaleString()}원</div>
                <div>
                  현재 {a.currentPrice?.toLocaleString()}원 {a.isActive && reached ? '✅ 도달' : ''}
                </div>
                <label style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={a.isActive}
                    onChange={() => handleToggleAlert(a.alertId, !a.isActive)}
                  />{' '}
                  {a.isActive ? '켜짐' : '꺼짐'}
                </label>
                <div
                  onClick={() => setEditingId(editingId === a.alertId ? null : a.alertId)}
                  style={{ cursor: 'pointer' }}
                >
                  수정
                </div>
              </div>

              {editingId === a.alertId && (
                <AlertForm
                  onSubmit={(payload) => handleEdit(a.alertId, payload)}
                  onCancel={() => setEditingId(null)}
                />
              )}
            </Box>
          )
        })}
      </Box>
    </div>
  )
}
