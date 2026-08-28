/**
 * Cliente da API PixGo (https://pixgo.org/api/v1/docs?lang=pt).
 *
 * Mora só no servidor: a chave (X-API-Key) nunca pode chegar ao navegador —
 * é a primeira recomendação da própria documentação.
 */

const BASE = 'https://pixgo.org/api/v1';

/** Regras de valor da PixGo: mínimo fixo de R$ 10; o teto por QR Code varia com o nível da conta (R$ 300 no nível 1, R$ 6.000 no máximo). */
export const VALOR_MINIMO = 10;
export const VALOR_MAXIMO = 6000;

export type StatusPagamento = 'pending' | 'completed' | 'expired' | 'cancelled' | 'refunded';

export interface CobrancaCriada {
  payment_id: string;
  external_id?: string;
  amount: number;
  status: StatusPagamento;
  /** Payload "copia e cola" (BR Code). */
  qr_code: string;
  qr_image_url: string;
  expires_at: string;
  created_at: string;
}

export interface DadosCobranca {
  amount: number;
  description?: string;
  /** CPF/CNPJ de quem vai pagar, só dígitos. Obrigatório desde 25/06/2026. */
  receiver_cpf: string;
  receiver_name?: string;
  receiver_email?: string;
  receiver_phone?: string;
  external_id?: string;
  webhook_url?: string;
}

export class ErroPixGo extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    mensagem: string
  ) {
    super(mensagem);
    this.name = 'ErroPixGo';
  }
}

function chave(): string {
  const k = process.env.PIXGO_API_KEY;
  if (!k) {
    throw new ErroPixGo(
      503,
      'SEM_CHAVE',
      'PIXGO_API_KEY não configurada. Copie .env.example para .env e preencha com a chave do dashboard da PixGo.'
    );
  }
  return k;
}

async function chamar<T>(caminho: string, init?: RequestInit): Promise<{ dados: T; http: number }> {
  const resp = await fetch(`${BASE}${caminho}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': chave(),
      ...(init?.headers ?? {}),
    },
  });

  const texto = await resp.text();
  let corpo: any = null;
  try {
    corpo = texto ? JSON.parse(texto) : null;
  } catch {
    throw new ErroPixGo(502, 'RESPOSTA_INVALIDA', `A PixGo respondeu ${resp.status} em formato inesperado.`);
  }

  // 410 não é erro: é um pagamento que chegou a estado final e não muda mais.
  if (!resp.ok && resp.status !== 410) {
    throw new ErroPixGo(
      resp.status,
      corpo?.error ?? 'ERRO_PIXGO',
      corpo?.message ?? `A PixGo respondeu ${resp.status}.`
    );
  }

  return { dados: corpo?.data as T, http: resp.status };
}

/**
 * Cria a cobrança PIX.
 *
 * A documentação lista os campos do pagador como `receiver_*` na seção de
 * parâmetros e como `customer_*` nos exemplos de código. Mando `receiver_*`
 * (a seção normativa, e a que o aviso de 25/06/2026 cita) e, se a API recusar
 * por campo faltando, repito com `customer_*` antes de desistir.
 */
export async function criarCobranca(dados: DadosCobranca): Promise<CobrancaCriada> {
  try {
    const { dados: criada } = await chamar<CobrancaCriada>('/payment/create', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
    return criada;
  } catch (e) {
    const recusaDeCampo =
      e instanceof ErroPixGo && e.status === 400 && /cpf|obrigat|required|missing|field/i.test(e.message);
    if (!recusaDeCampo) throw e;

    const { receiver_cpf, receiver_name, receiver_email, receiver_phone, ...resto } = dados;
    const { dados: criada } = await chamar<CobrancaCriada>('/payment/create', {
      method: 'POST',
      body: JSON.stringify({
        ...resto,
        customer_cpf: receiver_cpf,
        customer_name: receiver_name,
        customer_email: receiver_email,
        customer_phone: receiver_phone,
      }),
    });
    return criada;
  }
}

export interface StatusCobranca {
  payment_id: string;
  external_id?: string;
  amount: number;
  status: StatusPagamento;
  customer_name?: string;
  /** Vem mascarado (***.456.789-**); a API nunca devolve o documento completo. */
  customer_cpf?: string;
  created_at: string;
  updated_at: string;
}

export async function consultarStatus(paymentId: string): Promise<StatusCobranca> {
  const { dados } = await chamar<StatusCobranca>(`/payment/${encodeURIComponent(paymentId)}/status`);
  return dados;
}

export interface DetalhesCobranca extends CobrancaCriada {
  description?: string;
}

/**
 * Detalhes completos, com o QR e o copia e cola — é o que permite abrir
 * /checkout direto pela URL e remontar a tela de pagamento.
 * Um pagamento em estado final responde 410, que aqui não é erro.
 */
export async function consultarDetalhes(paymentId: string): Promise<DetalhesCobranca> {
  const { dados } = await chamar<DetalhesCobranca>(`/payment/${encodeURIComponent(paymentId)}`);
  return dados;
}

/** Estados que não mudam mais — o front pode parar de perguntar. */
export function ehFinal(status: StatusPagamento): boolean {
  return status !== 'pending';
}
