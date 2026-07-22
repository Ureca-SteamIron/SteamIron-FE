import axios from 'axios'
import { API_BASE_URL } from '../constants/auth'

// API 주소는 auth.js에서 접속 주소 기준으로 계산한 값을 그대로 쓴다.
// (Tailscale IP가 사람마다 달라 env로 고정하면 다른 IP인 사람이 붙지 못함)
const axiosClient = axios.create({
  baseURL: API_BASE_URL,
})

const AUTH_STORAGE_KEY = 'steamiron.auth'
let refreshPromise = null

function readSession() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

axiosClient.interceptors.request.use((config) => {
  const session = readSession()
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isAuthRequest = originalRequest?.url?.includes('/api/auth/')

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isAuthRequest) {
      return Promise.reject(error)
    }

    const session = readSession()
    if (!session?.refreshToken) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return Promise.reject(new Error('로그인이 만료되었습니다. 다시 로그인해주세요.'))
    }

    originalRequest._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = axios.post(`${API_BASE_URL}/api/auth/reissue`, {
          refreshToken: session.refreshToken,
        })
      }

      const { data } = await refreshPromise
      const renewedSession = {
        ...session,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(renewedSession))

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
      return axiosClient(originalRequest)
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return Promise.reject(new Error('로그인이 만료되었습니다. 다시 로그인해주세요.'))
    } finally {
      refreshPromise = null
    }
  },
)

export default axiosClient
