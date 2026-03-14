import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    // lightningcss has a bug with certain keyframe patterns — use esbuild instead
    transformer: 'postcss',
  },
})
