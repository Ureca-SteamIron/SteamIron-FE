import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildDiscordAuthorizeUrl } from '../shared/constants/auth'
import { setupDiscordAccount } from '../features/auth/api/authApi'
import {
  clearDiscordAccountSetupToken,
  getDiscordAccountSetupToken,
  saveSession,
} from '../shared/utils/auth'

const inputClass =
  'w-full box-border bg-[var(--color-bg-input)] text-[var(--color-text-primary)] rounded-lg border border-[var(--color-border)] px-3.5 py-3 text-base outline-none focus:border-[var(--color-border-strong)] placeholder:text-[var(--color-text-tertiary)]'

const primaryButtonClass =
  'w-full py-3.5 rounded-xl text-[15px] font-semibold text-[var(--color-text-on-accent)] bg-green-400 transition-colors duration-150 hover:bg-green-300 disabled:cursor-default disabled:opacity-50'

const backLinkClass =
  'inline-flex items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] cursor-pointer transition-colors duration-150 hover:bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-border-hover)]'

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
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-page)] text-[var(--color-text-primary)] p-5">
        <div className="w-[min(440px,calc(100vw-40px))] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-8 text-center">
          <p className="text-sm text-[var(--color-text-secondary)] m-0">
            계정 설정 인증이 없습니다. Discord 인증을 다시 진행해주세요.
          </p>
          <button
            type="button"
            onClick={() => { window.location.href = buildDiscordAuthorizeUrl() }}
            className={`${primaryButtonClass} mt-5`}
          >
            Discord 인증 다시 하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
      <main className="w-[min(640px,calc(100vw-40px))] mx-auto p-5">
        <div onClick={() => navigate('/login')} className={backLinkClass}>
          ← 로그인으로
        </div>

        <section className="mt-[90px]">
          <div className="text-center mb-7">
            <div className="text-2xl font-bold text-[var(--color-text-heading)]">서비스 계정 설정</div>
            <p className="mt-2.5 text-sm text-[var(--color-text-tertiary)]">
              일반 로그인에 사용할 아이디와 비밀번호를 정해주세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-3">
            <label>
              <span className="block mb-1.5 text-sm text-[var(--color-text-primary)]">아이디</span>
              <input
                value={loginId}
                onChange={(event) => setLoginId(event.target.value)}
                minLength={4}
                maxLength={30}
                autoComplete="username"
                required
                className={inputClass}
              />
            </label>

            <label>
              <span className="block mb-1.5 text-sm text-[var(--color-text-primary)]">비밀번호</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                maxLength={64}
                autoComplete="new-password"
                required
                className={inputClass}
              />
            </label>

            <label>
              <span className="block mb-1.5 text-sm text-[var(--color-text-primary)]">비밀번호 확인</span>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                minLength={8}
                maxLength={64}
                autoComplete="new-password"
                required
                className={inputClass}
              />
            </label>

            {error && (
              <p role="alert" className="text-red-400 text-sm my-0.5">
                {error}
              </p>
            )}

            <button type="submit" disabled={submitting} className={`${primaryButtonClass} mt-1.5`}>
              {submitting ? '설정 중...' : '계정 설정하고 시작하기'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
