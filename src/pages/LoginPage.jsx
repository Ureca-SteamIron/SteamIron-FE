import { useNavigate } from 'react-router-dom'
import Box from '../shared/components/Box'
import { buildDiscordAuthorizeUrl } from '../shared/constants/auth'

// 로그인 (새 페이지) — Discord OAuth 로그인
export default function LoginPage() {
  const navigate = useNavigate()

  // Discord 인증 페이지로 이동 → 승인하면 /auth/callback 으로 돌아온다 (흐름 ①)
  const handleDiscordLogin = () => {
    window.location.href = buildDiscordAuthorizeUrl()
  }

  return (
    <div style={{ padding: '20px' }}>
      <Box onClick={() => navigate('/')} style={{ display: 'inline-block' }}>← 메인으로</Box>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '120px', gap: '20px' }}>
        <Box style={{ width: '400px', textAlign: 'center' }}>스팀다리미 로고</Box>
        {/* Discord authorize URL로 이동 → 승인 후 /auth/callback 에서 토큰 발급 (BE 연동) */}
        <Box
          onClick={handleDiscordLogin}
          style={{ width: '400px', textAlign: 'center' }}
        >
          Discord로 로그인
        </Box>
      </div>
    </div>
  )
}
