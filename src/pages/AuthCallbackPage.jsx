import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '../shared/components/Box'
import { DISCORD_REDIRECT_URI } from '../shared/constants/auth'
import { exchangeDiscordCode } from '../features/auth/api/authApi'
import { saveDiscordAccountSetupToken, saveSession } from '../shared/utils/auth'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Discord 로그인 처리 중...')
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    const code = new URLSearchParams(window.location.search).get('code')
    if (!code) {
      setStatus('Discord 인증 정보가 없습니다. 다시 로그인해주세요.')
      return
    }

    exchangeDiscordCode(code, DISCORD_REDIRECT_URI)
      .then((data) => {
        if (data.accountSetupRequired) {
          saveDiscordAccountSetupToken(data.accountSetupToken)
          navigate('/auth/account-setup', { replace: true })
          return
        }

        saveSession(data)
        navigate('/', { replace: true })
      })
      .catch((error) => setStatus(error.message))
  }, [navigate])

  return (
    <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', marginTop: '120px' }}>
      <Box style={{ width: '400px', textAlign: 'center' }}>{status}</Box>
    </div>
  )
}
