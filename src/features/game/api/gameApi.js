import axiosClient from '../../../shared/api/axiosClient'
import { getSession } from '../../../shared/utils/auth'

// BE GameDetailResponse: { appId, name, headerImage, originalPrice, finalPrice,
//   discountPercent, description, isWishlisted, aiScore, aiExplanation }
// userId는 GameController가 인증 컨텍스트가 아닌 쿼리 파라미터로 받기 때문에 세션에서 꺼내 직접 전달한다.
export async function getGameDetail(appId) {
  const user = getSession()

  const { data } = await axiosClient.get(`/api/games/${appId}`, {
    params: user ? { userId: user.userId } : {},
  })

  if (!data.success) {
    throw new Error(data.message ?? '게임 상세 조회 실패')
  }

  const game = data.data
  return {
    ...game,
    // 가격이 null인 게임이 있음(미수집/판매중지 등) → 팀 결정에 따라 전부 0 처리.
    // null이 화면까지 새면 toLocaleString()에서 TypeError로 페이지 전체가 죽는다 (메인에서 실제 발생했던 버그)
    originalPrice: game.originalPrice ?? 0,
    finalPrice: game.finalPrice ?? 0,
    discountPercent: game.discountPercent ?? 0,
  }
}

// BE 응답: GameSimpleResponse[] (top100과 동일한 모양) — 다만 top100 범위 제한 없이 전체 게임 대상 검색
export async function searchGames(keyword) {
  const { data } = await axiosClient.get('/api/games/search', {
    params: { keyword },
  })

  if (!data.success) {
    throw new Error(data.message ?? '게임 검색 실패')
  }

  // getHomeData와 동일한 이유로 가격 null을 여기서 한 번에 0 처리
  return (data.data ?? []).map((game) => ({
    ...game,
    originalPrice: game.originalPrice ?? 0,
    finalPrice: game.finalPrice ?? 0,
    discountPercent: game.discountPercent ?? 0,
  }))
}

export function getAllGames({ genre, priceType, minPrice, maxPrice, minDiscount, sale, sort, page, size }) {
  return axiosClient
    .get('/api/games/list', {
      params: { genre, priceType, minPrice, maxPrice, minDiscount, sale, sort, page, size },
    })
    .then((res) => res.data.data) // ApiResponse.data = PageResponse
}
