/**
 * Acesso ao banco que só carrega o Prisma quando alguém realmente usa o painel.
 *
 * O motivo é concreto: com `import { PrismaClient } from '@prisma/client'` no
 * topo de um arquivo do painel, o esbuild sobe esse import para o topo do
 * bundle. Um servidor sem `npm install` ou sem `prisma generate` então nem
 * arranca — e o site inteiro cai por causa de uma tela de administração. Foi
 * exatamente assim que a campanha saiu do ar com um 503.
 *
 * Aqui o import é dinâmico e de um pacote externo, coisa que o empacotador
 * mantém dinâmica. O pior caso passa a ser "o painel não abre", com o site e as
 * doações intactos.
 *
 * Uso idêntico ao cliente normal: `await prisma.doacao.findMany({...})`.
 */

let clientePromessa: Promise<any> | null = null;

function cliente(): Promise<any> {
  if (!clientePromessa) {
    clientePromessa = import('@prisma/client').then(({ PrismaClient }) => new PrismaClient());
  }
  return clientePromessa;
}

/**
 * Encaminha `prisma.modelo.metodo(args)` para o cliente de verdade, esperando
 * ele carregar. Todo acesso do painel tem essa forma; nada aqui cobre APIs de
 * primeiro nível como `$transaction`, que exigiriam o cliente já carregado.
 */
export const prisma: any = new Proxy(
  {},
  {
    get(_alvo, modelo: string) {
      return new Proxy(
        {},
        {
          get(_alvo2, metodo: string) {
            return async (...args: unknown[]) => {
              const c = await cliente();
              return c[modelo][metodo](...args);
            };
          },
        },
      );
    },
  },
);
