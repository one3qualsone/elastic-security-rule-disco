import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://backend:3001',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://backend:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  preview: {
    host: '0.0.0.0',
    port: 3000
  }
})