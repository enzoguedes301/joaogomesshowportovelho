import crypto from 'node:crypto';
import express, { Router } from 'express';
import {
  criarCobranca,
  consultarDetalhes,
  consultarStatus,
  ehFinal,
  ErroPixGo,
  VALOR_MAXIMO,
  VALOR_MINIMO,
  type StatusPagamento,
} from './pixgo';

/**
 * Rotas de doação por PIX. O mesmo router serve o dev (montado dentro do Vite,
 * ver vite.config.ts) e a produção (server/index.ts) — assim não existe uma
 * versão do fluxo que só funciona numa das duas pontas.
 */

/** O que o servidor lembra de cada cobrança. Em memória: é um protótipo, sem banco. */
interface Registro {
  paymentId: string;
  externalId: string;
  valor: number;
  status: StatusPagamento;
  criadoEm: number;
  /** Preenchido pelo webhook; evita bater na PixGo a cada pergunta do navegador. */
  confirmadoPeloWebhook: boolean;
}

const registros = new Map<string, Registro>();

/** Valida CPF (11) ou CNPJ (14) pelos dígitos verificadores. */
export function documentoValido(doc: string): boolean {
  const d = doc.replace(/\D/g, '');
  if (d.length === 11) {
    if (/^(\d)\1{10}$/.test(d)) return false;
    for (const [ate, pos] of [[9, 10], [10, 11]] as const) {
      let soma = 0;
      for (let i = 0; i < ate; i++) soma += Number(d[i]) * (pos - i);
      const dv = ((soma * 10) % 11) % 10;
      if (dv !== Number(d[ate])) return false;
    }
    return true;
  }
  if (d.length === 14) {
    if (/^(\d)\1{13}$/.test(d)) return false;
    const pesos = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (const ate of [12, 13]) {
      const p = pesos.slice(pesos.length - ate);
      let soma = 0;
      for (let i = 0; i < ate; i++) soma += Number(d[i]) * p[i];
      const resto = soma % 11;
      const dv = resto < 2 ? 0 : 11 - resto;
      if (dv !== Number(d[ate])) return false;
    }
    return true;
  }
  return false;
}

/**
 * Teto da campanha. A PixGo aceita até R$ 6.000 por QR Code, mas a doação
 * desta vaquinha vai de R$ 10 a R$ 1.000 — o limite mais apertado é o que vale.
 */
const TETO_CAMPANHA = 1000;
const VALOR_MAXIMO_DOACAO = Math.min(VALOR_MAXIMO, TETO_CAMPANHA);

/** Freio simples por IP: uma apresentação não precisa de mais que isso, e evita rajada acidental. */
const janelas = new Map<string, number[]>();
const LIMITE = 12;
const JANELA_MS = 10 * 60 * 1000;

function passouDoLimite(ip: string): boolean {
  const agora = Date.now();
  const recentes = (janelas.get(ip) ?? []).filter(t => agora - t < JANELA_MS);
  recentes.push(agora);
  janelas.set(ip, recentes);
  return recentes.length > LIMITE;
}

function responderErro(res: express.Response, e: unknown) {
  if (e instanceof ErroPixGo) {
    res.status(e.status === 503 ? 503 : 502).json({ erro: e.codigo, mensagem: e.message });
    return;
  }
  console.error('[pix] falha inesperada:', e);
  res.status(500).json({ erro: 'FALHA', mensagem: 'Não foi possível falar com o provedor de pagamento.' });
}

export function criarRotasPix(): Router {
  const rotas = Router();

  // O webhook precisa do corpo bruto para conferir a assinatura HMAC — por isso
  // vem antes do express.json() e usa o parser de texto.
  rotas.post('/pix/webhook', express.text({ type: '*/*', limit: '256kb' }), (req, res) => {
    const segredo = process.env.PIXGO_WEBHOOK_SECRET;
    const bruto = typeof req.body === 'string' ? req.body : '';
    const assinatura = String(req.header('x-webhook-signature') ?? '');
    const timestamp = String(req.header('x-webhook-timestamp') ?? '');

    if (segredo) {
      const esperada = crypto.createHmac('sha256', segredo).update(`${timestamp}.${bruto}`).digest('hex');
      const a = Buffer.from(esperada, 'hex');
      const b = Buffer.from(assinatura, 'hex');
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        res.status(401).json({ erro: 'ASSINATURA_INVALIDA' });
        return;
      }
      // Barra reenvio de um webhook antigo capturado por terceiros.
      if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
        res.status(401).json({ erro: 'TIMESTAMP_EXPIRADO' });
        return;
      }
    } else {
      console.warn('[pix] webhook recebido sem PIXGO_WEBHOOK_SECRET configurado — assinatura não conferida.');
    }

    try {
      const evento = JSON.parse(bruto || '{}');
      const paymentId: string | undefined = evento?.data?.payment_id;
      const status: StatusPagamento | undefined = evento?.data?.status;
      if (paymentId) {
        const reg = registros.get(paymentId);
        if (reg && status) {
          reg.status = status;
          reg.confirmadoPeloWebhook = true;
        }
        console.log(`[pix] webhook ${evento?.event} para ${paymentId} (${status})`);
      }
    } catch {
      res.status(400).json({ erro: 'PAYLOAD_INVALIDO' });
      return;
    }

    res.status(200).json({ received: true });
  });

  rotas.use(express.json({ limit: '64kb' }));

  rotas.post('/pix/cobranca', async (req, res) => {
    const ip = req.ip ?? 'desconhecido';
    if (passouDoLimite(ip)) {
      res.status(429).json({ erro: 'MUITAS_TENTATIVAS', mensagem: 'Muitas cobranças seguidas. Espere alguns minutos.' });
      return;
    }

    const valor = Number(req.body?.valor);
    const cpf = String(req.body?.cpf ?? '').replace(/\D/g, '');
    const nome = String(req.body?.nome ?? '').trim();
    const email = String(req.body?.email ?? '').trim();
    const campanha = String(req.body?.campanha ?? '').slice(0, 20).replace(/[^\w-]/g, '');

    // Repito no servidor as validações que o formulário já faz: o cliente é palpite, não garantia.
    if (!Number.isFinite(valor) || valor < VALOR_MINIMO || valor > VALOR_MAXIMO_DOACAO) {
      res.status(400).json({
        erro: 'VALOR_INVALIDO',
        mensagem: `O valor precisa ficar entre R$ ${VALOR_MINIMO} e R$ ${VALOR_MAXIMO_DOACAO.toLocaleString('pt-BR')}.`,
      });
      return;
    }
    if (!documentoValido(cpf)) {
      res.status(400).json({ erro: 'CPF_INVALIDO', mensagem: 'Informe um CPF ou CNPJ válido.' });
      return;
    }
    if (nome.length > 0 && (nome.length < 2 || nome.length > 100)) {
      res.status(400).json({ erro: 'NOME_INVALIDO', mensagem: 'O nome deve ter de 2 a 100 caracteres.' });
      return;
    }

    const externalId = `vk-${campanha || 'campanha'}-${Date.now().toString(36)}-${crypto
      .randomBytes(3)
      .toString('hex')}`.slice(0, 50);

    try {
      const cobranca = await criarCobranca({
        amount: Number(valor.toFixed(2)),
        description: `Doação para a vaquinha ${campanha || ''}`.trim().slice(0, 200),
        receiver_cpf: cpf,
        receiver_name: nome || undefined,
        receiver_email: email || undefined,
        external_id: externalId,
        webhook_url: process.env.PIXGO_WEBHOOK_URL || undefined,
      });

      registros.set(cobranca.payment_id, {
        paymentId: cobranca.payment_id,
        externalId,
        valor,
        status: cobranca.status,
        criadoEm: Date.now(),
        confirmadoPeloWebhook: false,
      });

      // Só o que a tela precisa. O documento do doador não volta para o navegador.
      res.status(201).json({
        paymentId: cobranca.payment_id,
        valor: cobranca.amount,
        status: cobranca.status,
        copiaECola: cobranca.qr_code,
        imagemQr: cobranca.qr_image_url,
        expiraEm: cobranca.expires_at,
      });
    } catch (e) {
      responderErro(res, e);
    }
  });

  /** Tudo que a tela de pagamento precisa — é o que faz /checkout abrir direto pela URL. */
  rotas.get('/pix/cobranca/:id/dados', async (req, res) => {
    try {
      const d = await consultarDetalhes(req.params.id);
      res.json({
        paymentId: d.payment_id,
        valor: d.amount,
        status: d.status,
        copiaECola: d.qr_code,
        imagemQr: d.qr_image_url,
        expiraEm: d.expires_at,
      });
    } catch (e) {
      responderErro(res, e);
    }
  });

  rotas.get('/pix/cobranca/:id', async (req, res) => {
    const id = req.params.id;
    const reg = registros.get(id);

    // O webhook já contou o desfecho: não gasto requisição no /status, que tem
    // teto de 1.000 por dia na conta inteira.
    if (reg?.confirmadoPeloWebhook && ehFinal(reg.status)) {
      res.json({ paymentId: id, status: reg.status, valor: reg.valor, via: 'webhook' });
      return;
    }

    try {
      const status = await consultarStatus(id);
      if (reg) reg.status = status.status;
      res.json({
        paymentId: status.payment_id,
        status: status.status,
        valor: status.amount,
        pagador: status.customer_name ?? null,
        via: 'consulta',
      });
    } catch (e) {
      responderErro(res, e);
    }
  });

  /** Diz à tela se dá para doar de verdade, sem nunca revelar a chave. */
  rotas.get('/pix/config', (_req, res) => {
    res.json({
      configurado: Boolean(process.env.PIXGO_API_KEY),
      valorMinimo: VALOR_MINIMO,
      valorMaximo: VALOR_MAXIMO_DOACAO,
    });
  });

  return rotas;
}
