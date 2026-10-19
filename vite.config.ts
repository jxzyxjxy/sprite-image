import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 以相对路径引用构建产物，便于在任意子路径下部署
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    hmr: {
      path: '/hot/vite-hmr',
      port: 6000,
      clientPort: 6000,
    },
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
});
