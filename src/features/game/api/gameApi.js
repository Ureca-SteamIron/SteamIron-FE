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
