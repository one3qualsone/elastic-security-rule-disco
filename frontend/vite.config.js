export default {
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
    outDir: 'dist'
  },
  preview: {
    host: '0.0.0.0',
    port: 3000
  }
}