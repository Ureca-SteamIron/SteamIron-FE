import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '../shared/components/Box'
import { clearSession, getSession } from '../shared/utils/auth'
import { getMyAccount, updateCredentials } from '../features/user/api/userApi'
import { getMyWishlist, removeWishlist } from '../features/wishlist/api/wishlistApi'
import { FaHeart } from 'react-icons/fa'
import { getMyComments } from '../features/comment/api/commentApi'
import { deleteComment as deleteMyComment } from '../features/comment/api/commentApi'

const PRICE_COLUMN_WIDTH = '210px'
const HEART_COLUMN_WIDTH = '36px'

const cardClass = 'rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)]'
const inputClass =
  'w-full bg-[var(--color-bg-input)] text-[var(--color-text-primary)] text-sm rounded-lg border border-[var(--color-border)] px-3 py-2 outline-none focus:border-[var(--color-border-strong)] mt-1.5'
const linkButtonClass =
  'inline-flex items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] cursor-pointer transition-colors duration-150 hover:bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-border-hover)]'

// 마이페이지: 내 정보 조회/수정 / 관심목록 / 내 커뮤니티 글 / 회원탈퇴 / 로그아웃
export default function MyPage() {
  const navigate = useNavigate()
  const user = getSession()

  const handleLogout = () => {
    clearSession()
    navigate('/')
  }

  const [editing, setEditing] = useState(false)
  const [loginId, setLoginId] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

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

  const [wishlist, setWishlist] = useState([])
  const [wishlistLoading, setWishlistLoading] = useState(true)
  const [wishlistError, setWishlistError] = useState(null)
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

  useEffect(() => {
    const cancel = loadWishlist()
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const renderWishlistRow = (game) => {
    const isPending = pendingIds.has(game.appId)
    const originalPrice = game.originalPrice ?? 0
    const finalPrice = game.finalPrice ?? 0

    return (
      <div
        key={game.appId}
        onClick={() => navigate(`/games/${game.appId}`)}
        className="flex items-center gap-6 mt-2.5 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] cursor-pointer transition-colors duration-150 hover:bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-border-hover)]"
      >
        <div className="w-[120px] h-[64px] rounded-lg overflow-hidden flex-shrink-0 bg-black">
          <img src={game.headerImage} alt={game.name} className="w-full h-full object-cover" />
        </div>

        <div
          className="flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-[var(--color-text-heading)] font-medium"
          title={game.name}
        >
          {game.name}
        </div>

        <div
          className="flex items-center justify-end gap-2 text-sm flex-shrink-0 flex-wrap"
          style={{ width: PRICE_COLUMN_WIDTH }}
        >
          {finalPrice === 0 ? (
            <span className="text-green-400 font-semibold">무료</span>
          ) : game.discountPercent > 0 ? (
            <>
              <span className="line-through text-[var(--color-text-tertiary)]">
                {originalPrice.toLocaleString()}원
              </span>
              <span className="text-green-400 font-semibold">-{game.discountPercent}%</span>
              <span className="text-[var(--color-text-heading)] font-semibold">{finalPrice.toLocaleString()}원</span>
            </>
          ) : (
            <span className="text-[var(--color-text-heading)] font-semibold">{finalPrice.toLocaleString()}원</span>
          )}
        </div>

        <button
          onClick={(e) => !isPending && handleRemoveWishlist(e, game.appId)}
          disabled={isPending}
          aria-label="찜 해제"
          className={`flex items-center justify-center border-none bg-none p-0 transition-opacity duration-150 ${
            isPending ? 'cursor-default opacity-50' : 'cursor-pointer opacity-100 hover:opacity-70'
          }`}
          style={{ width: HEART_COLUMN_WIDTH }}
        >
          <FaHeart size={18} className="text-red-400" />
        </button>
      </div>
    )
  }

  const [myComments, setMyComments] = useState([])
  const [myCommentsLoading, setMyCommentsLoading] = useState(true)
  const [myCommentsError, setMyCommentsError] = useState(null)

  const loadMyComments = () => {
    if (!user) {
      setMyCommentsLoading(false)
      return
    }
    setMyCommentsLoading(true)
    setMyCommentsError(null)
    getMyComments()
      .then((page) => setMyComments(page.content ?? []))
      .catch((err) => setMyCommentsError(err.response?.data?.message ?? err.message))
      .finally(() => setMyCommentsLoading(false))
  }

  useEffect(() => {
    loadMyComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDeleteMyComment = (commentId) => {
    deleteMyComment(commentId)
      .then(() => setMyComments((prev) => prev.filter((c) => c.id !== commentId)))
      .catch((err) => alert(err.response?.data?.message ?? err.message))
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)] overflow-x-hidden">
      <div className="w-[1400px] max-w-full mx-auto p-5">
        <div className="flex justify-between">
          <div onClick={() => navigate('/')} className={linkButtonClass}>
            ← 메인으로
          </div>
          <div onClick={handleLogout} className={linkButtonClass}>
            로그아웃
          </div>
        </div>

        {/* 내 정보 */}
        <div className={`${cardClass} mt-6 p-5`}>
          <div className="font-bold text-sm text-[var(--color-text-heading)]">
            내 정보 {user?.username ? `(${user.username})` : ''}
          </div>
          <div className="flex gap-2.5 mt-3">
            {user ? (
              <div
                onClick={() => (editing ? setEditing(false) : openEdit())}
                className="px-4 py-2 rounded-lg text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] cursor-pointer transition-colors duration-150 hover:bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-border-hover)]"
              >
                아이디/비밀번호 수정
              </div>
            ) : (
              <div
                onClick={() => navigate('/login')}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--color-text-on-accent)] bg-green-400 cursor-pointer transition-colors duration-150 hover:bg-green-300"
              >
                로그인
              </div>
            )}
            <div className="px-4 py-2 rounded-lg text-sm text-red-400 border border-[var(--color-border)] cursor-pointer transition-colors duration-150 hover:bg-red-400/10 hover:border-red-400/40">
              회원탈퇴
            </div>
          </div>

          {editing && (
            <div className="mt-4 flex flex-col gap-3 max-w-[360px]">
              <label className="text-sm text-[var(--color-text-primary)]">
                아이디
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-sm text-[var(--color-text-primary)]">
                현재 비밀번호
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-sm text-[var(--color-text-primary)]">
                새 비밀번호{' '}
                <span className="text-[var(--color-text-tertiary)] text-xs">(비우면 그대로)</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-sm text-[var(--color-text-primary)]">
                새 비밀번호 확인
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </label>
              <div className="flex gap-2">
                <div
                  onClick={saving ? undefined : handleSave}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                    saving
                      ? 'cursor-default opacity-50 text-[var(--color-text-on-accent)] bg-green-400'
                      : 'cursor-pointer text-[var(--color-text-on-accent)] bg-green-400 hover:bg-green-300'
                  }`}
                >
                  {saving ? '저장 중...' : '저장'}
                </div>
                <div
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] cursor-pointer transition-colors duration-150 hover:bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-border-hover)]"
                >
                  취소
                </div>
              </div>
            </div>
          )}

          {msg && <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{msg}</div>}
        </div>

        {/* 관심목록 */}
        <div className={`${cardClass} mt-6 p-5`}>
          <div className="font-bold text-sm text-[var(--color-text-heading)]">관심목록</div>

          {!user && (
            <div className="mt-2.5 text-sm text-[var(--color-text-secondary)]">로그인이 필요합니다</div>
          )}
          {user && wishlistLoading && (
            <div className="mt-2.5 text-sm text-[var(--color-text-secondary)]">불러오는 중...</div>
          )}
          {user && wishlistError && (
            <div className="mt-2.5 text-sm text-red-400">에러: {wishlistError}</div>
          )}
          {user && !wishlistLoading && !wishlistError && wishlist.length === 0 && (
            <div className="mt-2.5 text-sm text-[var(--color-text-secondary)]">찜한 게임이 없습니다</div>
          )}

          {user && !wishlistLoading && !wishlistError && wishlist.map(renderWishlistRow)}
        </div>

        {/* 내 커뮤니티 글 */}
        <div className={`${cardClass} mt-6 p-5`}>
          <div className="font-bold text-sm text-[var(--color-text-heading)]">
            내 커뮤니티 글 (내가 쓴 글 / 댓글 목록)
          </div>

          {!user && (
            <div className="mt-2.5 text-sm text-[var(--color-text-secondary)]">로그인이 필요합니다</div>
          )}
          {user && myCommentsLoading && (
            <div className="mt-2.5 text-sm text-[var(--color-text-secondary)]">불러오는 중...</div>
          )}
          {user && myCommentsError && (
            <div className="mt-2.5 text-sm text-red-400">에러: {myCommentsError}</div>
          )}
          {user && !myCommentsLoading && !myCommentsError && myComments.length === 0 && (
            <div className="mt-2.5 text-sm text-[var(--color-text-secondary)]">작성한 댓글이 없습니다</div>
          )}

          {user &&
            !myCommentsLoading &&
            !myCommentsError &&
            myComments.map((comment) => (
              <div
                key={comment.id}
                className="flex items-center gap-3 mt-2.5 p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-alt)]"
              >
                <div
                  onClick={() => navigate(`/games/${comment.gameId}`)}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <div className="text-xs text-[var(--color-text-tertiary)]">{comment.gameName}</div>
                  <div className="text-sm text-[var(--color-text-primary)] mt-1 truncate">{comment.content}</div>
                  <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                    {new Date(comment.createdAt).toLocaleString()}
                  </div>
                </div>
                <div
                  onClick={() => handleDeleteMyComment(comment.id)}
                  className="text-sm text-[var(--color-text-secondary)] cursor-pointer transition-colors duration-150 hover:text-red-400 flex-shrink-0"
                >
                  삭제
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}