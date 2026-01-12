import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: true, // Show error overlay for better debugging
    },
    watch: {
      // Ensure file changes are detected reliably
      usePolling: false, // Set to true if file changes aren't detected
      interval: 100, // Polling interval (if usePolling is true)
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})

