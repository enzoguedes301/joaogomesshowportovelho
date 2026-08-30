/**
 * Eventos do funil para o Meta Pixel.
 *
 * O PageView já sai do próprio index.html quando a página carrega. Aqui ficam
 * as etapas seguintes — quem abriu a doação e quem virou lead de verdade — para
 * o anúncio conseguir otimizar por quem avança, e não só por quem entra.
 *
 * A compra NÃO é disparada daqui: ela sai do servidor, quando o Pix é
 * confirmado. É o único ponto que sabe que o dinheiro entrou, e continua
 * funcionando mesmo se o doador fechar a aba ou usar bloqueador de anúncios.
 */

type Fbq = (comando: string, evento: string, dados?: Record<string, unknown>) => void;

/**
 * O Pixel pode não estar lá: bloqueador de anúncios, rede lenta, aba aberta
 * antes do script carregar. Rastreio nunca pode derrubar uma doação, então tudo
 * aqui é silencioso.
 */
function fbq(): Fbq | null {
  const f = (window as unknown as { fbq?: Fbq }).fbq;
  return typeof f === 'function' ? f : null;
}

function rastrear(evento: string, dados?: Record<string, unknown>): void {
  try {
    fbq()?.('track', evento, dados);
  } catch {
    // Nada a fazer: o funil é secundário, a doação é que importa.
  }
}

/** Abriu o popup de doação — começou o checkout. */
export function abriuDoacao(): void {
  rastrear('InitiateCheckout', { currency: 'BRL' });
}

/** Escolheu quanto quer doar e foi para os dados pessoais. */
export function escolheuValor(valor: number): void {
  rastrear('AddToCart', { value: valor, currency: 'BRL' });
}

/**
 * Preencheu os dados e o QR Code foi gerado: aqui vira lead de verdade. É a
 * última etapa que depende do doador antes de pagar.
 */
export function virouLead(valor: number): void {
  rastrear('Lead', { value: valor, currency: 'BRL' });
}
