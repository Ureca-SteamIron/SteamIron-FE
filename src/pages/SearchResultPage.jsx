import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Box from '../shared/components/Box'
import { searchGames } from '../features/game/api/gameApi'

const NAME_COLUMN_WIDTH = '180px'

// BE GameService.SEARCH_MIN_KEYWORD_LENGTH / MainPage.SEARCH_MIN_KEYWORD_LENGTH와 동일 기준.
// 짧은 키워드로 직접 URL 접근(북마크·공유 링크 등)하는 경우까지 방어하기 위해 여기서도 체크한다.
const SEARCH_MIN_KEYWORD_LENGTH = 2

// 검색 결과: MainPage의 top100 목록과 동일한 행 레이아웃(이미지/가격·할인율/이름)을 그대로 사용.
// top100처럼 랭킹으로 범위를 좁히지 않고 전체 게임에서 keyword로 검색한 결과를 보여준다.
export default function SearchResultPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('keyword') ?? ''
  const isKeywordTooShort = keyword.length > 0 && keyword.length < SEARCH_MIN_KEYWORD_LENGTH

  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (keyword.length < SEARCH_MIN_KEYWORD_LENGTH) {
      setGames([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    searchGames(keyword)
      .then((data) => {
        if (!cancelled) setGames(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [keyword])

  return (
    <div style={{ padding: '20px' }}>
      <Box onClick={() => navigate('/')} style={{ display: 'inline-block' }}>← 메인으로</Box>

      <div style={{ marginTop: '20px', marginBottom: '10px' }}>
        '{keyword}' 검색 결과{!isKeywordTooShort && !loading && !error && ` (${games.length}건)`}
      </div>

      {isKeywordTooShort && (
        <Box style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          검색어는 {SEARCH_MIN_KEYWORD_LENGTH}자 이상 입력해주세요
        </Box>
      )}
      {!isKeywordTooShort && loading && <Box style={{ marginBottom: '10px' }}>불러오는 중...</Box>}
      {!isKeywordTooShort && error && <Box style={{ marginBottom: '10px' }}>에러: {error}</Box>}
      {!isKeywordTooShort && !loading && !error && games.length === 0 && (
        <Box style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          검색 결과가 없습니다
        </Box>
      )}

      {!isKeywordTooShort && games.map((game) => (
        <Box
          key={game.appId}
          onClick={() => navigate(`/games/${game.appId}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '10px' }}
        >
          <Box style={{ width: '120px', height: '50px', padding: 0, overflow: 'hidden' }}>
            <img
              src={game.headerImage}
              alt={game.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
          <div style={{ flex: 1, textAlign: 'center' }}>
            {game.discountPercent > 0 ? (
              <>
                <span style={{ textDecoration: 'line-through', marginRight: '8px' }}>
                  {game.originalPrice.toLocaleString()}원
                </span>
                <span>-{game.discountPercent}%</span>{' '}
                <span>{game.finalPrice.toLocaleString()}원</span>
              </>
            ) : (
              <span>{game.finalPrice.toLocaleString()}원</span>
            )}
          </div>
          <div
            style={{
              width: NAME_COLUMN_WIDTH,
              textAlign: 'right',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={game.name}
          >
            {game.name}
          </div>
        </Box>
      ))}
    </div>
  )
}
