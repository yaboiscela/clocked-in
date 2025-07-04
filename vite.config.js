import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  define: {
    'process.env.MY_VAR': JSON.stringify(process.env.MY_VAR),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
  base: './',
  server: {
    host: '0.0.0.0', // ← this allows access from your phone
    proxy: {
      '/api': {
        target: 'http://192.168.1.2:5000', // ← replace with your PC's IP
        changeOrigin: true
      }
    }
  },
  plugins: [
    tailwindcss(),
    react()
  ],
});

