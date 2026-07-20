// features/wishlist/api/wishlistApi.js
import axiosClient from '../../../shared/api/axiosClient'

// BE: ApiResponse<List<GameSimpleResponse>>
// GameSimpleResponse 원본 필드 그대로 옴 (originalPrice/finalPrice/discountPercent가 null일 수 있음)
export async function getMyWishlist() {
  const { data } = await axiosClient.get('/api/v1/users/me/wishlist')

  if (!data.success) {
    throw new Error(data.message ?? '찜 목록 조회 실패')
  }

  // home.jsx와 동일하게 데이터 입구에서 null 정규화
  return (data.data ?? []).map((game) => ({
    ...game,
    originalPrice: game.originalPrice ?? 0,
    finalPrice: game.finalPrice ?? 0,
    discountPercent: game.discountPercent ?? 0,
  }))
}

// BE: ApiResponse<Void> (성공 시 data: null)
export async function addWishlist(gameId) {
  const { data } = await axiosClient.post(`/api/v1/games/${gameId}/wishlist`)

  if (!data.success) {
    throw new Error(data.message ?? '찜 추가 실패')
  }
}

export async function removeWishlist(gameId) {
  const { data } = await axiosClient.delete(`/api/v1/games/${gameId}/wishlist`)

  if (!data.success) {
    throw new Error(data.message ?? '찜 삭제 실패')
  }
}