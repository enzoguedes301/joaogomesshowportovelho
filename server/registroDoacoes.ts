import crypto from 'node:crypto';
import type { StatusPagamento } from './pixgo';
import { prisma } from './banco';

/**
 * Grava no banco o que o fluxo de doação faz, para o painel mostrar a realidade.
 *
 * As rotas de PIX guardavam tudo em memória: bastava reiniciar o servidor para
 * a campanha inteira sumir, e o painel nunca via nada. Aqui o registro vira
 * linha no banco — sem mudar uma vírgula do que o site já faz.
 *
 * Regra de ouro deste arquivo: NADA aqui pode derrubar uma doação. Se a
 * gravação falhar, o doador continua pagando e o painel é que fica
 * desatualizado — nunca o contrário. Por isso todo erro é registrado e engolido.
 */

/** O status da PixGo traduzido para o vocabulário do painel. */
function traduzirStatus(status: StatusPagamento): 'pendente' | 'pago' | 'cancelado' {
  if (status === 'completed') return 'pago';
  if (status === 'pending') return 'pendente';
  return 'cancelado';
}

export interface DoacaoNova {
  paymentId: string;
  /** Em reais, como o formulário manda. O banco guarda em centavos. */
  valor: number;
  nome?: string;
  email?: string;
  copiaECola?: string;
  status: StatusPagamento;
}

export async function registrarDoacao(nova: DoacaoNova): Promise<void> {
  try {
    await prisma.doacao.create({
      data: {
        nome: nova.nome?.trim() || 'Doador anônimo',
        email: nova.email?.trim() || '',
        valor: Math.round(nova.valor * 100),
        pixgoPaymentId: nova.paymentId,
        pixgoStatus: nova.status,
        pixKey: nova.copiaECola,
        status: traduzirStatus(nova.status),
        entregueEm: null,
        facebookEventId: null,
      },
    });
  } catch (erro) {
    console.error('[doacoes] falhou ao registrar a doação:', erro);
  }
}

/**
 * Move a doação para o status novo. Só age quando algo muda de verdade, porque
 * o front pergunta o status de segundo em segundo enquanto o Pix está aberto.
 */
export async function atualizarStatusDoacao(
  paymentId: string,
  status: StatusPagamento,
): Promise<void> {
  try {
    const doacao = await prisma.doacao.findUnique({ where: { pixgoPaymentId: paymentId } });
    if (!doacao) return;

    const novo = traduzirStatus(status);
    if (doacao.status === novo) return;

    // Uma doação já entregue não volta atrás por causa de uma consulta atrasada.
    if (doacao.status === 'entregue') return;

    await prisma.doacao.update({
      where: { pixgoPaymentId: paymentId },
      data: { status: novo, pixgoStatus: status },
    });

    await prisma.evento.create({
      data: { doacaoId: doacao.id, tipo: novo, dados: JSON.stringify({ pixgoStatus: status }) },
    });

    if (novo === 'pago') {
      await enviarFacebook({ ...doacao, status: novo });
    }
  } catch (erro) {
    console.error('[doacoes] falhou ao atualizar o status:', erro);
  }
}

/** Guarda o webhook bruto: quando algo não bate, é aqui que se descobre por quê. */
export async function registrarWebhook(tipo: string, dados: string): Promise<void> {
  try {
    await prisma.webhookPixgo.create({ data: { tipo, dados, processado: true } });
  } catch (erro) {
    console.error('[doacoes] falhou ao registrar o webhook:', erro);
  }
}

/** A API de conversões exige os dados pessoais em SHA-256, nunca em claro. */
function hash(valor?: string | null): string | undefined {
  const limpo = valor?.trim().toLowerCase();
  if (!limpo) return undefined;
  return crypto.createHash('sha256').update(limpo).digest('hex');
}

/**
 * Manda a compra para o Facebook pelo servidor. É o único ponto que sabe que o
 * dinheiro entrou, e funciona mesmo se o doador fechar a aba ou usar bloqueador.
 *
 * Usa `fetch` do próprio Node de propósito: uma biblioteca HTTP aqui teria de
 * ser instalada no servidor, e é justamente o que não acontece no deploy.
 */
async function enviarFacebook(doacao: any): Promise<void> {
  const pixelId = process.env.FACEBOOK_PIXEL_ID;
  const token = process.env.FACEBOOK_API_TOKEN;
  if (!pixelId || !token) return;

  const eventId = `doacao-${doacao.id}`;

  try {
    const resposta = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          data: [
            {
              event_name: 'Purchase',
              event_time: Math.floor(Date.now() / 1000),
              // Mesmo id do Pixel do navegador: o Facebook junta os dois em vez
              // de contar duas vendas.
              event_id: eventId,
              action_source: 'website',
              event_source_url: process.env.URL_BASE || 'https://correntedobeem.online',
              user_data: {
                em: hash(doacao.email),
                ph: hash(String(doacao.whatsapp ?? '').replace(/\D/g, '')),
              },
              custom_data: { value: doacao.valor / 100, currency: 'BRL' },
            },
          ],
        }),
      },
    );

    const corpo = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
      console.error('[doacoes] Facebook recusou a compra:', JSON.stringify(corpo));
      return;
    }

    console.log(`[doacoes] compra enviada ao Facebook (${eventId})`);
    await prisma.doacao.update({ where: { id: doacao.id }, data: { facebookEventId: eventId } });
  } catch (erro: any) {
    console.error('[doacoes] falhou ao enviar a compra ao Facebook:', erro?.message ?? erro);
  }
}
