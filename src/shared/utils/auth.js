// 로그인 세션(토큰 + 표시용 유저 정보)을 localStorage에 저장/조회/삭제한다.
// 새로고침해도 로그인이 유지되도록 브라우저에 남겨둔다.
const KEY = 'steamiron.auth'
const DISCORD_SETUP_KEY = 'steamiron.discord-account-setup'

export function saveSession(data) {
  const session = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    userId: data.userId,
    nickname: data.nickname,
    avatarUrl: data.avatarUrl,
    role: data.role,
  }
  localStorage.setItem(KEY, JSON.stringify(session))
}

export function getSession() {
  const raw = localStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : null
}

export function clearSession() {
  localStorage.removeItem(KEY)
}

export function saveDiscordAccountSetupToken(token) {
  sessionStorage.setItem(DISCORD_SETUP_KEY, token)
}

export function getDiscordAccountSetupToken() {
  return sessionStorage.getItem(DISCORD_SETUP_KEY)
}

export function clearDiscordAccountSetupToken() {
  sessionStorage.removeItem(DISCORD_SETUP_KEY)
}
