import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss({
      config: './tailwind.config.js',
      autoprefixer: true,
    })
  ],
  optimizeDeps: {
    include: ['react', 'react-dom', 'socket.io-client'],
    exclude: ['@tailwindcss/vite'] 
  },
})
