import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '../shared/components/Box'
import { buildDiscordAuthorizeUrl } from '../shared/constants/auth'
import { loginWithCredentials } from '../features/auth/api/authApi'
import { saveSession } from '../shared/utils/auth'

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  border: '2px solid black',
  fontSize: '16px',
}

const buttonStyle = {
  width: '100%',
  padding: '13px',
  border: '2px solid black',
  background: 'transparent',
  color: 'inherit',
  fontSize: '17px',
  cursor: 'pointer',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLocalLogin = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const session = await loginWithCredentials(loginId.trim(), password)
      saveSession(session)
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDiscordLogin = () => {
    window.location.href = buildDiscordAuthorizeUrl()
  }

  return (
    <main style={{ width: 'min(640px, calc(100vw - 40px))', padding: '20px' }}>
      <Box onClick={() => navigate('/')} style={{ display: 'inline-block' }}>
        ← 메인으로
      </Box>

      <section style={{ marginTop: '90px' }}>
        <Box style={{ textAlign: 'center', fontSize: '22px', marginBottom: '28px' }}>
          스팀다리미 로그인
        </Box>

        <form onSubmit={handleLocalLogin} style={{ display: 'grid', gap: '12px' }}>
          <label>
            <span style={{ display: 'block', marginBottom: '7px' }}>아이디</span>
            <input
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              autoComplete="username"
              maxLength={30}
              required
              style={inputStyle}
            />
          </label>

          <label>
            <span style={{ display: 'block', marginBottom: '7px' }}>비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              style={inputStyle}
            />
          </label>

          {error && (
            <p role="alert" style={{ color: '#ff7777', margin: '2px 0' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} style={buttonStyle}>
            {submitting ? '로그인 중...' : '스팀다리미 로그인'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
          <span style={{ height: '1px', background: '#777', flex: 1 }} />
          <span>또는</span>
          <span style={{ height: '1px', background: '#777', flex: 1 }} />
        </div>

        <button type="button" onClick={handleDiscordLogin} style={buttonStyle}>
          Discord로 로그인
        </button>
        <p style={{ textAlign: 'center', color: '#999', fontSize: '14px' }}>
          처음 이용한다면 Discord 인증 후 서비스 아이디를 설정합니다.
        </p>
      </section>
    </main>
  )
}
