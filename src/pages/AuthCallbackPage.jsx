import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '../shared/components/Box'
import { API_BASE_URL } from '../shared/constants/auth'
import { saveSession } from '../shared/utils/auth'

// Discord가 인증 후 code를 붙여 되돌려보내는 착지 페이지 (/auth/callback).
// URL의 code를 꺼내 백엔드로 보내고, 받은 토큰을 저장한 뒤 메인으로 이동한다.
export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('로그인 처리 중...')
  const calledRef = useRef(false) // StrictMode에서 두 번 실행돼 code가 두 번 제출되는 것 방지 (code는 1회용)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    const code = new URLSearchParams(window.location.search).get('code')
    if (!code) {
      setStatus('인증 code가 없습니다. 다시 로그인해주세요.')
      return
    }

    fetch(`${API_BASE_URL}/api/auth/login/discord`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`로그인 실패 (${res.status})`)
        return res.json()
      })
      .then((data) => {
        // 토큰 + 표시용 유저 정보(username/avatarUrl)를 함께 저장 (지금은 localStorage)
        saveSession(data)
        setStatus(`환영합니다, ${data.username}님! 🎉 메인으로 이동합니다...`)
        setTimeout(() => navigate('/'), 1200)
      })
      .catch((err) => setStatus(err.message))
  }, [navigate])

  return (
    <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', marginTop: '120px' }}>
      <Box style={{ width: '400px', textAlign: 'center' }}>{status}</Box>
    </div>
  )
}
