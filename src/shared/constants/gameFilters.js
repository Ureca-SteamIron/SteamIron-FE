// MainPage / SearchResultPage 공통 상수. BE GameFilterRequest와 1:1 대응.

// BE GameFilterRequest.genre 후보 (별도 장르 목록 API가 없어 스팀 장르명으로 하드코딩)
// value는 실제 DB에 저장된 장르명과 일치해야 한다 — 일부는 영어(Action/RPG), 일부는 한글(어드벤처/전략 등)로
// 섞여 저장되어 있어서(develop에서 실제 데이터 확인 후 반영) 항목마다 다르다.
export const GENRE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'Action', label: '액션' },      // DB: Action (영어)
  { value: '어드벤처', label: '어드벤처' },   // DB: 어드벤처
  { value: 'RPG', label: 'RPG' },          // DB: RPG (영어)
  { value: '전략', label: '전략' },
  { value: '시뮬레이션', label: '시뮬레이션' },
  { value: '캐주얼', label: '캐주얼' },
  { value: '스포츠', label: '스포츠' },
  { value: '레이싱', label: '레이싱' },
]

export const SORT_OPTIONS = [
  { value: 'popular', label: '인기순' },
  { value: 'price_asc', label: '낮은 가격순' },
  { value: 'price_desc', label: '높은 가격순' },
  { value: 'discount_desc', label: '할인율 높은순' },
  { value: 'name_asc', label: '이름순 (가-Z)' },
  { value: 'name_desc', label: '이름 역순 (Z-가)' },
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
