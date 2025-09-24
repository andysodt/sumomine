import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/sumo': {
        target: 'https://www.sumo-api.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sumo/, '/api')
      },
      '/api/sumo-alt': {
        target: 'https://sumo-api.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sumo-alt/, '/api')
      }
    }
  }
})
