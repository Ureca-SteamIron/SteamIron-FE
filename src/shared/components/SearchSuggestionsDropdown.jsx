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
        marginTop: '8px',
        zIndex: 10,
        padding: '6px',
        backgroundColor: '#1b1b1f',
        borderRadius: '12px',
        border: '1px solid #2c2c33',
        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.45)',
        color: '#e8e8ea',
        maxHeight: '480px',
        overflowY: 'auto',
      }}
    >
      {loading && (
        <div style={{ padding: '16px', textAlign: 'center', color: '#9a9aa2', fontSize: '14px' }}>
          검색 중...
        </div>
      )}

      {/* 네트워크/서버 오류와 "진짜 0건"을 구분해서 보여준다 */}
      {!loading && error && (
        <div style={{ padding: '16px', textAlign: 'center', color: '#ff6b6b', fontSize: '14px' }}>
          검색 제안을 불러오지 못했습니다
        </div>
      )}

      {!loading && !error && suggestions.length === 0 && (
        <div style={{ padding: '16px', textAlign: 'center', color: '#9a9aa2', fontSize: '14px' }}>
          '{keyword}' 검색 결과가 없습니다
        </div>
      )}

      {!loading &&
        !error &&
        suggestions.map((game) => (
          <div
            key={game.appId}
            onClick={() => onSelectGame(game.appId)}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a2a31')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px',
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'background-color 0.15s ease',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '36px',
                overflow: 'hidden',
                flexShrink: 0,
                borderRadius: '6px',
                backgroundColor: '#000',
              }}
            >
              <img
                src={game.headerImage}
                alt={game.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>

            <div
              style={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '14px',
                fontWeight: 500,
                color: '#f2f2f4',
              }}
            >
              {game.name}
            </div>

            <div
              style={{
                flexShrink: 0,
                fontSize: '13px',
                fontWeight: 600,
                color: game.finalPrice === 0 ? '#5ee87f' : '#e8e8ea',
              }}
            >
              {game.finalPrice === 0 ? '무료' : `${game.finalPrice.toLocaleString()}원`}
            </div>
          </div>
        ))}

      {!loading && (
        <div
          onClick={onViewAll}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#33333b')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#26262c')}
          style={{
            marginTop: '4px',
            padding: '10px',
            textAlign: 'center',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            color: '#f2f2f4',
            backgroundColor: '#26262c',
            borderRadius: '8px',
            transition: 'background-color 0.15s ease',
          }}
        >
          '{keyword}' 검색 결과 전체 보기
        </div>
      )}
    </Box>
  )
}