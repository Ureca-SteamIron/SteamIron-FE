import { useNavigate } from 'react-router-dom'
import Box from '../shared/components/Box'
import { clearSession } from '../shared/utils/auth'

// 마이페이지: 내 정보 조회/수정 / 관심목록 / 내 커뮤니티 글 / 회원탈퇴 / 로그아웃
export default function MyPage() {
  const navigate = useNavigate()

  // 로그아웃: localStorage 세션을 지워야 진짜 로그아웃 (navigate만으론 세션이 남아 계속 로그인 상태)
  const handleLogout = () => {
    clearSession()
    navigate('/')
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box onClick={() => navigate('/')} style={{ display: 'inline-block' }}>← 메인으로</Box>
        <Box onClick={handleLogout} style={{ display: 'inline-block' }}>로그아웃</Box>
      </div>

      {/* 내 정보 */}
      <Box style={{ marginTop: '20px' }}>
        <div>내 정보 (닉네임 등)</div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <Box>개인정보 수정</Box>
          <Box>회원탈퇴</Box>
        </div>
      </Box>

      {/* 관심목록 — 게임 누르면 상세로 */}
      <Box style={{ marginTop: '20px' }}>
        <div>관심목록</div>
        {[1, 2].map((gameId) => (
          <Box
            key={gameId}
            onClick={() => navigate(`/games/${gameId}`)}
            style={{ display: 'flex', gap: '20px', marginTop: '10px' }}
          >
            <div>게임 이름 {gameId}</div>
            <div>관심목록 해제</div>
          </Box>
        ))}
      </Box>

      {/* 내 커뮤니티 글 */}
      <Box style={{ marginTop: '20px' }}>
        <div>내 커뮤니티 글 (내가 쓴 글 / 댓글 목록)</div>
        <Box style={{ marginTop: '10px' }}>내 댓글 1 (수정/삭제)</Box>
        <Box style={{ marginTop: '10px' }}>내 댓글 2 (수정/삭제)</Box>
      </Box>
    </div>
  )
}
