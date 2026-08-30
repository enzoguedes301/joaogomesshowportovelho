import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import 'dotenv/config';
import express from 'express';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';
import {criarRotasPix} from './server/rotasPix';

/**
 * Monta as rotas de PIX, a API do painel e o próprio painel dentro do dev
 * server: `npm run dev` sozinho já doa e já abre o /admin, sem segundo processo.
 *
 * O painel entra ANTES dos middlewares internos do Vite — se entrasse depois, o
 * fallback de SPA responderia o index.html do site em /admin. E `index` aponta
 * para admin.html porque o painel não tem index.html.
 */
function apiEPainel(): Plugin {
  return {
    name: 'vakinha-api-painel',
    async configureServer(server) {
      const app = express();
      app.use(
        '/admin',
        express.static(path.resolve(__dirname, 'publico-admin'), {index: 'admin.html'}),
      );

      // Sem express.json() antes daqui: o webhook confere a assinatura HMAC
      // sobre o corpo bruto, e um parser de JSON acima o consumiria — toda
      // assinatura válida passaria a ser recusada.
      app.use('/api', criarRotasPix());

      // Import tardio: essas rotas puxam o Prisma, que só existe depois do
      // `prisma generate`. Sem ele o site continua no ar, só o painel fica mudo.
      try {
        const adminRouter = (await import('./server/admin')).default;
        const pixgoRouter = (await import('./server/pixgo-api')).default;
        app.use('/api/admin', express.json(), adminRouter);
        app.use('/api/pix', express.json(), pixgoRouter);
      } catch (erro) {
        console.warn('[painel] API do admin fora do ar (rode `npx prisma generate`):', erro);
      }

      server.middlewares.use(app);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiEPainel()],
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
