import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Conversa com as rotas /api/pix do próprio servidor — nunca com a PixGo
 * direto: a chave da API não pode existir no navegador.
 */

export type StatusPix = 'pending' | 'completed' | 'expired' | 'cancelled' | 'refunded';

export interface Cobranca {
  paymentId: string;
  valor: number;
  status: StatusPix;
  copiaECola: string;
  imagemQr: string;
  expiraEm: string;
}

export interface DadosDoador {
  valor: number;
  cpf: string;
  nome: string;
  email?: string;
}

async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(url, init);
  const corpo = await resp.json().catch(() => null);
  if (!resp.ok) {
    throw new Error(corpo?.mensagem ?? 'Não foi possível falar com o servidor.');
  }
  return corpo as T;
}

/** Intervalo entre consultas. A PixGo limita o endpoint de status a 1.000 chamadas por dia na conta inteira. */
const INTERVALO_MS = 5000;
/** Depois disso a gente para de perguntar sozinho e deixa o botão "Já paguei" no comando. */
const TETO_CONSULTAS = 120;

export function usePix(campanha: string) {
  const [cobranca, setCobranca] = useState<Cobranca | null>(null);
  const [status, setStatus] = useState<StatusPix | null>(null);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [configurado, setConfigurado] = useState<boolean | null>(null);
  // Faixa aceita pela doação; quem manda é o servidor, o formulário só reflete.
  const [limites, setLimites] = useState({ minimo: 10, maximo: 1000 });
  const consultas = useRef(0);

  useEffect(() => {
    pedir<{ configurado: boolean; valorMinimo: number; valorMaximo: number }>('/api/pix/config')
      .then(c => {
        setConfigurado(c.configurado);
        if (c.valorMinimo && c.valorMaximo) setLimites({ minimo: c.valorMinimo, maximo: c.valorMaximo });
      })
      .catch(() => setConfigurado(false));
  }, []);

  const criar = useCallback(
    async (dados: DadosDoador) => {
      setCriando(true);
      setErro(null);
      try {
        const nova = await pedir<Cobranca>('/api/pix/cobranca', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...dados, campanha }),
        });
        consultas.current = 0;
        setCobranca(nova);
        setStatus(nova.status);
        return nova;
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Falha ao gerar o PIX.');
        return null;
      } finally {
        setCriando(false);
      }
    },
    [campanha]
  );

  const conferir = useCallback(async () => {
    if (!cobranca) return null;
    try {
      const r = await pedir<{ status: StatusPix }>(`/api/pix/cobranca/${cobranca.paymentId}`);
      setStatus(r.status);
      return r.status;
    } catch {
      return null;
    }
  }, [cobranca]);

  // Enquanto o PIX está pendente, pergunta de tempos em tempos se caiu.
  useEffect(() => {
    if (!cobranca || status !== 'pending') return;
    const id = setInterval(() => {
      if (consultas.current >= TETO_CONSULTAS) {
        clearInterval(id);
        return;
      }
      consultas.current += 1;
      void conferir();
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [cobranca, status, conferir]);

  const limpar = useCallback(() => {
    setCobranca(null);
    setStatus(null);
    setErro(null);
    consultas.current = 0;
  }, []);

  return { cobranca, status, criando, erro, configurado, limites, criar, conferir, limpar, setErro };
}

/** CPF/CNPJ pelos dígitos verificadores — o servidor confere de novo. */
export function documentoValido(doc: string): boolean {
  const d = doc.replace(/\D/g, '');
  if (d.length === 11) {
    if (/^(\d)\1{10}$/.test(d)) return false;
    for (const [ate, pos] of [[9, 10], [10, 11]] as const) {
      let soma = 0;
      for (let i = 0; i < ate; i++) soma += Number(d[i]) * (pos - i);
      if (((soma * 10) % 11) % 10 !== Number(d[ate])) return false;
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
      if ((resto < 2 ? 0 : 11 - resto) !== Number(d[ate])) return false;
    }
    return true;
  }
  return false;
}

/** Digitação em centavos: "1550" vira "15,50"; o valor sempre fica legível enquanto se digita. */
export function formatarValorDigitado(v: string): string {
  const digitos = v.replace(/\D/g, '').slice(0, 8);
  if (!digitos) return '';
  return (Number(digitos) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Desfaz o formato acima: "1.234,56" vira 1234.56. */
export function valorDigitadoParaNumero(v: string): number {
  const digitos = v.replace(/\D/g, '');
  return digitos ? Number(digitos) / 100 : NaN;
}

export function formatarDocumento(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}
