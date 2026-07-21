import axios from 'axios'
import { API_BASE_URL } from '../constants/auth'

// API 주소는 auth.js에서 접속 주소 기준으로 계산한 값을 그대로 쓴다.
// (Tailscale IP가 사람마다 달라 env로 고정하면 다른 IP인 사람이 붙지 못함)
const axiosClient = axios.create({
  baseURL: API_BASE_URL,
})

axiosClient.interceptors.request.use((config) => {
  const authData = localStorage.getItem('steamiron.auth')
  if (authData) {
    const { accessToken } = JSON.parse(authData)
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
  }
  return config
})

export default axiosClient