import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: "/mevsim-gecisi/",
  server: {
    host: true, // hem IPv4 hem IPv6 — her tarayıcıda açılır
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
  },
});
