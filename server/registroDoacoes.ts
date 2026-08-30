import crypto from 'node:crypto';
import type { StatusPagamento } from './pixgo';

/**
 * Grava no banco o que o fluxo de doação faz, para o painel mostrar a realidade.
 *
 * As rotas de PIX guardavam tudo em memória: bastava reiniciar o servidor para
 * a campanha inteira sumir, e o painel nunca via nada. Aqui o registro vira
 * linha no banco — sem mudar uma vírgula do que o site já faz.
 *
 * Regra de ouro deste arquivo: NADA aqui pode derrubar uma doação. Se o banco
 * estiver fora, o doador continua pagando e o painel é que fica desatualizado —
 * nunca o contrário. Por isso todo erro é registrado e engolido.
 */

/** Import tardio: sem `prisma generate` o site sobe do mesmo jeito, só sem painel. */
let prismaPromessa: Promise<any> | null = null;
async function banco(): Promise<any | null> {
  if (!prismaPromessa) {
    prismaPromessa = import('@prisma/client')
      .then(({ PrismaClient }) => new PrismaClient())
      .catch((erro) => {
        console.warn('[doacoes] banco indisponível, painel não será alimentado:', erro?.message ?? erro);
        return null;
      });
  }
  return prismaPromessa;
}

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
    const db = await banco();
    if (!db) return;

    await db.doacao.create({
      data: {
        nome: nova.nome?.trim() || 'Doador anônimo',
        email: nova.email?.trim() || '',
        valor: Math.round(nova.valor * 100),
        pixgoPaymentId: nova.paymentId,
        pixgoStatus: nova.status,
        pixKey: nova.copiaECola,
        status: traduzirStatus(nova.status),
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
    const db = await banco();
    if (!db) return;

    const doacao = await db.doacao.findUnique({ where: { pixgoPaymentId: paymentId } });
    if (!doacao) return;

    const novo = traduzirStatus(status);
    if (doacao.status === novo) return;

    // Uma doação já entregue não volta atrás por causa de uma consulta atrasada.
    if (doacao.status === 'entregue') return;

    await db.doacao.update({
      where: { id: doacao.id },
      data: { status: novo, pixgoStatus: status },
    });

    await db.evento.create({
      data: {
        doacaoId: doacao.id,
        tipo: novo,
        dados: JSON.stringify({ pixgoStatus: status }),
      },
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
    const db = await banco();
    if (!db) return;
    await db.webhookPixgo.create({ data: { tipo, dados, processado: true } });
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

async function enviarFacebook(doacao: any): Promise<void> {
  const pixelId = process.env.FACEBOOK_PIXEL_ID;
  const token = process.env.FACEBOOK_API_TOKEN;
  if (!pixelId || !token) return;

  try {
    const { default: axios } = await import('axios');
    const eventId = `doacao-${doacao.id}`;

    await axios.post(
      `https://graph.facebook.com/v21.0/${pixelId}/events`,
      {
        data: [
          {
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            // Mesmo id do Pixel do navegador: o Facebook junta os dois em vez de contar duas vendas.
            event_id: eventId,
            action_source: 'website',
            user_data: {
              em: hash(doacao.email),
              ph: hash(doacao.whatsapp?.replace(/\D/g, '')),
            },
            custom_data: { value: doacao.valor / 100, currency: 'BRL' },
          },
        ],
      },
      { params: { access_token: token }, timeout: 8000 },
    );

    const db = await banco();
    if (db) {
      await db.doacao.update({ where: { id: doacao.id }, data: { facebookEventId: eventId } });
    }
  } catch (erro: any) {
    console.error('[doacoes] falhou ao enviar o evento ao Facebook:', erro?.message ?? erro);
  }
}
