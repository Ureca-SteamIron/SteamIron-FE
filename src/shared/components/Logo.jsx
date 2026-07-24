import { useTheme } from '../hooks/useTheme'
import logoBlack from '../resources/img/logo_black.png'
import logoWhite from '../resources/img/logo_white.png'

// 다크모드에서는 흰 글씨 로고, 라이트모드에서는 검은 글씨 로고를 사용한다.
export default function Logo({ onClick, className = 'h-11 w-auto' }) {
  const theme = useTheme()

  return (
    <img
      src={theme === 'dark' ? logoWhite : logoBlack}
      alt="스팀다리미"
      onClick={onClick}
      className={`${className} flex-shrink-0 ${onClick ? 'cursor-pointer' : ''}`}
    />
  )
}
