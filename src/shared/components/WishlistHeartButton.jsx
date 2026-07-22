import { FaHeart, FaRegHeart } from 'react-icons/fa'

const HEART_COLUMN_WIDTH = '36px'

// 하트 토글 버튼: 찜 여부(liked)에 따라 add/remove API를 호출 (MainPage/SearchResultPage 공통)
export default function WishlistHeartButton({ liked, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        border: 'none',
        background: 'none',
        cursor: disabled ? 'default' : 'pointer',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: HEART_COLUMN_WIDTH,
        opacity: disabled ? 0.5 : 1,
      }}
      aria-label={liked ? '찜 해제' : '찜 추가'}
    >
      {liked ? <FaHeart size={18} color="#e74c3c" /> : <FaRegHeart size={18} color="#999" />}
    </button>
  )
}
