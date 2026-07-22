import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '../shared/components/Box'
import { clearSession, getSession } from '../shared/utils/auth'
import { getMyAccount, updateCredentials } from '../features/user/api/userApi'

// 마이페이지: 내 정보 조회/수정 / 관심목록 / 내 커뮤니티 글 / 회원탈퇴 / 로그아웃
export default function MyPage() {
  const navigate = useNavigate()
  const user = getSession()

  // 로그아웃: localStorage 세션을 지워야 진짜 로그아웃 (navigate만으론 세션이 남아 계속 로그인 상태)
  const handleLogout = () => {
    clearSession()
    navigate('/')
  }

  // 아이디/비밀번호 수정 폼
  const [editing, setEditing] = useState(false)
  const [loginId, setLoginId] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // 수정 폼 열 때 현재 아이디를 불러와 미리 채운다
  const openEdit = () => {
    setMsg('')
    setEditing(true)
    getMyAccount()
      .then((account) => {
        setLoginId(account.loginId ?? '')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      })
      .catch((err) => setMsg(err.response?.data?.message ?? err.message))
  }

  const handleSave = () => {
    if (newPassword && newPassword !== confirmPassword) {
      setMsg('새 비밀번호가 일치하지 않습니다.')
      return
    }
    setSaving(true)
    setMsg('')
    updateCredentials({ loginId, currentPassword, newPassword: newPassword || null })
      .then(() => {
        setMsg('수정되었습니다.')
        setEditing(false)
      })
      .catch((err) => setMsg(err.response?.data?.message ?? err.message))
      .finally(() => setSaving(false))
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box onClick={() => navigate('/')} style={{ display: 'inline-block' }}>← 메인으로</Box>
        <Box onClick={handleLogout} style={{ display: 'inline-block' }}>로그아웃</Box>
      </div>

      {/* 내 정보 */}
      <Box style={{ marginTop: '20px' }}>
        <div>내 정보 {user?.username ? `(${user.username})` : ''}</div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          {user ? (
            <Box onClick={() => (editing ? setEditing(false) : openEdit())} style={{ cursor: 'pointer' }}>
              아이디/비밀번호 수정
            </Box>
          ) : (
            <Box onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>로그인</Box>
          )}
          <Box>회원탈퇴</Box>
        </div>

        {editing && (
          <Box style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '360px' }}>
            <label>
              아이디
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                style={{ width: '100%' }}
              />
            </label>
            <label>
              현재 비밀번호
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{ width: '100%' }}
              />
            </label>
            <label>
              새 비밀번호 <span style={{ color: '#888', fontSize: '12px' }}>(비우면 그대로)</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%' }}
              />
            </label>
            <label>
              새 비밀번호 확인
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%' }}
              />
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Box onClick={saving ? undefined : handleSave} style={{ cursor: 'pointer' }}>
                {saving ? '저장 중...' : '저장'}
              </Box>
              <Box onClick={() => setEditing(false)} style={{ cursor: 'pointer' }}>취소</Box>
            </div>
          </Box>
        )}

        {msg && <div style={{ marginTop: '8px' }}>{msg}</div>}
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
