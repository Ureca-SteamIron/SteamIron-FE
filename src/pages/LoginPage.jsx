import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '../shared/components/Box'
import { buildDiscordAuthorizeUrl } from '../shared/constants/auth'
import { loginWithCredentials } from '../features/auth/api/authApi'
import { saveSession } from '../shared/utils/auth'

const inputClass =
  'w-full box-border bg-[#26262c] text-[#e8e8ea] rounded-lg border border-[#2c2c33] px-3.5 py-3 text-base outline-none focus:border-[#4a4a52] placeholder:text-[#7a7a82]'

const primaryButtonClass =
  'w-full py-3.5 rounded-xl text-[15px] font-semibold text-[#0e0e10] bg-green-400 transition-colors duration-150 hover:bg-green-300 disabled:cursor-default disabled:opacity-50'

const secondaryButtonClass =
  'w-full py-3.5 rounded-xl text-[15px] text-[#e8e8ea] border border-[#2c2c33] bg-transparent cursor-pointer transition-colors duration-150 hover:bg-[#22222a] hover:border-[#3a3a42]'

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
    <div className="min-h-screen bg-[#0e0e10] text-[#e8e8ea]">
      <main className="w-[min(640px,calc(100vw-40px))] mx-auto p-5">
        <div
          onClick={() => navigate('/')}
          className="inline-flex items-center rounded-xl border border-[#2c2c33] bg-[#1b1b1f] px-4 py-2.5 text-sm text-[#e8e8ea] cursor-pointer transition-colors duration-150 hover:bg-[#22222a] hover:border-[#3a3a42]"
        >
          ← 메인으로
        </div>

        <section className="mt-[90px]">
          <div className="text-center text-2xl font-bold text-[#f2f2f4] mb-7">
            스팀다리미 로그인
          </div>

          <form onSubmit={handleLocalLogin} className="grid gap-3">
            <label>
              <span className="block mb-1.5 text-sm text-[#e8e8ea]">아이디</span>
              <input
                value={loginId}
                onChange={(event) => setLoginId(event.target.value)}
                autoComplete="username"
                maxLength={30}
                required
                className={inputClass}
              />
            </label>

            <label>
              <span className="block mb-1.5 text-sm text-[#e8e8ea]">비밀번호</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className={inputClass}
              />
            </label>

            {error && (
              <p role="alert" className="text-red-400 text-sm my-0.5">
                {error}
              </p>
            )}

            <button type="submit" disabled={submitting} className={primaryButtonClass}>
              {submitting ? '로그인 중...' : '스팀다리미 로그인'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <span className="h-px bg-[#2c2c33] flex-1" />
            <span className="text-sm text-[#7a7a82]">또는</span>
            <span className="h-px bg-[#2c2c33] flex-1" />
          </div>

          <button type="button" onClick={handleDiscordLogin} className={secondaryButtonClass}>
            Discord로 로그인
          </button>
          <p className="text-center text-[#7a7a82] text-sm mt-3">
            처음 이용한다면 Discord 인증 후 서비스 아이디를 설정합니다.
          </p>
        </section>
      </main>
    </div>
  )
}