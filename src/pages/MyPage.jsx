import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '../shared/components/Box'
import { clearSession, getSession } from '../shared/utils/auth'
import { getMyAccount, updateCredentials } from '../features/user/api/userApi'
import { getMyWishlist, removeWishlist } from '../features/wishlist/api/wishlistApi'
import { FaHeart } from 'react-icons/fa'

const NAME_COLUMN_WIDTH = '180px'
const HEART_COLUMN_WIDTH = '36px'

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

  // ===== 관심목록(찜) 상태 — MainPage와 동일한 패턴 =====
  const [wishlist, setWishlist] = useState([])
  const [wishlistLoading, setWishlistLoading] = useState(true)
  const [wishlistError, setWishlistError] = useState(null)
  // 하트 클릭 중복 호출 방지 (게임별 요청 진행 상태)
  const [pendingIds, setPendingIds] = useState(new Set())

  const loadWishlist = () => {
    if (!user) {
      setWishlistLoading(false)
      return
    }
    let cancelled = false
    setWishlistLoading(true)
    setWishlistError(null)

    getMyWishlist()
      .then((data) => {
        if (!cancelled) setWishlist(data)
      })
      .catch((err) => {
        if (!cancelled) setWishlistError(err.response?.data?.message ?? err.message)
      })
      .finally(() => {
        if (!cancelled) setWishlistLoading(false)
      })

    return () => {
      cancelled = true
    }
  }

  // 마운트 시 찜 목록 로드
  useEffect(() => {
    const cancel = loadWishlist()
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 관심목록 해제: MainPage의 handleToggleWishlist에서 remove 부분만 필요 (여긴 이미 찜한 것만 보여주므로)
  const handleRemoveWishlist = async (e, gameId) => {
    e.stopPropagation()
    if (pendingIds.has(gameId)) return

    setPendingIds((prev) => new Set(prev).add(gameId))
    try {
      await removeWishlist(gameId)
      setWishlist((prev) => prev.filter((g) => g.appId !== gameId))
    } catch (err) {
      alert(err.response?.data?.message ?? err.message)
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(gameId)
        return next
      })
    }
  }

  // MainPage의 renderGameRow와 동일한 레이아웃: 사진 / 가격 / 이름 / 하트
  const renderWishlistRow = (game) => {
    const isPending = pendingIds.has(game.appId)
    const originalPrice = game.originalPrice ?? 0
    const finalPrice = game.finalPrice ?? 0

    return (
      <Box
        key={game.appId}
        onClick={() => navigate(`/games/${game.appId}`)}
        style={{ display: 'flex', alignItems: 'center', gap: '30px', marginTop: '10px' }}
      >
        <Box style={{ width: '120px', height: '50px', padding: 0, overflow: 'hidden' }}>
          <img
            src={game.headerImage}
            alt={game.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>
        <div style={{ flex: 1, textAlign: 'center' }}>
          {finalPrice === 0 ? (
            <span>무료</span>
          ) : game.discountPercent > 0 ? (
            <>
              <span style={{ textDecoration: 'line-through', marginRight: '8px' }}>
                {originalPrice.toLocaleString()}원
              </span>
              <span>-{game.discountPercent}%</span>{' '}
              <span>{finalPrice.toLocaleString()}원</span>
            </>
          ) : (
            <span>{finalPrice.toLocaleString()}원</span>
          )}
        </div>
        <div
          style={{
            width: NAME_COLUMN_WIDTH,
            textAlign: 'right',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={game.name}
        >
          {game.name}
        </div>
        <button
          onClick={(e) => !isPending && handleRemoveWishlist(e, game.appId)}
          disabled={isPending}
          style={{
            border: 'none',
            background: 'none',
            cursor: isPending ? 'default' : 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: HEART_COLUMN_WIDTH,
            opacity: isPending ? 0.5 : 1,
          }}
          aria-label="찜 해제"
        >
          <FaHeart size={18} color="#e74c3c" />
        </button>
      </Box>
    )
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

        {!user && (
          <Box style={{ marginTop: '10px' }}>로그인이 필요합니다</Box>
        )}

        {user && wishlistLoading && (
          <Box style={{ marginTop: '10px' }}>불러오는 중...</Box>
        )}

        {user && wishlistError && (
          <Box style={{ marginTop: '10px' }}>에러: {wishlistError}</Box>
        )}

        {user && !wishlistLoading && !wishlistError && wishlist.length === 0 && (
          <Box style={{ marginTop: '10px' }}>찜한 게임이 없습니다</Box>
        )}

        {user && !wishlistLoading && !wishlistError && wishlist.map(renderWishlistRow)}
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