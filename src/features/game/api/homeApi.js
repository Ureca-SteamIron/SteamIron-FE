import axiosClient from '../../../shared/api/axiosClient'

// BE HomeResponse: { topGames: GameSimpleResponse[] }
// wishListGames는 백엔드 WishListService 미구현으로 현재 응답에서 제외되어 있음
//
// filters는 BE GameFilterRequest와 1:1 대응 (전부 선택값, axios가 undefined 값은 쿼리에서 제외해줌)
// { genre, priceType, minPrice, maxPrice, minDiscount, sale, sort }
export async function getHomeData(filters = {}) {
  const { data } = await axiosClient.get('/api/home', { params: filters })

  if (!data.success) {
    throw new Error(data.message ?? 'home 데이터 조회 실패')
  }

  const home = data.data
  return {
    ...home,
    // 가격이 null인 게임이 있음(미수집/판매중지 등) → 팀 결정에 따라 전부 0 처리.
    // 화면마다 방어하는 대신 데이터 입구에서 한 번에 정규화한다 (null이 새면 화면 전체가 죽음)
    topGames: (home.topGames ?? []).map((game) => ({
      ...game,
      originalPrice: game.originalPrice ?? 0,
      finalPrice: game.finalPrice ?? 0,
      discountPercent: game.discountPercent ?? 0,
    })),
  }
}
