import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Node/Express API (articles, auth)
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
      },
      // Django Python API (LLM-powered FAQ generation)
      '/python-api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/python-api/, ''),
      },
    },
    watch: {
      ignored: ['**/django_faq/**', '**/*.sqlite3', '**/*.sqlite3-*'],
    }
  }
})
