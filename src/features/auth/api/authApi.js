import axiosClient from '../../../shared/api/axiosClient'

function authError(error, fallbackMessage) {
  return new Error(error.response?.data?.message ?? fallbackMessage)
}

export async function loginWithCredentials(loginId, password) {
  try {
    const { data } = await axiosClient.post('/api/auth/login', { loginId, password })
    return data
  } catch (error) {
    throw authError(error, '로그인에 실패했습니다.')
  }
}

export async function exchangeDiscordCode(code, redirectUri) {
  try {
    const { data } = await axiosClient.post('/api/auth/login/discord', { code, redirectUri })
    return data
  } catch (error) {
    throw authError(error, 'Discord 로그인에 실패했습니다.')
  }
}

export async function setupDiscordAccount(accountSetupToken, loginId, password) {
  try {
    const { data } = await axiosClient.post('/api/auth/discord/account-setup', {
      accountSetupToken,
      loginId,
      password,
    })
    return data
  } catch (error) {
    throw authError(error, '서비스 계정 설정에 실패했습니다.')
  }
}
