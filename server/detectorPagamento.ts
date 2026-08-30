import { consultarStatus } from './pixgo';
import { prisma } from './banco';
import { atualizarStatusDoacao } from './registroDoacoes';

/**
 * Descobre sozinho quem pagou, perguntando à PixGo.
 *
 * O caminho normal seria o webhook, mas a configuração de webhook não está
 * disponível nesta conta PixGo. Sem isso, a única confirmação vinha da aba do
 * doador perguntando o status — e quem paga e fecha o navegador (a maioria, no
 * celular) nunca era contado. A venda existia, o painel não sabia, e o anúncio
 * ficava sem conversão para otimizar.
 *
 * O cuidado central aqui é a cota: o /status da PixGo tem teto de mil chamadas
 * por dia na CONTA INTEIRA, e a tela de pagamento já gasta uma a cada cinco
 * segundos enquanto o doador espera. Por isso este detector não fica varrendo
 * tudo: cada doação é consultada em momentos escolhidos, e só enquanto ainda
 * faz sentido ela ser paga.
 */

/**
 * Minutos após a criação em que vale a pena perguntar. Concentrados no começo
 * porque quase todo Pix é pago nos primeiros minutos; depois disso, a chance de
 * pagamento cai mais rápido do que o custo de continuar perguntando.
 */
const MOMENTOS_MINUTOS = [2, 4, 7, 12, 20, 30];

/** Depois disso o Pix já expirou; insistir é gastar cota à toa. */
const IDADE_MAXIMA_MINUTOS = 35;

const INTERVALO_MS = 60_000;

/** Quantas verificações já foram feitas para cada cobrança, nesta execução. */
const jaVerificadas = new Map<string, number>();

function minutosDesde(data: Date): number {
  return (Date.now() - new Date(data).getTime()) / 60_000;
}

async function rodada(): Promise<void> {
  const pendentes = await prisma.doacao.findMany({ where: { status: 'pendente' } });

  for (const doacao of pendentes) {
    const paymentId = doacao.pixgoPaymentId as string | undefined;
    if (!paymentId) continue;

    const idade = minutosDesde(doacao.criadoEm);

    if (idade > IDADE_MAXIMA_MINUTOS) {
      jaVerificadas.delete(paymentId);
      continue;
    }

    // Pergunta uma única vez por momento previsto: se já passamos de dois
    // momentos e já fizemos duas consultas, não há nada novo a fazer agora.
    const feitas = jaVerificadas.get(paymentId) ?? 0;
    const devidas = MOMENTOS_MINUTOS.filter((m) => idade >= m).length;
    if (devidas <= feitas) continue;

    try {
      const status = await consultarStatus(paymentId);
      jaVerificadas.set(paymentId, feitas + 1);

      if (status.status !== 'pending') {
        await atualizarStatusDoacao(paymentId, status.status);
        jaVerificadas.delete(paymentId);
        if (status.status === 'completed') {
          console.log(`[detector] pagamento confirmado: ${paymentId}`);
        }
      }
    } catch (erro: any) {
      // Cota estourada, instabilidade da PixGo, rede: tenta de novo na próxima
      // rodada. Contar como verificação faria a doação perder o momento dela.
      console.error(`[detector] falhou ao consultar ${paymentId}:`, erro?.message ?? erro);
    }
  }
}

export function iniciarDetectorDePagamento(): void {
  if (!process.env.PIXGO_API_KEY) return;

  const timer = setInterval(() => {
    void rodada().catch((erro) => console.error('[detector] rodada falhou:', erro));
  }, INTERVALO_MS);

  // Não segura o processo: um `npm start` continua encerrando com Ctrl+C.
  timer.unref?.();

  console.log('Detector de pagamento ligado (a PixGo desta conta não oferece webhook).');
}
