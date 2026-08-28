import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import express from 'express';
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
app.use('/api', criarRotasPix());

// O bundle de produção (`npm run build`) fica na raiz do projeto, ao lado do
// `dist/`; rodando pelo fonte, este arquivo está um nível abaixo, em `server/`.
const dist = [path.resolve(raiz, 'dist'), path.resolve(raiz, '..', 'dist')]
  .find((caminho) => fs.existsSync(caminho)) ?? path.resolve(raiz, '..', 'dist');
app.use(express.static(dist));
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(porta, () => {
  console.log(`Vakinha no ar em http://localhost:${porta}`);
  if (!process.env.PIXGO_API_KEY) {
    console.warn('Sem PIXGO_API_KEY: o botão "Quero Ajudar" abre o modal, mas não gera cobrança.');
  }
});
