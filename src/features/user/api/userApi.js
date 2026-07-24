// features/user/api/userApi.js
import axiosClient from '../../../shared/api/axiosClient'

// 내 계정 정보 (수정 화면에서 현재 아이디 표시/미리채움용)
// BE: ApiResponse<MyAccountResponse> = { loginId, hasCredentials }
export async function getMyAccount() {
  const { data } = await axiosClient.get('/api/v1/users/me/account')
  if (!data.success) throw new Error(data.message ?? '계정 정보 조회 실패')
  return data.data
}

// 아이디/비밀번호 수정 — payload: { loginId, currentPassword, newPassword }
//   newPassword가 비어 있으면 비밀번호는 그대로 두고 아이디만 변경된다.
export async function updateCredentials(payload) {
  const { data } = await axiosClient.patch('/api/v1/users/me/credentials', payload)
  if (!data.success) throw new Error(data.message ?? '계정 수정 실패')
}

// 회원 탈퇴 — 개인 데이터는 삭제되고, 작성한 댓글은 '알 수 없는 사용자'로 남는다.
// 재가입은 허용되므로 같은 Discord 계정으로 다시 로그인/가입할 수 있다.
export async function withdraw() {
  const { data } = await axiosClient.delete('/api/v1/users/me')
  if (!data.success) throw new Error(data.message ?? '회원 탈퇴 실패')
}
