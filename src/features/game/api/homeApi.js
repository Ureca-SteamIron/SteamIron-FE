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

  return data.data
}
