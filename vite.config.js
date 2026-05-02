import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html'),
        landing: resolve(__dirname, 'Landing-page.html'),
        login: resolve(__dirname, 'login-page.html'),
        signup: resolve(__dirname, 'signup-page.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
