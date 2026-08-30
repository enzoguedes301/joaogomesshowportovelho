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
  // Rotas da API. As de PIX vêm primeiro e SEM express.json() antes delas: o
  // webhook confere a assinatura HMAC sobre o corpo bruto, e um parser de JSON
  // aqui em cima consumiria esse corpo e faria toda assinatura válida ser
  // recusada. O router de PIX liga o parser sozinho depois do webhook.
  app.use('/api', criarRotasPix());

  // Montado já: as rotas do painel são penduradas nele quando o import abaixo
  // termina. Um Router aceita rotas novas depois de montado, então nada precisa
  // esperar o Prisma para o servidor começar a atender.
  const painel = express.Router();
  app.use('/api', painel);

  /*
   * O painel entra por import tardio, e não no topo do arquivo. Assim, se algo
   * nele quebrar, o pior caso é "o painel não abre" — e não o site inteiro fora
   * do ar, que foi o que já aconteceu quando um import do topo puxou uma
   * biblioteca que não estava instalada no servidor.
   */
  void (async () => {
    try {
      const { default: adminRouter } = await import('./admin');
      painel.use('/admin', express.json(), adminRouter);
      console.log('Painel admin no ar em /admin');

      const { iniciarDetectorDePagamento } = await import('./detectorPagamento');
      iniciarDetectorDePagamento();
    } catch (erro) {
      console.error('Painel admin fora do ar. O site e as doações seguem normais.', erro);
    }
  })();

  // O bundle de produção (`npm run build`) fica na raiz do projeto, ao lado do
  // `dist/`; rodando pelo fonte, este arquivo está um nível abaixo, em `server/`.
  // Por isso cada pasta é procurada nos dois lugares.
  const acharPasta = (nome: string) =>
    [path.resolve(raiz, nome), path.resolve(raiz, '..', nome)]
      .find((caminho) => fs.existsSync(caminho)) ?? path.resolve(raiz, '..', nome);

  const dist = acharPasta('dist');

  // Painel admin ANTES do catch-all do React, senão o index.html do site
  // responderia no lugar dele. `index` aponta para admin.html porque o painel
  // não tem index.html.
  app.use('/admin', express.static(acharPasta('publico-admin'), {index: 'admin.html'}));

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
