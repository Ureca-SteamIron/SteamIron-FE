// 백엔드 API 주소 (로컬 개발용). 배포 시엔 환경변수로 교체 예정
export const API_BASE_URL = 'http://localhost:8080'

// Discord OAuth2 설정
//  - client-id는 공개값이라 프론트에 있어도 됨 (secret은 절대 프론트에 두지 않음)
//  - redirect-uri는 BE 설정 / Discord Portal 등록값과 글자까지 똑같아야 함
const DISCORD_CLIENT_ID = '1527166724489871420'
const DISCORD_REDIRECT_URI = 'http://localhost:5173/auth/callback'

// 로그인 버튼을 누르면 이동할 Discord 인증 페이지 주소를 만든다
export function buildDiscordAuthorizeUrl() {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify email',
  })
  return `https://discord.com/oauth2/authorize?${params.toString()}`
}
