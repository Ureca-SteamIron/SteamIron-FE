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

  return data.data
}
