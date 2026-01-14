import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5050,
    strictPort: true,
    proxy: {
      // Proxy WebSocket connections to the backend
      '/ws': {
        target: 'ws://localhost:5060',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws/, '')
      }
    }
  },
  preview: {
    port: 5050,
    strictPort: true
  }
})
