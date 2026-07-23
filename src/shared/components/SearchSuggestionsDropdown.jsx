import Box from './Box'
import { SEARCH_SUGGESTION_LIMIT } from '../constants/gameFilters'

// 검색창 자동완성 드롭다운. games를 먼저 채우고, 남은 자리만큼만 similarGames로 보충한다.
// BE의 similarGames 노출 조건(games가 1페이지에 다 들어갈 때만)은 요청한 size 기준이라,
// 여기서도 캡(SEARCH_SUGGESTION_LIMIT)을 넘지 않게 최종적으로 한 번 더 잘라준다.
function buildSuggestionList(games, similarGames) {
  const combined = [...(games ?? [])]
  const remaining = SEARCH_SUGGESTION_LIMIT - combined.length
  if (remaining > 0) {
    combined.push(...(similarGames ?? []).slice(0, remaining))
  }
  return combined.slice(0, SEARCH_SUGGESTION_LIMIT)
}

export default function SearchSuggestionsDropdown({ keyword, games, similarGames, loading, error, onSelectGame, onViewAll }) {
  const suggestions = buildSuggestionList(games, similarGames)

  return (
    <Box className="absolute top-full left-0 right-0 mt-2 z-10 p-1.5 bg-[#1b1b1f] rounded-xl border border-[#2c2c33] shadow-2xl shadow-black/45 text-[#e8e8ea] max-h-[480px] overflow-y-auto">
      {loading && (
        <div className="p-4 text-center text-[#9a9aa2] text-sm">검색 중...</div>
      )}

      {/* 네트워크/서버 오류와 "진짜 0건"을 구분해서 보여준다 */}
      {!loading && error && (
        <div className="p-4 text-center text-red-400 text-sm">
          검색 제안을 불러오지 못했습니다
        </div>
      )}

      {!loading && !error && suggestions.length === 0 && (
        <div className="p-4 text-center text-[#9a9aa2] text-sm">
          '{keyword}' 검색 결과가 없습니다
        </div>
      )}

      {!loading &&
        !error &&
        suggestions.map((game) => (
          <div
            key={game.appId}
            onClick={() => onSelectGame(game.appId)}
            className="flex items-center gap-3 p-2 cursor-pointer rounded-lg transition-colors duration-150 hover:bg-[#2a2a31]"
          >
            <div className="w-16 h-9 overflow-hidden flex-shrink-0 rounded-md bg-black">
              <img
                src={game.headerImage}
                alt={game.name}
                className="w-full h-full object-cover block"
              />
            </div>

            <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-[#f2f2f4]">
              {game.name}
            </div>

            <div
              className={`flex-shrink-0 text-[13px] font-semibold ${
                game.finalPrice === 0 ? 'text-green-400' : 'text-[#e8e8ea]'
              }`}
            >
              {game.finalPrice === 0 ? '무료' : `${game.finalPrice.toLocaleString()}원`}
            </div>
          </div>
        ))}

      {!loading && (
        <div
          onClick={onViewAll}
          className="mt-1 p-2.5 text-center cursor-pointer font-semibold text-[13px] text-[#f2f2f4] bg-[#26262c] rounded-lg transition-colors duration-150 hover:bg-[#33333b]"
        >
          '{keyword}' 검색 결과 전체 보기
        </div>
      )}
    </Box>
  )
}