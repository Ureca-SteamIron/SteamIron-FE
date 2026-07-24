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

// 검색 자동완성 드롭다운에 보여줄 최대 개수 (스팀 검색창과 동일하게 소수만 보여주고 나머지는 "전체 보기"로 유도)
export const SEARCH_SUGGESTION_LIMIT = 5

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

// 적용된 필터를 URL의 단일 소스로 삼기 위한 직렬화/역직렬화.
// (게임 상세에서 뒤로가기로 돌아왔을 때, 혹은 브라우저 자체 뒤로가기를 눌렀을 때도
//  정렬·페이지처럼 필터도 URL에서 그대로 복원되어야 컴포넌트가 리마운트돼도 초기화되지 않는다.)
export function filtersFromSearchParams(searchParams) {
  const minPriceRaw = searchParams.get('minPrice')
  const maxPriceRaw = searchParams.get('maxPrice')

  return {
    genre: searchParams.get('genre') || DEFAULT_FILTERS.genre,
    priceType: searchParams.get('priceType') || DEFAULT_FILTERS.priceType,
    minPrice: minPriceRaw === null ? undefined : Number(minPriceRaw),
    maxPrice: maxPriceRaw === null ? undefined : Number(maxPriceRaw),
    minDiscount: searchParams.has('minDiscount') ? Number(searchParams.get('minDiscount')) : DEFAULT_FILTERS.minDiscount,
    sale: searchParams.get('sale') === 'true',
  }
}

// normalizeFiltersForRequest가 만든(숫자 변환된) 필터를 URLSearchParams에 반영한다.
// 기본값과 같은 항목은 URL을 깔끔하게 유지하기 위해 파라미터 자체를 지운다.
export function writeFiltersToSearchParams(params, appliedFilters) {
  if (appliedFilters.genre && appliedFilters.genre !== DEFAULT_FILTERS.genre) {
    params.set('genre', appliedFilters.genre)
  } else {
    params.delete('genre')
  }

  if (appliedFilters.priceType && appliedFilters.priceType !== DEFAULT_FILTERS.priceType) {
    params.set('priceType', appliedFilters.priceType)
  } else {
    params.delete('priceType')
  }

  if (appliedFilters.minPrice !== undefined) {
    params.set('minPrice', String(appliedFilters.minPrice))
  } else {
    params.delete('minPrice')
  }

  if (appliedFilters.maxPrice !== undefined) {
    params.set('maxPrice', String(appliedFilters.maxPrice))
  } else {
    params.delete('maxPrice')
  }

  if (appliedFilters.minDiscount) {
    params.set('minDiscount', String(appliedFilters.minDiscount))
  } else {
    params.delete('minDiscount')
  }

  if (appliedFilters.sale) {
    params.set('sale', 'true')
  } else {
    params.delete('sale')
  }

  return params
}

// URL에서 복원한 appliedFilters(숫자/undefined) -> FilterPanel 입력값(문자열 포함)으로 되돌린다.
export function appliedFiltersToDraft(appliedFilters) {
  return {
    genre: appliedFilters.genre,
    priceType: appliedFilters.priceType,
    minPrice: appliedFilters.minPrice === undefined ? '' : String(appliedFilters.minPrice),
    maxPrice: appliedFilters.maxPrice === undefined ? '' : String(appliedFilters.maxPrice),
    minDiscount: appliedFilters.minDiscount ?? 0,
    sale: appliedFilters.sale,
  }
}
