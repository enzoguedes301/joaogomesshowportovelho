import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import compression from 'compression';
import express from 'express';
import { EM_MANUTENCAO, PAGINA_MANUTENCAO } from './manutencao';
import { criarRotasPix } from './rotasPix';

/**
 * Servidor de produção: serve o `dist/` do Vite e as rotas de PIX.
 * Em desenvolvimento essas mesmas rotas são montadas dentro do Vite
 * (ver vite.config.ts), então `npm run dev` sozinho já doa.
 *
 *   npm run build && npm start
 */

const raiz = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const porta = Number(process.env.PORT ?? 3100);

app.set('trust proxy', 1);
app.use(compression({ level: 6 }));

if (EM_MANUTENCAO) {
  // 503 e no-store: assim nem a CDN nem o navegador guardam esta página, e o
  // site volta na hora em que a manutenção for desligada.
  app.use((_req, res) => {
    res
      .status(503)
      .set('Cache-Control', 'no-store')
      .set('Retry-After', '3600')
      .type('html')
      .send(PAGINA_MANUTENCAO);
  });
} else {
  app.use('/api', criarRotasPix());

  // O bundle de produção (`npm run build`) fica na raiz do projeto, ao lado do
  // `dist/`; rodando pelo fonte, este arquivo está um nível abaixo, em `server/`.
  const dist = [path.resolve(raiz, 'dist'), path.resolve(raiz, '..', 'dist')]
    .find((caminho) => fs.existsSync(caminho)) ?? path.resolve(raiz, '..', 'dist');

  app.use(express.static(dist, {
    maxAge: '1y',
    etag: false,
    setHeaders(res, path) {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
      }
    }
  }));

  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(porta, () => {
  console.log(`Doar é Amor no ar em http://localhost:${porta}`);
  if (!process.env.PIXGO_API_KEY) {
    console.warn('Sem PIXGO_API_KEY: o botão "Quero Ajudar" abre o modal, mas não gera cobrança.');
  }
});
