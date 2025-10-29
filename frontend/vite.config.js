import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://student-course-management-system-1-3q47.onrender.com',
        changeOrigin: true
      }
    },
    historyApiFallback: true
  }
})
