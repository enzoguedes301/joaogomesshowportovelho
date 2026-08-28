import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
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

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPix()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
