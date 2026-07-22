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
