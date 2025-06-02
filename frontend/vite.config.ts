import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    watch: {
      usePolling: true,
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        secure: false,
        ws: false
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    manifest: true,
  },
})
