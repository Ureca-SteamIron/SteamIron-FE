import axios from 'axios'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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