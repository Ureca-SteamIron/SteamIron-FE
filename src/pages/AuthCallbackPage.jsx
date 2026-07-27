import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DISCORD_REDIRECT_URI } from '../shared/constants/auth'
import { exchangeDiscordCode } from '../features/auth/api/authApi'
import { saveDiscordAccountSetupToken, saveSession } from '../shared/utils/auth'
import { useTheme } from '../shared/hooks/useTheme'
import darimiBlack from '../shared/resources/img/darimi_black.png'
import darimiWhite from '../shared/resources/img/darimi_white.png'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const theme = useTheme()
  const [errorMessage, setErrorMessage] = useState(null)
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    const code = new URLSearchParams(window.location.search).get('code')
    if (!code) {
      setErrorMessage('Discord 인증 정보가 없습니다. 다시 로그인해주세요.')
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
      .catch((error) => setErrorMessage(error.message))
  }, [navigate])

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-page)] text-[var(--color-text-primary)] p-5">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-8 py-6 text-sm text-center">
          {errorMessage}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-page)]">
      <div className="ironing-loader">
        <div className="ironing-loader__track">
          <span className="ironing-loader__steam" />
          <span className="ironing-loader__steam ironing-loader__steam--delay" />
          <span className="ironing-loader__steam ironing-loader__steam--delay2" />
          <img
            src={theme === 'dark' ? darimiWhite : darimiBlack}
            alt="다리미질 중"
            className="ironing-loader__iron"
          />
          <div className="ironing-loader__board" />
        </div>
      </div>
    </div>
  )
}
