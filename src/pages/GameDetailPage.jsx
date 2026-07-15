import { useNavigate, useParams } from 'react-router-dom'
import Box from '../shared/components/Box'

// 상세페이지: 상세정보(썸네일/가격) / 가격 히스토리 차트 / AI 요약 / 커뮤니티(댓글)
export default function GameDetailPage() {
  const navigate = useNavigate()
  const { gameId } = useParams()

  return (
    <div style={{ padding: '20px' }}>
      <Box onClick={() => navigate('/')} style={{ display: 'inline-block' }}>← 메인으로</Box>

      {/* 상세정보 */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <Box style={{ width: '300px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          썸네일
        </Box>
        <Box style={{ flex: 1 }}>
          <div>게임 이름 {gameId}</div>
          <div>가격 / 할인율</div>
          <Box onClick={() => navigate('/notifications')} style={{ display: 'inline-block', marginTop: '10px' }}>
            가격 변동 알림 설정
          </Box>
        </Box>
      </div>

      {/* 가격 히스토리 */}
      <Box style={{ height: '200px', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        가격 변동 (할인) 차트
      </Box>

      {/* AI 요약 */}
      <Box style={{ height: '120px', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        AI 요약 (게임정보, 할인 정보 등)
      </Box>

      {/* 커뮤니티 */}
      <Box style={{ marginTop: '20px' }}>
        <div>커뮤니티 (댓글 / 대댓글)</div>
        <Box style={{ marginTop: '10px' }}>댓글 1</Box>
        <Box style={{ marginTop: '10px' }}>댓글 2</Box>
        <Box style={{ marginTop: '10px' }}>댓글 입력</Box>
      </Box>
    </div>
  )
}
