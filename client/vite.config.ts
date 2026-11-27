import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4173', changeOrigin: true },
    },
  },
  // Service worker strategy: keep the existing custom SW (background sync,
  // IndexedDB flush, runtime caching) as a static asset in public/sw.js.
  // It is copied verbatim to dist/sw.js by Vite and served at /sw.js.
  // (vite-plugin-pwa injectManifest was evaluated but its injection-point
  //  requirement conflicts with our hand-written SW; the runtime-caching
  //  approach already covers offline needs.)
})
