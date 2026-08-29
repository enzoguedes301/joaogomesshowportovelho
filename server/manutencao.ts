/**
 * Modo manutenção.
 *
 * Com `EM_MANUTENCAO` ligado, o servidor responde a página abaixo em qualquer
 * rota — inclusive /api, para que ninguém consiga abrir uma cobrança enquanto
 * a campanha está fora do ar.
 *
 * Para tirar os panos: mudar para `false`, rodar `npm run build` e publicar.
 */
export const EM_MANUTENCAO = true;

export const PAGINA_MANUTENCAO = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Em manutenção</title>
<style>
  html, body {
    height: 100%;
    margin: 0;
    background: #ffffff;
  }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    color: #1a1a1a;
    text-align: center;
    padding: 24px;
  }
  h1 {
    font-size: clamp(1.25rem, 5vw, 2rem);
    font-weight: 600;
    letter-spacing: 0.02em;
    margin: 0;
  }
</style>
</head>
<body>
  <h1>EM MANUTENÇÃO</h1>
</body>
</html>
`;
