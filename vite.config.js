import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 0.0.0.0 바인딩 → 같은 tailnet의 다른 기기에서 http://<이-머신-tailscale-IP>:5173 로 접근 가능
    host: true,
    port: 5173,
  },
})
