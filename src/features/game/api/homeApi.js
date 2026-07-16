import axiosClient from '../../../shared/api/axiosClient'

// BE HomeResponse: { topGames: GameSimpleResponse[] }
// wishListGames는 백엔드 WishListService 미구현으로 현재 응답에서 제외되어 있음
export async function getHomeData() {
  const { data } = await axiosClient.get('/api/home')

  if (!data.success) {
    throw new Error(data.message ?? 'home 데이터 조회 실패')
  }

  return data.data
}
