import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies /api to the Python backend (run `python3 server.py` separately).
// `npm run build` outputs static assets to dist/, which server.py serves in production.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8899'
    }
  },
  build: {
    outDir: 'dist'
  }
});
