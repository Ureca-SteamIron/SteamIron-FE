import { useNavigate } from 'react-router-dom'
import Box from '../shared/components/Box'

// 알림: 알림 내역 / 가격 변동 알림 토글 / 지정가 수정·삭제 / Discord 알림
export default function NotificationsPage() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: '20px' }}>
      <Box onClick={() => navigate('/')} style={{ display: 'inline-block' }}>← 메인으로</Box>

      <Box style={{ marginTop: '20px' }}>
        <div>가격 변동 알림 (토글 on/off) / Discord 알림</div>
      </Box>

      <Box style={{ marginTop: '20px' }}>
        <div>알림 내역</div>
        {[1, 2, 3].map((n) => (
          <Box key={n} style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <div style={{ flex: 1 }}>알림 {n} — 지정 목표가 도달</div>
            <div>지정가 수정</div>
            <div>삭제</div>
          </Box>
        ))}
      </Box>
    </div>
  )
}
