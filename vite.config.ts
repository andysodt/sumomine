import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/sumo': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => {
          // Map API endpoints to our mock data file
          if (path.includes('/rikishis')) {
            return '/mock-sumo-data.json';
          }
          return path.replace(/^\/api\/sumo/, '');
        }
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (_err, _req, _res) => {
            // proxy error handling
          });
          proxy.on('proxyReq', (_proxyReq, _req, _res) => {
            // sending request to target
          });
          proxy.on('proxyRes', (_proxyRes, _req, _res) => {
            // received response from target
          });
        },
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
