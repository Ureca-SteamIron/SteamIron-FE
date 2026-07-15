import { useNavigate } from 'react-router-dom'
import Box from '../shared/components/Box'

// 로그인 (새 페이지) — Discord OAuth 로그인
export default function LoginPage() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: '20px' }}>
      <Box onClick={() => navigate('/')} style={{ display: 'inline-block' }}>← 메인으로</Box>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '120px', gap: '20px' }}>
        <Box style={{ width: '400px', textAlign: 'center' }}>스팀다리미 로고</Box>
        {/* 실제로는 Discord authorize URL로 이동하게 될 버튼.
            지금은 로그인된 것처럼 메인으로 이동만 (메인의 login 자리가 프사/이름으로 바뀜) */}
        <Box
          onClick={() => navigate('/', { state: { loggedIn: true } })}
          style={{ width: '400px', textAlign: 'center' }}
        >
          Discord로 로그인
        </Box>
      </div>
    </div>
  )
}
