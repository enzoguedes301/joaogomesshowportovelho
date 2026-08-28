# Vakinha — página de campanha (site atual)

Reprodução fiel da página de campanha do **Vakinha** como ela é hoje, em desktop e no celular.

- Desktop: valores (px, cores, pesos) literais do recorte HTML do site.
- Celular: medido de capturas de tela reais (Android, ~411px): uma coluna, foto/título/progresso/valores/corações/resumo/criador num único cartão, abas roláveis, cartão "Sobre" com chave Pix e barra fixa "Quero Ajudar / Compartilhar".

> O conceito de redesign que existia neste repositório foi removido em 16/08/2026. Sobrou só a versão atual.

## Rodar

```bash
npm install
cp .env.example .env   # preencha PIXGO_API_KEY
npm run dev            # http://localhost:3000 (ou a próxima porta livre)

npm run build && npm start   # produção: Express serve dist/ + as rotas de PIX
```

## Doação por PIX (PixGo)

O botão "Quero Ajudar" abre o fluxo de doação: valor → CPF → QR Code → confirmação.
A cobrança é criada pela [API da PixGo](https://pixgo.org/api/v1/docs?lang=pt).

- A chave da API vive **só no servidor** (`.env`), nunca no navegador.
- Em desenvolvimento as rotas são montadas dentro do próprio Vite (`vite.config.ts`),
  então `npm run dev` sozinho já doa — não precisa de segundo processo.
- Confirmação: por webhook (`/api/pix/webhook`, assinatura HMAC conferida) quando
  `PIXGO_WEBHOOK_URL` aponta para um endereço público; senão, por consulta a cada 5s.
- Regras da PixGo respeitadas: mínimo R$ 10, teto de R$ 6.000 por QR e **CPF do pagador
  obrigatório** — só a conta desse CPF consegue pagar o código gerado.

## Estrutura

```
server/
├── index.ts                         # Express de produção (dist/ + /api)
├── rotasPix.ts                      # rotas de cobrança, status e webhook
└── pixgo.ts                         # cliente da API PixGo (só servidor)
src/
├── App.tsx                          # página atual + modal de doação
├── data/mockData.ts                 # dados da campanha (mock)
├── types.ts
├── pix/usePix.ts                    # fala com /api/pix, valida CPF, faz o polling
└── components/legacy/
    ├── VakinhaAtualPage.tsx         # desktop; no celular delega para o mobile
    ├── VakinhaAtualMobile.tsx       # celular
    ├── ModalDoacao.tsx              # doação por PIX (celular e desktop)
    ├── SecoesAtual.tsx              # "Outras histórias", rodapé, barra fixa (compartilhados)
    └── useEhCelular.ts              # matchMedia (< 1024px)
```

## Tecnologias
React 19 · TypeScript · Vite · Tailwind (só utilitários de grid/breakpoint; o visual é inline)
