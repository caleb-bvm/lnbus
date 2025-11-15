import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Esto hace que Vite escuche en 0.0.0.0 (accesible desde tu red)
    port: 5174 // Puerto por defecto de Vite
  }
})
