// 로그인 세션(토큰 + 표시용 유저 정보)을 localStorage에 저장/조회/삭제한다.
// 새로고침해도 로그인이 유지되도록 브라우저에 남겨둔다.
const KEY = 'steamiron.auth'

export function saveSession(data) {
  // data: { accessToken, refreshToken, userId, username, avatarUrl }
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function getSession() {
  const raw = localStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : null
}

export function clearSession() {
  localStorage.removeItem(KEY)
}
