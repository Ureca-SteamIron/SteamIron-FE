import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '../shared/components/Box'
import { buildDiscordAuthorizeUrl } from '../shared/constants/auth'
import { setupDiscordAccount } from '../features/auth/api/authApi'
import {
  clearDiscordAccountSetupToken,
  getDiscordAccountSetupToken,
  saveSession,
} from '../shared/utils/auth'

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  border: '2px solid black',
  fontSize: '16px',
}

export default function DiscordAccountSetupPage() {
  const navigate = useNavigate()
  const [setupToken] = useState(getDiscordAccountSetupToken)
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setSubmitting(true)
    try {
      const session = await setupDiscordAccount(setupToken, loginId.trim(), password)
      clearDiscordAccountSetupToken()
      saveSession(session)
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!setupToken) {
    return (
      <div style={{ width: 'min(440px, calc(100vw - 40px))', margin: '0 auto', textAlign: 'center' }}>
        <Box>계정 설정 인증이 없습니다. Discord 인증을 다시 진행해주세요.</Box>
        <button
          type="button"
          onClick={() => { window.location.href = buildDiscordAuthorizeUrl() }}
          style={{ marginTop: '16px', padding: '12px 18px' }}
        >
          Discord 인증 다시 하기
        </button>
      </div>
    )
  }

  return (
    <main style={{ width: 'min(440px, calc(100vw - 40px))', margin: '0 auto', padding: '20px' }}>
      <Box onClick={() => navigate('/login')} style={{ display: 'inline-block' }}>
        ← 로그인으로
      </Box>

      <section style={{ marginTop: '60px' }}>
        <Box style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: '4px 0 10px' }}>서비스 계정 설정</h2>
          <p style={{ margin: 0, color: '#999' }}>일반 로그인에 사용할 아이디와 비밀번호를 정해주세요.</p>
        </Box>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <label>
            <span style={{ display: 'block', marginBottom: '7px' }}>아이디</span>
            <input value={loginId} onChange={(event) => setLoginId(event.target.value)} minLength={4} maxLength={30} autoComplete="username" required style={inputStyle} />
          </label>
          <label>
            <span style={{ display: 'block', marginBottom: '7px' }}>비밀번호</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={64} autoComplete="new-password" required style={inputStyle} />
          </label>
          <label>
            <span style={{ display: 'block', marginBottom: '7px' }}>비밀번호 확인</span>
            <input type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} minLength={8} maxLength={64} autoComplete="new-password" required style={inputStyle} />
          </label>

          {error && <p role="alert" style={{ color: '#ff7777', margin: 0 }}>{error}</p>}

          <button type="submit" disabled={submitting} style={{ padding: '13px', border: '2px solid black', fontSize: '17px', cursor: 'pointer' }}>
            {submitting ? '설정 중...' : '계정 설정하고 시작하기'}
          </button>
        </form>
      </section>
    </main>
  )
}
