import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/sitePulse/', // GitHub Pages base path
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  publicDir: '../', // Serve files from repo root (for data files)
})
