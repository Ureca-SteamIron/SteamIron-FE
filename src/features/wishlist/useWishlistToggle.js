import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSession } from '../../shared/utils/auth'
import { addWishlist, removeWishlist } from './api/wishlistApi'

// MainPage/SearchResultPage 공통 찜 토글 로직. wishlistIds/setWishlistIds는 호출하는 쪽에서
// 각자 로드한 상태를 그대로 넘긴다(어느 화면 리스트를 보여주고 있든 이 훅은 토글만 담당).
export function useWishlistToggle(wishlistIds, setWishlistIds) {
  const navigate = useNavigate()
  const user = getSession()
  const [pendingIds, setPendingIds] = useState(new Set())

  // Box의 navigate 클릭과 겹치지 않도록 stopPropagation
  const toggleWishlist = async (e, game) => {
    e.stopPropagation()

    if (!user) {
      navigate('/login')
      return
    }

    const gameId = game.appId
    if (pendingIds.has(gameId)) return

    const liked = wishlistIds.has(gameId)

    setPendingIds((prev) => new Set(prev).add(gameId))
    try {
      if (liked) {
        await removeWishlist(gameId)
        setWishlistIds((prev) => {
          const next = new Set(prev)
          next.delete(gameId)
          return next
        })
      } else {
        await addWishlist(gameId)
        setWishlistIds((prev) => new Set(prev).add(gameId))
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(gameId)
        return next
      })
    }
  }

  return { pendingIds, toggleWishlist }
}
