import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Placement tool frontend. All data comes from the SHO server
// (/api/placement, /api/auth, /api/lms/auth); in dev those are proxied to
// the local server on 5050, in production VITE_API_URL points at Render.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  envPrefix: ['VITE_', 'GEMINI_API_KEY', 'GROQ_API_KEY', 'APP_URL'],
  server: {
    port: 5176,
    proxy: { '/api': { target: 'http://localhost:5050', changeOrigin: true } },
  },
});
