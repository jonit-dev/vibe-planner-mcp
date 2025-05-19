import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Updated to backend API server port 3000
        changeOrigin: true,
        // No rewrite needed as backend routes already include /api
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
