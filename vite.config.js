import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // This handles both GitHub Pages (/Software/) and Localhost (/)
// Replace the old base line with this one:
base: import.meta.env.PROD ? '/Software/' : '/',
})