// MainPage / SearchResultPage 공통 상수. BE GameFilterRequest와 1:1 대응.

// BE GameFilterRequest.genre 후보 (별도 장르 목록 API가 없어 스팀 장르명으로 하드코딩)
export const GENRE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'Action', label: '액션' },
  { value: 'Adventure', label: '어드벤처' },
  { value: 'RPG', label: 'RPG' },
  { value: 'Strategy', label: '전략' },
  { value: 'Simulation', label: '시뮬레이션' },
  { value: 'Casual', label: '캐주얼' },
  { value: 'Sports', label: '스포츠' },
  { value: 'Racing', label: '레이싱' },
]

export const SORT_OPTIONS = [
  { value: 'popular', label: '인기순' },
  { value: 'price_asc', label: '낮은 가격순' },
  { value: 'price_desc', label: '높은 가격순' },
  { value: 'discount_desc', label: '할인율 높은순' },
  { value: 'name_asc', label: '이름순 (가나다)' },
  { value: 'name_desc', label: '이름 역순' },
]

export const DEFAULT_FILTERS = {
  genre: 'all',
  priceType: 'all',
  minPrice: '',
  maxPrice: '',
  minDiscount: 0,
  sale: false,
}

// BE GameService.SEARCH_MIN_KEYWORD_LENGTH와 동일 기준 (1글자 검색은 결과가 너무 많아 느려짐)
export const SEARCH_MIN_KEYWORD_LENGTH = 2

// draftFilters(입력 중인 값, 문자열 포함) -> BE로 보낼 형태(숫자 변환)로 정리
export function normalizeFiltersForRequest(draftFilters) {
  return {
    genre: draftFilters.genre,
    priceType: draftFilters.priceType,
    minPrice: draftFilters.minPrice === '' ? undefined : Number(draftFilters.minPrice),
    maxPrice: draftFilters.maxPrice === '' ? undefined : Number(draftFilters.maxPrice),
    minDiscount: draftFilters.minDiscount === '' ? 0 : Number(draftFilters.minDiscount),
    sale: draftFilters.sale,
  }
}
