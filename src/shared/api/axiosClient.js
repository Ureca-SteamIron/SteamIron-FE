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
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url?.includes('/api/auth/');

    // 1. 진짜 401 에러가 아니거나, 인증(로그인 등) API에서 난 에러면 그냥 통과
    if (error.response?.status !== 401 || !originalRequest || isAuthRequest) {
      return Promise.reject(error);
    }

    // 2. 🚨 해결 포인트: 401 에러인데 이미 _retry가 true라면 무한 루프 방지를 위해 여기서 강제 로그아웃!
    if (originalRequest._retry) {
      console.log("🛑 이미 재시도한 요청이 또 401 에러를 뱉음! 강제 로그아웃 처리!");
      localStorage.removeItem(AUTH_STORAGE_KEY);
      alert('로그인이 만료되었습니다.');
      window.location.href = '/login';
      return Promise.reject(new Error('로그인이 만료되었습니다.'));
    }

    // 아래부터는 정상적으로 리프레시 토큰을 이용한 재발급 로직 실행
    const session = readSession();
    
    if (!session?.refreshToken) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      alert('로그인이 만료되었습니다.');
      window.location.href = '/login';
      return Promise.reject(new Error('로그인이 만료되었습니다.'));
    }

    originalRequest._retry = true; // 이제서야 이번 요청에 재시도 꼬리표를 붙임

    try {
      if (!refreshPromise) {
        // 기본 axios를 써서 무한 루프 방지
        refreshPromise = axios.post(`${API_BASE_URL}/api/auth/reissue`, {
          refreshToken: session.refreshToken,
        });
      }

      const { data } = await refreshPromise;
      
      const renewedSession = {
        ...session,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(renewedSession));

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return axiosClient(originalRequest);
      
    } catch (err) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      alert('로그인이 만료되었습니다.');
      window.location.href = '/login';
      return Promise.reject(new Error('로그인이 만료되었습니다.'));
    } finally {
      refreshPromise = null;
    }
  },
);


export default axiosClient
