import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  base: '/bud-lite/',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    open: false,
  },
});
