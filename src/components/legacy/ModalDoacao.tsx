import React, { useEffect, useState } from 'react';
import {
  documentoValido,
  formatarDocumento,
  formatarValorDigitado,
  usePix,
  valorDigitadoParaNumero,
} from '../../pix/usePix';
import type { Cobranca } from '../../pix/usePix';
import { brl } from './SecoesAtual';

/**
 * Popup de doação: escolher o valor e informar quem vai pagar.
 *
 * Termina ao gerar o PIX — daí em diante quem manda é a tela /checkout
 * (PaginaCheckout.tsx), com o QR e o copia e cola.
 */

const VERDE = '#20c05e';
const TEXTO = '#2b2b3b';
const CINZA = '#7e8299';

/** Escada de valores do checkout, de R$ 10 a R$ 1.000. O destaque puxa a doação para cima sem esconder as opções baixas. */
const VALORES = [10, 20, 30, 50, 70, 100, 150, 200, 300, 500, 700, 1000];
const MAIS_ESCOLHIDO = 100;

const emReais = (v: number) => `R$${v.toLocaleString('pt-BR')}`;

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  campanha: string;
  tituloCampanha: string;
  /** Frase acima dos valores sugeridos: "Cada real salva uma vida". */
  chamadaValores: string;
  ehCelular: boolean;
  /** Cobrança criada: o App guarda e leva para /checkout. */
  aoGerarPix: (cobranca: Cobranca) => void;
}

const rotulo: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: TEXTO, marginBottom: 6, display: 'block' };

const campo: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #d9d9de',
  borderRadius: 8,
  padding: '13px 14px',
  fontSize: 16, // abaixo de 16px o iOS dá zoom sozinho ao focar o campo
  fontFamily: 'inherit',
  color: TEXTO,
  background: '#fff',
  outline: 'none',
};

const Fechar: React.FC<{ aoClicar: () => void }> = ({ aoClicar }) => (
  <button
    type="button"
    onClick={aoClicar}
    aria-label="Fechar"
    style={{
      position: 'absolute',
      top: 14,
      right: 14,
      width: 40,
      height: 40,
      borderRadius: '50%',
      border: 'none',
      background: '#f2f2f4',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
    }}
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXTO} strokeWidth="2.5" strokeLinecap="round">
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  </button>
);

export const ModalDoacao: React.FC<Props> = ({
  aberto,
  aoFechar,
  campanha,
  tituloCampanha,
  chamadaValores,
  ehCelular,
  aoGerarPix,
}) => {
  const { criando, erro, configurado, limites, criar, limpar, setErro } = usePix(campanha);

  // O checkout tem dois passos antes do QR: escolher o valor e preencher os dados.
  const [passo, setPasso] = useState<'valor' | 'dados'>('valor');
  const [valor, setValor] = useState<number | null>(MAIS_ESCOLHIDO);
  const [outro, setOutro] = useState('');
  const [mostrarOutro, setMostrarOutro] = useState(false);
  const [nome, setNome] = useState('');
  const [doc, setDoc] = useState('');
  const [email, setEmail] = useState('');

  const valorDigitado = valorDigitadoParaNumero(outro);
  const valorEscolhido = valor ?? valorDigitado;
  const outroValido = valorDigitado >= limites.minimo && valorDigitado <= limites.maximo;

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar();
    document.addEventListener('keydown', aoTeclar);
    const overflowAntes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflowAntes;
    };
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  const fecharTudo = () => {
    limpar();
    setPasso('valor');
    aoFechar();
  };

  const escolherValor = (v: number) => {
    setValor(v);
    setOutro('');
    setErro(null);
    setPasso('dados');
  };

  const seguirComOutro = () => {
    if (!outroValido) {
      setErro(`O valor precisa ficar entre ${brl(limites.minimo)} e ${brl(limites.maximo)}.`);
      return;
    }
    setValor(null);
    setErro(null);
    setPasso('dados');
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(valorEscolhido >= limites.minimo && valorEscolhido <= limites.maximo)) {
      setErro(`O valor precisa ficar entre ${brl(limites.minimo)} e ${brl(limites.maximo)}.`);
      return;
    }
    if (!documentoValido(doc)) {
      setErro('Confira o CPF: os dígitos não batem.');
      return;
    }
    const nova = await criar({ valor: Number(valorEscolhido.toFixed(2)), cpf: doc.replace(/\D/g, ''), nome, email });
    // Deu certo: a tela de pagamento assume daqui. O limpar evita que este
    // popup fique consultando o mesmo pagamento que a /checkout já acompanha.
    if (nova) {
      limpar();
      aoGerarPix(nova);
    }
  };

  // Popup nas duas telas: caixa flutuante centralizada, com folga nas bordas.
  // A caixa não rola — quem rola é o conteúdo, para o X ficar sempre no lugar.
  const caixa: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: ehCelular ? 420 : 470,
    maxHeight: ehCelular ? '86vh' : '88vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
    borderRadius: 22,
    boxShadow: '0 18px 50px rgba(15,15,25,.25)',
    boxSizing: 'border-box',
  };

  const conteudo: React.CSSProperties = {
    overflowY: 'auto',
    padding: ehCelular ? '28px 20px 26px' : '32px 32px 34px',
    WebkitOverflowScrolling: 'touch',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Doar por PIX"
      onMouseDown={e => e.target === e.currentTarget && fecharTudo()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(20,20,26,.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: ehCelular ? 16 : 20,
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div style={caixa}>
        <Fechar aoClicar={fecharTudo} />
        <div style={conteudo}>
          {/* ---------- 1. ESCADA DE VALORES ---------- */}
          {passo === 'valor' && (
            <div>
              <div
                style={{
                  fontSize: ehCelular ? 23 : 25,
                  fontWeight: 800,
                  color: TEXTO,
                  textAlign: 'center',
                  padding: '0 34px',
                  lineHeight: 1.3,
                  textWrap: 'balance',
                }}
              >
                Quanto você consegue hoje? 🧡
              </div>
              <div
                style={{
                  marginTop: 10,
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '1.2px',
                  color: '#b3b3bb',
                  textTransform: 'uppercase',
                }}
              >
                {chamadaValores}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 24 }}>
                {VALORES.map(v => {
                  const destaque = v === MAIS_ESCOLHIDO;
                  return (
                    <div key={v} style={{ position: 'relative' }}>
                      {destaque && (
                        <span
                          style={{
                            position: 'absolute',
                            top: -10,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#15151a',
                            color: '#fff',
                            fontSize: 9.5,
                            fontWeight: 800,
                            letterSpacing: '.6px',
                            padding: '4px 10px',
                            borderRadius: 999,
                            whiteSpace: 'nowrap',
                            zIndex: 1,
                            pointerEvents: 'none',
                          }}
                        >
                          💗 MAIS ESCOLHIDO
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => escolherValor(v)}
                        style={{
                          width: '100%',
                          height: 66,
                          border: `2px solid ${VERDE}`,
                          background: destaque ? VERDE : '#fff',
                          color: destaque ? '#fff' : VERDE,
                          fontFamily: 'inherit',
                          fontSize: 20,
                          fontWeight: 800,
                          borderRadius: 14,
                          cursor: 'pointer',
                        }}
                      >
                        {emReais(v)}
                      </button>
                    </div>
                  );
                })}
              </div>

              {!mostrarOutro ? (
                <button
                  type="button"
                  onClick={() => setMostrarOutro(true)}
                  style={{
                    width: '100%',
                    marginTop: 16,
                    border: '1.5px dashed #cfcfd6',
                    background: '#fff',
                    color: TEXTO,
                    fontFamily: 'inherit',
                    fontSize: 16,
                    fontWeight: 700,
                    height: 58,
                    borderRadius: 14,
                    cursor: 'pointer',
                  }}
                >
                  Escolher outro valor
                </button>
              ) : (
                <div
                  style={{
                    marginTop: 16,
                    border: `2px solid ${outroValido ? VERDE : '#e6e6e9'}`,
                    borderRadius: 16,
                    padding: '16px 16px 18px',
                    background: '#fcfcfd',
                  }}
                >
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: TEXTO }}>Digite o valor da sua doação</div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 12,
                      background: '#fff',
                      border: '1px solid #d9d9de',
                      borderRadius: 12,
                      padding: '10px 14px',
                    }}
                  >
                    <span style={{ fontSize: 22, fontWeight: 800, color: outro ? VERDE : '#c2c2c9' }}>R$</span>
                    <input
                      autoFocus
                      inputMode="numeric"
                      placeholder="0,00"
                      value={outro}
                      onChange={e => setOutro(formatarValorDigitado(e.target.value))}
                      onKeyDown={e => e.key === 'Enter' && seguirComOutro()}
                      aria-label="Valor da doação em reais"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontFamily: 'inherit',
                        fontSize: 26,
                        fontWeight: 800,
                        color: TEXTO,
                        padding: 0,
                      }}
                    />
                  </div>

                  <div style={{ marginTop: 10, fontSize: 12.5, color: CINZA }}>
                    De {brl(limites.minimo)} a {brl(limites.maximo)} por doação.
                  </div>

                  <button
                    type="button"
                    onClick={seguirComOutro}
                    disabled={!outroValido}
                    style={{
                      width: '100%',
                      marginTop: 14,
                      background: outroValido ? VERDE : '#d7d7dd',
                      color: '#fff',
                      border: 'none',
                      fontFamily: 'inherit',
                      fontSize: 17,
                      fontWeight: 700,
                      height: 54,
                      borderRadius: 12,
                      cursor: outroValido ? 'pointer' : 'default',
                    }}
                  >
                    {outroValido ? `Doar ${brl(valorDigitado)}` : 'Continuar'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMostrarOutro(false);
                      setOutro('');
                      setErro(null);
                    }}
                    style={{
                      display: 'block',
                      margin: '12px auto 0',
                      border: 'none',
                      background: 'none',
                      font: 'inherit',
                      fontSize: 14,
                      fontWeight: 700,
                      color: CINZA,
                      cursor: 'pointer',
                    }}
                  >
                    voltar para os valores
                  </button>
                </div>
              )}

              {erro && (
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
                  {erro}
                </div>
              )}
            </div>
          )}

          {/* ---------- 2. DADOS DE QUEM VAI PAGAR ---------- */}
          {passo === 'dados' && (
            <form onSubmit={enviar}>
              <div style={{ fontSize: ehCelular ? 22 : 24, fontWeight: 800, color: TEXTO, paddingRight: 44 }}>
                Doar {brl(valorEscolhido)}
              </div>
              <div style={{ fontSize: 14, color: CINZA, marginTop: 6, lineHeight: 1.5 }}>{tituloCampanha}</div>

              <button
                type="button"
                onClick={() => {
                  setPasso('valor');
                  setErro(null);
                }}
                style={{
                  marginTop: 12,
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  font: 'inherit',
                  fontSize: 14,
                  fontWeight: 700,
                  color: VERDE,
                  cursor: 'pointer',
                }}
              >
                ‹ mudar o valor
              </button>

              <div style={{ marginTop: 18 }}>
                <label style={rotulo} htmlFor="doacao-nome">
                  Seu nome
                </label>
                <input
                  id="doacao-nome"
                  autoComplete="name"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Como você quer aparecer na lista"
                  style={campo}
                />
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={rotulo} htmlFor="doacao-cpf">
                  CPF de quem vai pagar
                </label>
                <input
                  id="doacao-cpf"
                  inputMode="numeric"
                  value={doc}
                  onChange={e => setDoc(formatarDocumento(e.target.value))}
                  placeholder="000.000.000-00"
                  style={campo}
                />
                <div style={{ fontSize: 12.5, color: CINZA, marginTop: 7, lineHeight: 1.5 }}>
                  O banco só aceita o pagamento se o PIX sair desse mesmo CPF. Pagando de outra conta, o valor volta
                  (pode levar até 48h).
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={rotulo} htmlFor="doacao-email">
                  E-mail <span style={{ fontWeight: 400, color: CINZA }}>(opcional)</span>
                </label>
                <input
                  id="doacao-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="para o recibo"
                  style={campo}
                />
              </div>

              {configurado === false && (
                <div
                  style={{
                    marginTop: 18,
                    background: '#fff6e6',
                    border: '1px solid #f6c778',
                    borderRadius: 10,
                    padding: '12px 14px',
                    fontSize: 13.5,
                    color: '#7a4d05',
                    lineHeight: 1.55,
                  }}
                >
                  A chave da PixGo ainda não foi configurada no servidor, então a cobrança não vai ser gerada. Preencha{' '}
                  <strong>PIXGO_API_KEY</strong> no arquivo <strong>.env</strong>.
                </div>
              )}

              {erro && (
                <div
                  role="alert"
                  style={{
                    marginTop: 18,
                    background: '#fdeaea',
                    border: '1px solid #f3b0b0',
                    borderRadius: 10,
                    padding: '12px 14px',
                    fontSize: 13.5,
                    color: '#992020',
                    lineHeight: 1.55,
                  }}
                >
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={criando}
                style={{
                  marginTop: 22,
                  width: '100%',
                  background: criando ? '#8fd9ae' : VERDE,
                  color: '#fff',
                  border: 'none',
                  fontFamily: 'inherit',
                  fontSize: 19,
                  fontWeight: 700,
                  padding: '17px 10px',
                  borderRadius: 12,
                  cursor: criando ? 'default' : 'pointer',
                }}
              >
                {criando ? 'Gerando PIX…' : `Doar ${valorEscolhido >= limites.minimo ? brl(valorEscolhido) : ''}`.trim()}
              </button>

              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    border: `1px solid ${VERDE}`,
                    borderRadius: 999,
                    padding: '4px 12px 4px 5px',
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#0d5c2e',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
                      <path d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4zm-1.4 16l-4-4 1.4-1.4 2.6 2.6 5.4-5.4L17.4 10l-6.8 7z" />
                    </svg>
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.5px', color: '#0d5c2e' }}>
                    DOAÇÃO PROTEGIDA
                  </span>
                </span>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
