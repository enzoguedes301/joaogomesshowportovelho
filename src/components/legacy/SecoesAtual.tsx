import React from 'react';
import { relatedCampaigns, sampleDonors } from '../../data/mockData';

/**
 * Seções do site ATUAL compartilhadas entre a tela de desktop e a de celular:
 * "Outras histórias", rodapé e barra de ação fixa. Mesmos valores literais do
 * recorte HTML — ver VakinhaAtualPage.tsx.
 */

export const FONTE_NOVA = "'Nunito Sans', sans-serif";

export const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/ /g, ' ');

export const ABAS = ['Sobre', 'Atualizações', 'Quem ajudou', 'Vakinha Premiada', 'Selos recebidos'];

/**
 * Chamada acima da foto da campanha.
 *
 * Antes vinha queimada dentro da própria imagem (faixa branca no topo da
 * pandora.webp). Virou texto de verdade: dá para editar sem refazer a arte,
 * fica nítida em qualquer tela e o leitor de tela lê.
 */
export const CHAMADA_TITULO = 'S.O.S AJUDE NEPAL 2026';
export const CHAMADA_SUBTITULO = 'O NEPAL PRECISA DA SUA AJUDA URGENTEMENTE';

/** Verde da marca, escurecido: o #20c05e do cabeçalho não tem contraste em fundo branco. */
const VERDE_CHAMADA = '#0f9d47';

export const ChamadaCampanha: React.FC<{ ehCelular?: boolean }> = ({ ehCelular = false }) => (
  <div style={{ textAlign: 'center', padding: ehCelular ? '2px 4px 12px' : '4px 8px 16px' }}>
    <h2
      style={{
        margin: 0,
        fontFamily: FONTE_NOVA,
        fontWeight: 800,
        color: VERDE_CHAMADA,
        fontSize: ehCelular ? 26 : 38,
        lineHeight: 1.12,
        letterSpacing: '-.4px',
      }}
    >
      {CHAMADA_TITULO}
    </h2>
    <p
      style={{
        margin: ehCelular ? '6px 0 0' : '8px 0 0',
        fontFamily: FONTE_NOVA,
        fontWeight: 800,
        color: VERDE_CHAMADA,
        fontSize: ehCelular ? 16.5 : 23,
        lineHeight: 1.22,
      }}
    >
      {CHAMADA_SUBTITULO}
    </p>
  </div>
);

/** Iniciais para o avatar: "Daniela N." vira "DN". */
const iniciais = (nome: string) =>
  nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .replace(/[^A-ZÀ-Ú]/g, '');

const CORES_AVATAR = ['#1e9fb0', '#e08a2e', '#7a5cd6', '#2cb56a', '#c2547d'];

/** Um apoiador da lista: avatar, nome, quando doou, valor, recado e o botão de curtir. */
const CartaoApoiador: React.FC<{ doador: (typeof sampleDonors)[number]; cor: string }> = ({ doador, cor }) => {
  const [curtido, setCurtido] = React.useState(false);

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 1px 6px rgba(0,0,0,.07)',
        padding: '18px 18px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          aria-hidden
          style={{
            width: 42,
            height: 42,
            flex: 'none',
            borderRadius: '50%',
            background: cor,
            color: '#fff',
            fontSize: 15,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            letterSpacing: '.5px',
          }}
        >
          {iniciais(doador.name)}
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: 15.5, fontWeight: 800, color: '#3d3d40' }}>{doador.name}</span>
          <span style={{ fontSize: 13, color: '#8a8a8f' }}>{doador.date}</span>
        </div>

        <span
          style={{
            flex: 'none',
            background: '#eefbf2',
            color: '#0d5c2e',
            fontSize: 14.5,
            fontWeight: 800,
            padding: '6px 12px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
          }}
        >
          {brl(doador.amount)}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: '#4a4a4e', textWrap: 'pretty' }}>
        {doador.message}
      </p>

      <div style={{ borderTop: '1px solid #f0f0f2', paddingTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          onClick={() => setCurtido(c => !c)}
          aria-pressed={curtido}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            border: 'none',
            background: 'none',
            padding: '4px 2px',
            font: 'inherit',
            fontSize: 14,
            fontWeight: 700,
            color: curtido ? '#2cb56a' : '#7c7c81',
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="15" viewBox="0 0 24 22" fill={curtido ? '#2cb56a' : 'none'} stroke={curtido ? '#2cb56a' : '#7c7c81'} strokeWidth="2">
            <path d="M12 21S1 13.6 1 7.3C1 3.8 3.8 1 7.2 1c1.9 0 3.7.9 4.8 2.4C13.1 1.9 14.9 1 16.8 1 20.2 1 23 3.8 23 7.3 23 13.6 12 21 12 21z" />
          </svg>
          {doador.hearts + (curtido ? 1 : 0)}
        </button>
        <span style={{ fontSize: 14, color: '#a5a5aa' }}>Curtir</span>
      </div>
    </div>
  );
};

/**
 * Um parágrafo da história da campanha. Linhas que começam com "• " viram item
 * de lista: recuo pendurado, para a segunda linha não voltar embaixo do ponto.
 */
export const ParagrafoHistoria: React.FC<{ texto: string; primeiro: boolean }> = ({ texto, primeiro }) => {
  const ehItem = texto.startsWith('• ');
  return (
    <p
      style={{
        margin: primeiro ? 0 : ehItem ? '8px 0 0' : '14px 0 0',
        paddingLeft: ehItem ? 18 : 0,
        textIndent: ehItem ? -18 : 0,
      }}
    >
      {texto}
    </p>
  );
};

/** Seção "Quem ajudou": os recados de quem já apoiou a campanha. */
export const QuemAjudou: React.FC<{ totalApoiadores: number; quemRecebe: string }> = ({
  totalApoiadores,
  quemRecebe,
}) => (
  <div
    style={{
      background: '#fbfbfc',
      borderTop: '1px solid #f0f0f2',
      padding: '44px 16px 56px',
      fontFamily: FONTE_NOVA,
    }}
  >
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color: '#3d3d40' }}>
        {totalApoiadores} pessoas já ajudaram {quemRecebe}
      </div>
      <div style={{ textAlign: 'center', fontSize: 15, color: '#7c7c81', margin: '10px 0 32px' }}>
        Veja os recados de quem ajudou
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 18 }}>
        {sampleDonors.map((doador, i) => (
          <CartaoApoiador key={doador.id} doador={doador} cor={CORES_AVATAR[i % CORES_AVATAR.length]} />
        ))}
      </div>
    </div>
  </div>
);

/** Abertura da história em destaque, entre aspas e centralizada. */
export const CitacaoDestaque: React.FC<{ texto: string; tamanho?: number }> = ({ texto, tamanho = 18 }) => (
  <p
    style={{
      margin: '0 0 18px',
      textAlign: 'center',
      fontSize: tamanho,
      fontWeight: 700,
      lineHeight: 1.45,
      color: '#2b2b3b',
      textWrap: 'balance',
    }}
  >
    “{texto}”
  </p>
);

/** Cards de "Outras histórias" — dados literais do arquivo; imagens vêm do projeto. */
const CARDS = [
  { title: 'Ajuda na faculdade De Pedagogia', raised: 'R$ 35,00', goal: '250', pct: '14%', hearts: '0', heartColor: '#8a6d1f', sponsored: true },
  { title: 'Me ajude a realizar meu sonho de ter um PS5', raised: 'R$ 25,00', goal: '4,5 mil', pct: '1%', hearts: '0', heartColor: '#8a6d1f', sponsored: true },
  { title: 'Tratamento médico Orah Beila bat Sarah', raised: 'R$ 64.839,36', goal: '60 mil', pct: '100%', hearts: '228', heartColor: '#2cb56a', sponsored: false },
  { title: 'Áurea bravo - Prótese do braço direito', raised: 'R$ 66.596,91', goal: '200 mil', pct: '33%', hearts: '545', heartColor: '#2cb56a', sponsored: false },
];

const FOOTER_LINKS_1 = ['Quem somos', 'Vaquinhas', 'Criar vaquinhas', 'Login', 'Vaquinhas mais amadas', 'Politica de privacidade', 'Termos de uso', 'Verificação de links'];
const FOOTER_LINKS_2 = ['Dúvidas frequentes', 'Taxas e prazos', 'Loja de corações', 'Vakinha Premiada', 'Blog do Vakinha', 'Mapa de posts do blog', 'Segurança e transparência', 'Busca por recibo'];

/** Seção "Outras histórias também precisam de você!" */
export const OutrasHistorias: React.FC = () => (
  <div
    style={{
      background: '#fbfbfc',
      borderTop: '1px solid #f0f0f2',
      padding: '44px 16px 56px',
      fontFamily: FONTE_NOVA,
    }}
  >
    <div style={{ maxWidth: 1110, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color: '#3d3d40', marginBottom: 32 }}>
        Outras histórias também precisam de você!
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 30 }}>
        {CARDS.map((card, i) => (
          <div
            key={card.title}
            style={{
              background: '#fff',
              borderRadius: 10,
              boxShadow: '0 1px 8px rgba(0,0,0,0.09)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ position: 'relative', height: 150, margin: 0 }}>
              <img
                src={relatedCampaigns[i]?.imageUrl}
                alt={card.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c9c9cd',
                  fontSize: 17,
                  cursor: 'pointer',
                }}
              >
                ♥
              </div>
              {card.sponsored && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                    background: '#f6871f',
                    color: '#fff',
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 999,
                    pointerEvents: 'none',
                  }}
                >
                  ▣ Vaquinha Patrocinada
                </div>
              )}
            </div>

            <div style={{ padding: '16px 16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 16.5, lineHeight: 1.35, color: '#3d3d40', minHeight: 44 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 15 }}>
                <span style={{ color: '#f6871f', fontWeight: 800 }}>{card.raised}</span>{' '}
                <span style={{ color: '#7c7c81' }}>de {card.goal}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: '#e6e6e9', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#2cb56a', width: card.pct }} />
              </div>
              <div style={{ fontSize: 13.5, color: '#5a5a5f' }}>
                {card.hearts} corações recebidos <span style={{ color: card.heartColor }}>♥</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/** Rodapé do site atual. */
export const RodapeAtual: React.FC = () => (
  <div style={{ background: '#242426', color: '#e8e8ea', padding: '36px 16px 48px', fontFamily: FONTE_NOVA }}>
    <div style={{ maxWidth: 1110, margin: '0 auto' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}
      >
        {/* Logo oficial */}
        <img
          src="/doar-eh-amor.png"
          alt="Doar é Amor"
          style={{ height: 32, width: 'auto', display: 'block', flex: 'none' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 18, color: '#cfcfd3', fontSize: 15 }}>
          <span style={{ cursor: 'pointer' }} title="Instagram">◙</span>
          <span style={{ color: '#4a4a4e' }}>|</span>
          <span style={{ cursor: 'pointer', fontWeight: 800 }} title="Facebook">f</span>
          <span style={{ color: '#4a4a4e' }}>|</span>
          <span style={{ cursor: 'pointer' }} title="YouTube">▶</span>
          <span style={{ color: '#4a4a4e' }}>|</span>
          <span style={{ cursor: 'pointer', fontWeight: 800 }} title="X">X</span>
          <span style={{ color: '#4a4a4e' }}>|</span>
          <span style={{ cursor: 'pointer' }} title="TikTok">♪</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 40, marginTop: 38 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: '#2cb56a', fontWeight: 800, fontSize: 16 }}>Links rápidos</div>
          {FOOTER_LINKS_1.map(l => (
            <div key={l} style={{ fontSize: 13.5, color: '#e8e8ea', cursor: 'pointer' }}>
              {l}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ height: 24 }} />
          {FOOTER_LINKS_2.map(l => (
            <div key={l} style={{ fontSize: 13.5, color: '#e8e8ea', cursor: 'pointer' }}>
              {l}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: '#2cb56a', fontWeight: 800, fontSize: 16 }}>Fale conosco</div>
          <div style={{ fontSize: 13.5, color: '#e8e8ea', cursor: 'pointer' }}>Clique aqui para falar conosco</div>
          <div style={{ fontSize: 13.5, color: '#e8e8ea', lineHeight: 1.6, marginTop: 6 }}>
            De Segunda à Sexta
            <br />
            Das 9:30 às 17:00
          </div>
          <div
            style={{
              marginTop: 8,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid #2cb56a',
              borderRadius: 999,
              padding: '6px 14px 6px 8px',
              width: 'max-content',
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: '#2cb56a',
                color: '#242426',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
              }}
            >
              🔒
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.5px', color: '#fff', lineHeight: 1.3 }}>
              SELO DE
              <br />
              SEGURANÇA
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ color: '#2cb56a', fontWeight: 800, fontSize: 16 }}>Baixe nosso App</div>
          {[
            { icone: '▶', linha1: 'DISPONÍVEL NO', linha2: 'Google Play', tam1: 8, ls: '0.5px' },
            { icone: '', linha1: 'Baixar na', linha2: 'App Store', tam1: 9, ls: 'normal' },
          ].map(app => (
            <div
              key={app.linha2}
              style={{
                width: 150,
                height: 44,
                borderRadius: 7,
                background: '#000',
                border: '1px solid #3a3a3e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: app.linha2 === 'Google Play' ? 18 : 20 }}>{app.icone}</span>
              <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: app.tam1, letterSpacing: app.ls, color: '#c9c9cd' }}>{app.linha1}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{app.linha2}</span>
              </span>
            </div>
          ))}
          <div style={{ fontSize: 13, color: '#c9c9cd', lineHeight: 1.7, marginTop: 6 }}>
            Vakinha.com.br
            <br />
            CNPJ 22.831.673/0001-26
            <br />
            Porto Alegre – RS
          </div>
        </div>
      </div>
    </div>

    <div
      style={{
        margin: '40px -16px -48px',
        background: '#5a5a5e',
        textAlign: 'center',
        padding: '10px 0',
        fontSize: 13,
        color: '#f0f0f2',
      }}
    >
      © 2026 - Todos direitos reservados
    </div>
  </div>
);

/** Barra de ação fixa do mobile: selo + Quero Ajudar + Compartilhar. */
export const BarraAcaoMobile: React.FC<{ aoAjudar: () => void }> = ({ aoAjudar }) => (
  <div
    style={{
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 30,
      borderRadius: '20px 20px 0 0',
      overflow: 'hidden',
      boxShadow: '0 -2px 12px rgba(0,0,0,.10)',
    }}
  >
    <div style={{ background: '#dcf8dc', padding: '12px 16px 10px', display: 'flex', justifyContent: 'center' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          background: '#fff',
          border: '1px solid #20c05e',
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

    <div
      style={{
        background: '#fff',
        padding: '18px 18px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Em tablet os botões não esticam de ponta a ponta: acompanham a coluna de conteúdo */}
      <div style={{ maxWidth: 684, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          type="button"
          onClick={aoAjudar}
          style={{
            background: '#20c05e',
            color: '#fff',
            border: 'none',
            fontFamily: 'inherit',
            fontSize: 22,
            fontWeight: 700,
            textAlign: 'center',
            height: 62,
            lineHeight: '62px',
            padding: 0,
            borderRadius: 12,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          Quero Ajudar
        </button>
        <div
          style={{
            background: '#fff',
            border: '1.5px solid #4a4a4e',
            color: '#3a3a3e',
            fontSize: 22,
            fontWeight: 700,
            textAlign: 'center',
            height: 62,
            lineHeight: '59px',
            borderRadius: 12,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          Compartilhar
        </div>
      </div>
    </div>
  </div>
);

