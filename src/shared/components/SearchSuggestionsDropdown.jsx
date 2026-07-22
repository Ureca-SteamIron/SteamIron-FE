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
    <Box
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: '4px',
        zIndex: 10,
        padding: 0,
        backgroundColor: 'white',
      }}
    >
      {loading && <div style={{ padding: '10px' }}>검색 중...</div>}

      {/* 네트워크/서버 오류와 "진짜 0건"을 구분해서 보여준다 */}
      {!loading && error && (
        <div style={{ padding: '10px', color: 'red' }}>검색 제안을 불러오지 못했습니다</div>
      )}

      {!loading && !error && suggestions.length === 0 && (
        <div style={{ padding: '10px' }}>'{keyword}' 검색 결과가 없습니다</div>
      )}

      {!loading &&
        !error &&
        suggestions.map((game) => (
          <div
            key={game.appId}
            onClick={() => onSelectGame(game.appId)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              cursor: 'pointer',
              borderBottom: '1px solid #ddd',
            }}
          >
            <div style={{ width: '60px', height: '34px', overflow: 'hidden', flexShrink: 0 }}>
              <img
                src={game.headerImage}
                alt={game.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {game.name}
            </div>
            <div style={{ flexShrink: 0, fontSize: '13px' }}>
              {game.finalPrice === 0 ? '무료' : `${game.finalPrice.toLocaleString()}원`}
            </div>
          </div>
        ))}

      {!loading && (
        <div
          onClick={onViewAll}
          style={{ padding: '10px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold' }}
        >
          '{keyword}' 검색 결과 전체 보기
        </div>
      )}
    </Box>
  )
}
