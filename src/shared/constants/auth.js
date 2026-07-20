// 백엔드 API 주소를 "지금 접속한 주소" 기준으로 만든다.
//  - 로컬(localhost) 접속:  http://localhost:8080  (BE 로컬 포트)
//  - 배포(Tailscale IP) 접속: http://<접속한 그 IP>:8090  (BE 배포 포트)
// Tailscale IP가 사람마다 다르므로(100.96.97.2 / 100.75.133.23 …) 고정하면
// 다른 IP인 사람은 붙지 못한다. hostname을 그대로 써서 각자 자기 경로로 붙게 한다.
const { protocol, hostname } = window.location
export const API_BASE_URL =
  hostname === 'localhost' ? 'http://localhost:8080' : `${protocol}//${hostname}:8090`

// Discord OAuth2 설정
//  - client-id는 공개값이라 프론트에 있어도 됨 (secret은 절대 프론트에 두지 않음)
//  - redirect-uri는 "지금 접속한 그 주소"로 자동 생성한다.
//    Tailscale IP가 사람마다 다르므로(예: 100.96.97.2 / 100.75.133.23) 하나로 고정하면
//    다른 IP로 접속한 사람은 승인 후 남의 주소로 돌아가버린다.
//    window.location.origin = 지금 브라우저가 보고 있는 주소(스킴+호스트+포트).
//    각 주소를 Discord 개발자 포털 Redirects에 등록 완료
const DISCORD_CLIENT_ID = '1527166724489871420'
// authorize와 code 교환(BE) 양쪽이 똑같은 값을 써야 하므로 export해서 콜백에서 재사용한다.
export const DISCORD_REDIRECT_URI = `${window.location.origin}/auth/callback`

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
