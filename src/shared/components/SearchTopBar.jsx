import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from './Box'
import { getSession } from '../utils/auth'
import { SEARCH_MIN_KEYWORD_LENGTH } from '../constants/gameFilters'

// MainPage / SearchResultPage 공통 상단 바: 검색창 + 알림/마이페이지/로그인.
// initialKeyword를 넘기면 검색창에 미리 채워둔다(검색 결과 화면에서 재검색할 때 편하도록).
export default function SearchTopBar({ initialKeyword = '' }) {
  const navigate = useNavigate()
  const user = getSession()

  const [searchKeyword, setSearchKeyword] = useState(initialKeyword)
  const [searchError, setSearchError] = useState('')

  const handleSearchSubmit = () => {
    const trimmed = searchKeyword.trim()
    if (trimmed.length < SEARCH_MIN_KEYWORD_LENGTH) {
      setSearchError(`검색어는 ${SEARCH_MIN_KEYWORD_LENGTH}자 이상 입력해주세요`)
      return
    }
    setSearchError('')
    navigate(`/search?keyword=${encodeURIComponent(trimmed)}`)
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <Box style={{ flex: 1, maxWidth: '600px', margin: '0 auto', padding: '4px 10px' }}>
          <input
            type="text"
            placeholder="게임 이름으로 검색"
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value)
              if (searchError) setSearchError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchSubmit()
            }}
            style={{ width: '100%', border: 'none', outline: 'none' }}
          />
        </Box>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Box onClick={() => navigate('/notifications')}>알림</Box>
          <Box onClick={() => navigate('/me')}>마이페이지</Box>
          {user ? (
            <Box onClick={() => navigate('/me')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                />
              ) : (
                <div style={{ width: '28px', height: '28px', border: '2px solid black', borderRadius: '50%' }} />
              )}
              <span>{user.username}</span>
            </Box>
          ) : (
            <Box onClick={() => navigate('/login')}>login (discord)</Box>
          )}
        </div>
      </div>

      {searchError && (
        <div style={{ textAlign: 'center', color: 'red', fontSize: '13px', marginTop: '6px' }}>
          {searchError}
        </div>
      )}
    </>
  )
}
