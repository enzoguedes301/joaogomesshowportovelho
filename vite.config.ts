import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import 'dotenv/config';
import express from 'express';
import {defineConfig, type Plugin} from 'vite';
import {criarRotasPix} from './server/rotasPix';

/**
 * Monta as rotas de PIX dentro do próprio dev server: `npm run dev` sozinho já
 * doa, sem segundo processo nem proxy. São as mesmas rotas que server/index.ts
 * usa em produção — o fluxo é um só.
 */
function apiPix(): Plugin {
  return {
    name: 'vakinha-api-pix',
    configureServer(server) {
      const app = express();
      app.use('/api', criarRotasPix());
      server.middlewares.use(app);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiPix()],
  build: {
    target: 'ES2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        passes: 2,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
    cssMinify: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: true,
  },
});
