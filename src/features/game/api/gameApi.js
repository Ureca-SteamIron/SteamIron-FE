import axiosClient from '../../../shared/api/axiosClient'
import { getSession } from '../../../shared/utils/auth'

// BE GameDetailResponse: { appId, name, headerImage, originalPrice, finalPrice,
//   discountPercent, description, isWishlisted, aiScore }
// AI 요약(aiExplanation)은 Gemini 호출 때문에 느려서(수 초) 별도 엔드포인트로 분리되어 있다 → getAiSummary().
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

// BE GET /api/games/{appId}/ai-summary: { aiExplanation }
// 게임 상세와 병렬로 호출해서, 상세 화면은 먼저 띄우고 AI 요약만 별도로 로딩 표시한다.
export async function getAiSummary(appId) {
  const { data } = await axiosClient.get(`/api/games/${appId}/ai-summary`)

  if (!data.success) {
    throw new Error(data.message ?? 'AI 요약 조회 실패')
  }

  return data.data.aiExplanation
}

// getHomeData와 동일한 이유로 가격 null을 여기서 한 번에 0 처리
function normalizePrices(gameList) {
  return (gameList ?? []).map((game) => ({
    ...game,
    originalPrice: game.originalPrice ?? 0,
    finalPrice: game.finalPrice ?? 0,
    discountPercent: game.discountPercent ?? 0,
  }))
}

// BE GameSearchResponse: { games: GameSimpleResponse[], similarGames: GameSimpleResponse[],
//   page, size, totalElements, totalPages, hasNext }
// games는 부분 일치(페이지네이션 + filters 대상), similarGames는 pg_trgm 유사 검색 결과
// (1페이지 & games가 1페이지에 다 들어갈 때만 채워짐, 최대 5개, filters 미적용).
// top100 범위 제한 없이 전체 게임 대상 검색. size는 안 넘기면 BE 기본값(25, 스팀과 동일)이 적용된다.
// filters는 BE GameFilterRequest와 1:1 대응 { genre, priceType, minPrice, maxPrice, minDiscount, sale, sort }
// size를 명시적으로 넘기면(검색 자동완성 드롭다운처럼 적은 개수만 필요할 때) 그 값으로 요청한다.
export async function searchGames(keyword, page = 0, filters = {}, size) {
  const { data } = await axiosClient.get('/api/games/search', {
    params: { keyword, page, size, ...filters },
  })

  if (!data.success) {
    throw new Error(data.message ?? '게임 검색 실패')
  }

  const result = data.data
  return {
    ...result,
    games: normalizePrices(result.games),
    similarGames: normalizePrices(result.similarGames),
  }
}

export function getAllGames({ genre, priceType, minPrice, maxPrice, minDiscount, sale, sort, page, size }) {
  return axiosClient
    .get('/api/games/list', {
      params: { genre, priceType, minPrice, maxPrice, minDiscount, sale, sort, page, size },
    })
    .then((res) => res.data.data) // ApiResponse.data = PageResponse
}

// BE POST /api/games/{appId}/refresh: Steam API에서 최신 정보를 가져와 game 테이블 갱신 후
// 갱신된 GameDetailResponse를 그대로 반환한다. getGameDetail과 동일한 응답 모양이라 null 가격 처리도 동일하게 적용.
export async function refreshGame(appId) {
  const user = getSession()

  const { data } = await axiosClient.post(
    `/api/games/${appId}/refresh`,
    null,
    { params: user ? { userId: user.userId } : {} }
  )

  if (!data.success) {
    throw new Error(data.message ?? '게임 정보 갱신 실패')
  }

  const game = data.data
  return {
    ...game,
    originalPrice: game.originalPrice ?? 0,
    finalPrice: game.finalPrice ?? 0,
    discountPercent: game.discountPercent ?? 0,
  }
}
