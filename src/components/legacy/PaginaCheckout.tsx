import React, { useEffect, useState } from 'react';
import { brl } from './SecoesAtual';
import type { Cobranca, StatusPix } from '../../pix/usePix';

/**
 * Tela de pagamento, na rota /checkout.
 *
 * Cartão único e centralizado: chamada, valor, QR Code, copia e cola e o passo
 * a passo de como pagar. Abre tanto vindo do checkout quanto direto pela URL
 * (/checkout?p=<paymentId>) — nesse caso os dados vêm do servidor.
 */

const VERDE = '#00c853';
const TEXTO = '#2b2b3b';
const CINZA = '#8a8a93';

interface Props {
  paymentId: string;
  /** Já carregada quando se chega pelo fluxo de doação; nula quando a URL é aberta direto. */
  cobranca: Cobranca | null;
  chamada: string;
  aoVoltar: () => void;
  aoConfirmar?: (valor: number) => void;
}

const Passo: React.FC<{ icone: 'mais' | 'check'; children: React.ReactNode }> = ({ icone, children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
    <span
      aria-hidden
      style={{
        width: 38,
        height: 38,
        flex: 'none',
        borderRadius: '50%',
        background: '#ececed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icone === 'mais' ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#55555c" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#55555c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m4 12.5 5 5L20 6.5" />
        </svg>
      )}
    </span>
    <span style={{ fontSize: 14.5, lineHeight: 1.5, color: '#6b6b73' }}>{children}</span>
  </div>
);

export const PaginaCheckout: React.FC<Props> = ({ paymentId, cobranca, chamada, aoVoltar, aoConfirmar }) => {
  const [dados, setDados] = useState<Cobranca | null>(cobranca);
  const [status, setStatus] = useState<StatusPix>(cobranca?.status ?? 'pending');
  const [carregando, setCarregando] = useState(!cobranca);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [jaAvisou, setJaAvisou] = useState(false);

  // Chegou pela URL: busca o QR e o copia e cola no servidor.
  useEffect(() => {
    if (cobranca || !paymentId) return;
    let vivo = true;
    fetch(`/api/pix/cobranca/${encodeURIComponent(paymentId)}/dados`)
      .then(r => r.json())
      .then(d => {
        if (!vivo) return;
        if (d?.copiaECola) {
          setDados(d);
          setStatus(d.status);
        } else {
          setErro(d?.mensagem ?? 'Não encontramos esse pagamento.');
        }
      })
      .catch(() => vivo && setErro('Não foi possível carregar o pagamento.'))
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, [paymentId, cobranca]);

  // Enquanto está pendente, pergunta ao servidor se o PIX caiu.
  useEffect(() => {
    if (!paymentId || status !== 'pending') return;
    const id = setInterval(async () => {
      try {
        const r = await fetch(`/api/pix/cobranca/${encodeURIComponent(paymentId)}`).then(x => x.json());
        if (r?.status) setStatus(r.status);
      } catch {
        // rede oscilou; a próxima rodada tenta de novo
      }
    }, 5000);
    return () => clearInterval(id);
  }, [paymentId, status]);

  useEffect(() => {
    if (status === 'completed' && !jaAvisou && dados) {
      setJaAvisou(true);
      aoConfirmar?.(dados.valor);
    }
  }, [status, jaAvisou, dados, aoConfirmar]);

  const copiar = async () => {
    if (!dados) return;
    try {
      await navigator.clipboard.writeText(dados.copiaECola);
    } catch {
      (document.getElementById('pix-codigo') as HTMLInputElement | null)?.select();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const pagina: React.CSSProperties = {
    minHeight: '100vh',
    background: '#f4f5f7',
    fontFamily: "'Poppins', sans-serif",
    padding: '40px 16px 60px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
  };

  const cartao: React.CSSProperties = {
    width: '100%',
    maxWidth: 440,
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 2px 18px rgba(20,20,30,.07)',
    padding: '34px 28px 32px',
    boxSizing: 'border-box',
    textAlign: 'center',
  };

  if (carregando) {
    return (
      <div style={pagina}>
        <div style={{ ...cartao, color: CINZA, fontSize: 15 }}>Carregando o pagamento…</div>
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <div style={pagina}>
        <div style={cartao}>
          <div style={{ fontSize: 18, fontWeight: 700, color: TEXTO }}>Pagamento não encontrado</div>
          <p style={{ margin: '12px 0 22px', fontSize: 14.5, lineHeight: 1.6, color: CINZA }}>{erro}</p>
          <button
            type="button"
            onClick={aoVoltar}
            style={{
              width: '100%',
              height: 52,
              background: VERDE,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontFamily: 'inherit',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Voltar para a vaquinha
          </button>
        </div>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div style={pagina}>
        <div style={cartao}>
          <div
            style={{
              width: 74,
              height: 74,
              borderRadius: '50%',
              background: '#e8f9ef',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={VERDE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m4 12.5 5 5L20 6.5" />
            </svg>
          </div>
          <div style={{ fontSize: 21, fontWeight: 800, color: TEXTO, marginTop: 20 }}>Doação confirmada!</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: VERDE, marginTop: 8 }}>{brl(dados.valor)}</div>
          <p style={{ margin: '14px 0 24px', fontSize: 14.5, lineHeight: 1.6, color: '#6b6b73' }}>
            Obrigado por ajudar. Sua doação já entrou no total da vaquinha.
          </p>
          <button
            type="button"
            onClick={aoVoltar}
            style={{
              width: '100%',
              height: 54,
              background: VERDE,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontFamily: 'inherit',
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: '.4px',
              cursor: 'pointer',
            }}
          >
            VOLTAR PARA A VAQUINHA
          </button>
        </div>
      </div>
    );
  }

  const expirado = status === 'expired' || status === 'cancelled' || status === 'refunded';

  return (
    <div style={pagina}>
      <div style={cartao}>
        <img
          src="/vakinha-logo.webp"
          alt=""
          style={{
            width: 46,
            height: 46,
            objectFit: 'contain',
            borderRadius: '50%',
            border: '1px solid #ececf1',
            padding: 6,
            boxSizing: 'border-box',
            display: 'block',
            margin: '0 auto',
          }}
        />

        <h1 style={{ margin: '18px 0 0', fontSize: 19, fontWeight: 800, color: '#1f1f27', textWrap: 'balance' }}>
          {chamada} <span aria-hidden>💗</span>
        </h1>
        <p style={{ margin: '10px 0 0', fontSize: 13.5, color: '#a0a0a8', lineHeight: 1.5 }}>
          Finalize o pagamento abaixo para confirmar sua doação!
        </p>

        <div style={{ marginTop: 18, fontSize: 17, color: '#55555c' }}>
          Valor total: <strong style={{ color: VERDE, fontSize: 19 }}>{brl(dados.valor)}</strong>
        </div>

        <p style={{ margin: '22px 0 0', fontSize: 15, lineHeight: 1.6, color: '#55555c', textWrap: 'balance' }}>
          Escaneie o QR Code ou copie o código Pix abaixo para finalizar o pagamento.
        </p>

        <div
          style={{
            margin: '20px auto 0',
            width: 'fit-content',
            border: '1px solid #ececf1',
            borderRadius: 10,
            padding: 12,
            background: '#fff',
          }}
        >
          <img
            src={dados.imagemQr}
            alt="QR Code do PIX"
            style={{ width: 168, height: 168, display: 'block' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '26px 0 16px' }}>
          <div style={{ flex: 1, height: 1, background: '#ececf1' }} />
          <span style={{ fontSize: 13.5, color: '#a0a0a8' }}>ou</span>
          <div style={{ flex: 1, height: 1, background: '#ececf1' }} />
        </div>

        <input
          id="pix-codigo"
          readOnly
          value={dados.copiaECola}
          onFocus={e => e.currentTarget.select()}
          aria-label="Código Pix copia e cola"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            border: '1px solid #e2e2e8',
            borderRadius: 8,
            padding: '13px 14px',
            fontSize: 13.5,
            fontFamily: 'inherit',
            color: '#55555c',
            background: '#fff',
            outline: 'none',
            textOverflow: 'ellipsis',
          }}
        />

        <button
          type="button"
          onClick={copiar}
          style={{
            width: '100%',
            marginTop: 12,
            height: 56,
            background: copiado ? '#00a846' : VERDE,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontFamily: 'inherit',
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: '.6px',
            cursor: 'pointer',
          }}
        >
          {copiado ? 'CÓDIGO COPIADO!' : 'COPIAR CÓDIGO PIX'}
        </button>

        {expirado && (
          <div
            role="alert"
            style={{
              marginTop: 16,
              background: '#fdeaea',
              border: '1px solid #f3b0b0',
              borderRadius: 10,
              padding: '12px 14px',
              fontSize: 13.5,
              color: '#992020',
              lineHeight: 1.55,
            }}
          >
            Este código não vale mais. Volte para a vaquinha e gere outro para doar.
          </div>
        )}

        <div
          style={{
            marginTop: 22,
            background: '#f7f7f9',
            borderRadius: 12,
            padding: '18px 18px 20px',
            textAlign: 'left',
          }}
        >
          <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 800, color: TEXTO, marginBottom: 16 }}>
            Como pagar?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Passo icone="mais">
              Escaneie o QR Code ou copie e cole o código Pix em seu app bancário ou carteira digital.
            </Passo>
            <Passo icone="check">Seu pagamento será aprovado em alguns instantes.</Passo>
          </div>
        </div>

        <button
          type="button"
          onClick={aoVoltar}
          style={{
            marginTop: 20,
            border: 'none',
            background: 'none',
            font: 'inherit',
            fontSize: 14,
            fontWeight: 700,
            color: CINZA,
            cursor: 'pointer',
          }}
        >
          voltar para a vaquinha
        </button>
      </div>
    </div>
  );
};
