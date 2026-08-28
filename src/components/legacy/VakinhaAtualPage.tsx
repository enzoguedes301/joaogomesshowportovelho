import React from 'react';
import { Campaign } from '../../types';
import { VakinhaAtualMobile } from './VakinhaAtualMobile';
import { useEhCelular } from './useEhCelular';
import {
  ABAS,
  ChamadaCampanha,
  CitacaoDestaque,
  FONTE_NOVA,
  ParagrafoHistoria,
  QuemAjudou,
  RodapeAtual,
  brl,
} from './SecoesAtual';

/**
 * Reprodução fiel do site ATUAL do Vakinha (estado "antes" do redesign).
 *
 * Fonte: "Vaquinha Leucemia.dc.html" em Downloads/Design de página de arrecadação/.
 * Os valores (px, cores, pesos) são LITERAIS do arquivo — não estimados de print.
 * Estilos inline de propósito: o Tailwind do projeto carrega o design novo e não
 * deve influenciar esta tela.
 */

const MENU = ['Como ajudar', 'Descubra', 'Como funciona'];

/** Alinha com o conteúdo da página: 730 (coluna) + 32 (gap) + 335 (aside) = 1097, mais 24px de cada lado. */
const LARGURA_CONTEUDO = 1145;

const Chevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2b2b3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/** Cabeçalho do site atual do Vakinha. */
const CabecalhoAtual: React.FC = () => (
  <header style={{ background: '#fff', width: '100%' }}>
    <div
      className="gap-4 xl:gap-10 h-[72px] md:h-[90px] px-4 md:px-6"
      style={{
        maxWidth: LARGURA_CONTEUDO,
        margin: '0 auto',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <img
        src="/vakinha-logo.webp"
        alt="Vakinha"
        className="h-8 sm:h-11"
        style={{ width: 'auto', display: 'block', flex: 'none' }}
      />

      {/* Mobile: lupa + hambúrguer no lugar do menu */}
      <div className="flex items-center gap-5 md:hidden">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#20c05e" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2b2b3b" strokeWidth="2.5" strokeLinecap="round">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </div>

      {/* Menu e links somem em telas estreitas: o print é desktop, o mobile é critério meu */}
      <nav className="hidden xl:flex" style={{ alignItems: 'center', gap: 36, flex: 1 }}>
        {MENU.map(item => (
          <span
            key={item}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 17,
              fontWeight: 700,
              color: '#2b2b3b',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {item}
            <Chevron />
          </span>
        ))}
      </nav>

      <div className="hidden md:flex gap-3 sm:gap-8" style={{ alignItems: 'center', flex: 'none' }}>
        <span
          className="hidden md:inline-flex"
          style={{
            alignItems: 'center',
            gap: 7,
            fontSize: 15,
            fontWeight: 600,
            color: '#20c05e',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Buscar
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#20c05e" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </span>

        <span
          className="hidden md:inline"
          style={{ fontSize: 15, fontWeight: 600, color: '#20c05e', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Minha conta
        </span>

        <span
          className="text-[13px] px-3.5 py-2.5 sm:text-[15px] sm:px-[22px] sm:py-3"
          style={{
            background: '#20c05e',
            color: '#fff',
            fontWeight: 700,
            borderRadius: 8,
            cursor: 'pointer',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Faz uma vaquinha!
        </span>
      </div>
    </div>
  </header>
);

interface Props {
  campaign: Campaign;
  /** Abre o modal de doação por PIX (fica no App, que é quem soma o valor arrecadado). */
  aoAbrirDoacao: () => void;
}

export const VakinhaAtualPage: React.FC<Props> = ({ campaign, aoAbrirDoacao }) => {
  const ehCelular = useEhCelular();
  const progresso = Math.round((campaign.currentAmount / campaign.targetAmount) * 100);

  // A primeira frase da história vira a citação em destaque; o resto vem abaixo dela.
  const [abertura, ...paragrafos] = campaign.fullStory;

  // No celular a página tem outra estrutura (uma coluna, barra de ação fixa) —
  // ver VakinhaAtualMobile.tsx. Aqui fica o desktop.
  if (ehCelular) return <VakinhaAtualMobile campaign={campaign} aoAbrirDoacao={aoAbrirDoacao} />;

  return (
    <div
      style={{
        minHeight: '100vh',
        overflowX: 'hidden',
        background: '#f4f4f4',
        fontFamily: "'Poppins', sans-serif",
        color: '#3f4254',
      }}
    >
      <CabecalhoAtual />

      <div style={{ padding: '20px 0 40px' }}>
      <div
        style={{
          maxWidth: 1500,
          margin: '0 auto',
          display: 'flex',
          gap: 32,
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '0 24px',
        }}
      >
        {/* Entre 1024 e 1096px os 730 + 32 + 335 não cabem: a coluna encolhe em vez de
            a lateral quebrar para baixo, que jogava o "Quero Ajudar" para o fim da página. */}
        {/* ---------- COLUNA PRINCIPAL ---------- */}
        <div style={{ flex: '1 1 730px', maxWidth: 730, minWidth: 0 }}>
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,.06)',
              padding: '16px 16px 32px',
            }}
          >
            <ChamadaCampanha />

            {/* Sem altura fixa: a arte já traz texto e um corte comeria as palavras. */}
            <div style={{ width: '100%', position: 'relative' }}>
              <img
                src={campaign.images[0].url}
                alt={campaign.title}
                style={{ width: '100%', height: 'auto', borderRadius: 6, display: 'block' }}
              />
              {/* Desceu para o pé da foto: no topo o botão cobria a chamada da imagem. */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 14,
                  right: 14,
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 5px rgba(0,0,0,.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <svg width="20" height="18" viewBox="0 0 24 22" fill="#d9d9de">
                  <path d="M12 21S1 13.6 1 7.3C1 3.8 3.8 1 7.2 1c1.9 0 3.7.9 4.8 2.4C13.1 1.9 14.9 1 16.8 1 20.2 1 23 3.8 23 7.3 23 13.6 12 21 12 21z" />
                </svg>
              </div>
            </div>

            <div style={{ padding: '26px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: 13, letterSpacing: '.4px', color: '#7e8299', textTransform: 'uppercase' }}>
                  {campaign.category} / {campaign.subcategory}
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    color: '#7e8299',
                    textTransform: 'uppercase',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#3f4254">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
                  </svg>
                  {campaign.location}
                </span>
              </div>

              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.25, fontWeight: 700, color: '#2b2b3b', textWrap: 'balance' }}>
                {campaign.title}
              </h1>

              <div style={{ fontSize: 15, fontWeight: 600, color: '#3f4254' }}>ID: {campaign.codeId}</div>

              <p style={{ margin: '6px 0 0', fontSize: 15.5, lineHeight: 1.65, color: '#5e6278', textWrap: 'pretty' }}>
                {campaign.summary}
              </p>

              <div style={{ marginTop: 12, fontSize: 15.5, lineHeight: 1.7, color: '#4a4a4e', textWrap: 'pretty' }}>
                <CitacaoDestaque texto={abertura} tamanho={19} />
                {paragrafos.map((paragrafo, i) => (
                  <ParagrafoHistoria key={i} texto={paragrafo} primeiro={i === 0} />
                ))}
              </div>
            </div>
          </div>

          {/* Abas */}
          <div style={{ display: 'flex', gap: 26, padding: '26px 16px 0', overflowX: 'auto' }}>
            {ABAS.map((aba, i) => (
              <span
                key={aba}
                style={
                  i === 0
                    ? {
                        fontSize: 19,
                        fontWeight: 700,
                        color: '#20c05e',
                        borderBottom: '3px solid #20c05e',
                        padding: '0 8px 10px',
                        whiteSpace: 'nowrap',
                      }
                    : {
                        fontSize: 19,
                        color: '#3f4254',
                        borderBottom: '2px solid #d9d9de',
                        padding: '0 8px 10px',
                        whiteSpace: 'nowrap',
                      }
                }
              >
                {aba}
              </span>
            ))}
          </div>

          {/* O bloco "Sobre" saiu junto com o do celular: data, foto e história
              repetiam o cartão do topo, onde o "ver tudo" já abre o texto inteiro. */}

          {/* Denúncia + aviso legal */}
          <div style={{ fontFamily: FONTE_NOVA }}>
            <div style={{ marginTop: 28, fontSize: 16, fontWeight: 700, color: '#3d3d40', cursor: 'pointer' }}>
              Denunciar essa vaquinha
            </div>
            <div style={{ marginTop: 14, fontSize: 12.5, lineHeight: 1.6, color: '#8a8a8f', maxWidth: 680 }}>
              AVISO LEGAL: O texto e as imagens incluídos nessa página são de única e exclusiva responsabilidade do
              criador da vaquinha e não representam a opinião ou endosso da plataforma Vakinha.
            </div>
          </div>
        </div>

        {/* ---------- SIDEBAR ---------- */}
        <aside
          style={{
            flex: '0 0 335px',
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 1px 4px rgba(0,0,0,.06)',
            padding: '20px 18px 26px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ height: 6, borderRadius: 3, background: '#e4e6ef', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, background: '#20c05e', width: `${progresso}%` }} />
          </div>

          {/* "Arrecadado" só no desktop; no mobile valor e meta ficam na mesma linha */}
          <div className="hidden md:block" style={{ fontSize: 19, fontWeight: 700, color: '#2b2b3b', marginTop: 22 }}>
            Arrecadado
          </div>

          <div className="flex items-baseline gap-2 mt-5 md:mt-1 md:block">
            <div className="text-[26px] md:text-[40px]" style={{ fontWeight: 700, color: '#20c05e', lineHeight: 1.15 }}>
              {brl(campaign.currentAmount)}
            </div>
            <div className="text-[15px] md:text-[17px] md:mt-0.5" style={{ color: '#7e8299' }}>
              de {brl(campaign.targetAmount)}
            </div>
          </div>

          <div
            style={{
              background: '#eefbf2',
              borderRadius: 6,
              padding: '14px 16px',
              marginTop: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, color: '#3f4254', display: 'flex', alignItems: 'center', gap: 6 }}>
                Corações Recebidos
                <svg width="16" height="14" viewBox="0 0 24 22" fill="#1b6e3d">
                  <path d="M12 21S1 13.6 1 7.3C1 3.8 3.8 1 7.2 1c1.9 0 3.7.9 4.8 2.4C13.1 1.9 14.9 1 16.8 1 20.2 1 23 3.8 23 7.3 23 13.6 12 21 12 21z" />
                </svg>
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#2b2b3b' }}>{campaign.heartsCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, color: '#3f4254' }}>Apoiadores</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#2b2b3b' }}>{campaign.supportersCount}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={aoAbrirDoacao}
            style={{
              marginTop: 26,
              background: '#20c05e',
              color: '#fff',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: 19,
              fontWeight: 700,
              textAlign: 'center',
              padding: '15px 10px',
              borderRadius: 8,
              cursor: 'pointer',
              userSelect: 'none',
              width: '100%',
            }}
          >
            Quero Ajudar
          </button>

          <div
            style={{
              marginTop: 14,
              background: '#fff',
              border: '1px solid #3f4254',
              color: '#2b2b3b',
              fontSize: 19,
              fontWeight: 700,
              textAlign: 'center',
              padding: '14px 10px',
              borderRadius: 8,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            Compartilhar
          </div>

          <div style={{ borderTop: '1px solid #ececf1', marginTop: 24, paddingTop: 20 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                border: '1px solid #20c05e',
                borderRadius: 999,
                padding: '5px 14px 5px 6px',
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
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.6px', color: '#0d5c2e' }}>
                DOAÇÃO PROTEGIDA
              </span>
            </span>
          </div>

          <div style={{ borderTop: '1px solid #ececf1', marginTop: 20, paddingTop: 20 }}>
            <div
              style={{
                background: '#f7f7f9',
                borderRadius: 8,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ width: 44, height: 44, flex: 'none' }}>
                <img
                  src={campaign.organizer.avatarUrl}
                  alt={campaign.organizer.name}
                  // contain, não cover: o organizador é um carimbo, e cortar comeria a borda dele.
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'contain', background: '#fff', display: 'block' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#2b2b3b' }}>{campaign.organizer.name}</span>
                <span style={{ fontSize: 12.5, color: '#7e8299' }}>
                  Ativo(a) desde {campaign.organizer.activeSince}
                </span>
              </div>
            </div>
          </div>
        </aside>
        </div>
      </div>

      {/* No lugar de "Outras histórias" (fora por enquanto; o componente segue em SecoesAtual.tsx). */}
      <QuemAjudou totalApoiadores={campaign.supportersCount} quemRecebe="as crianças do Nepal" />
      <RodapeAtual />
    </div>
  );
};
