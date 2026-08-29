import React from 'react';
import { Campaign } from '../../types';
import {
  ABAS,
  BarraAcaoMobile,
  ChamadaCampanha,
  CitacaoDestaque,
  ParagrafoHistoria,
  QuemAjudou,
  RodapeAtual,
  brl,
} from './SecoesAtual';

/**
 * Site ATUAL do Vakinha como aparece no CELULAR.
 *
 * Medido das capturas de tela reais (Android, ~411px de largura CSS): tudo em
 * uma coluna, com foto, título, progresso, valores, corações, resumo e criador
 * dentro de um único cartão; abas roláveis; cartão "Sobre" com chave Pix; e a
 * barra fixa "Quero Ajudar / Compartilhar" no rodapé da tela.
 * Estilos inline de propósito: o Tailwind do projeto não deve influenciar aqui.
 */

const VERDE = '#20c05e';
const TEXTO = '#2b2b3b';
const CINZA = '#7e8299';
const CARTAO: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
};

const Coracao: React.FC<{ cor: string; tamanho?: number }> = ({ cor, tamanho = 18 }) => (
  <svg width={tamanho} height={tamanho * 0.92} viewBox="0 0 24 22" fill={cor}>
    <path d="M12 21S1 13.6 1 7.3C1 3.8 3.8 1 7.2 1c1.9 0 3.7.9 4.8 2.4C13.1 1.9 14.9 1 16.8 1 20.2 1 23 3.8 23 7.3 23 13.6 12 21 12 21z" />
  </svg>
);

/** Cabeçalho do celular: logo à esquerda, lupa e menu à direita. */
const CabecalhoMobile: React.FC = () => (
  <header
    style={{
      background: '#fff',
      height: 104,
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 6px rgba(0,0,0,.08)',
      position: 'relative',
      zIndex: 2,
    }}
  >
    <img src="/doar-eh-amor.png" alt="Doar é Amor" style={{ height: 34, width: 'auto', display: 'block' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={VERDE} strokeWidth="2.6" strokeLinecap="round">
        <circle cx="10.5" cy="10.5" r="7" />
        <path d="m20.5 20.5-4.8-4.8" />
      </svg>
      <svg width="28" height="24" viewBox="0 0 28 24" fill="none" stroke="#3a3a3a" strokeWidth="2.6" strokeLinecap="round">
        <path d="M2 4h24M2 12h24M2 20h24" />
      </svg>
    </div>
  </header>
);

const IconePin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#6b6b70">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
  </svg>
);

interface Props {
  campaign: Campaign;
  aoAbrirDoacao: () => void;
}

export const VakinhaAtualMobile: React.FC<Props> = ({ campaign, aoAbrirDoacao }) => {
  const progresso = Math.min(100, Math.round((campaign.currentAmount / campaign.targetAmount) * 100));

  // A primeira frase da história vira a citação em destaque; o resto vem abaixo dela.
  const [abertura, ...paragrafos] = campaign.fullStory;

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
      <CabecalhoMobile />

      {/* maxWidth só age em tablet: no celular a coluna já é mais estreita que isso */}
      <div style={{ padding: '14px 17px 0', maxWidth: 720, margin: '0 auto' }}>
        {/* ---------- CARTÃO PRINCIPAL ---------- */}
        <div style={{ ...CARTAO, padding: '17px 18px 22px' }}>
          <ChamadaCampanha ehCelular />

          {/* Sem recorte: a arte já traz texto, e cortar comeria as palavras. */}
          <div style={{ position: 'relative', width: '100%', background: '#e8e8ea', borderRadius: 12, overflow: 'hidden' }}>
            <img
              src={campaign.images[0].url}
              alt={campaign.title}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            {/* Desceu para o pé da foto: no topo o botão cobria a chamada da imagem. */}
            <div
              style={{
                position: 'absolute',
                bottom: 14,
                right: 14,
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 5px rgba(0,0,0,.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Coracao cor="#d0d0d4" tamanho={20} />
            </div>
          </div>

          {/* Em 320px as duas etiquetas não cabem na mesma linha: deixo quebrar em vez de cortar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px 12px', marginTop: 24, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, letterSpacing: '.4px', color: CINZA, textTransform: 'uppercase' }}>
              {campaign.category} / {campaign.subcategory}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: CINZA, textTransform: 'uppercase' }}>
              <IconePin />
              {campaign.location}
            </span>
          </div>

          <h1 style={{ margin: '14px 0 0', fontSize: 29, lineHeight: 1.2, fontWeight: 700, color: TEXTO, textWrap: 'balance' }}>
            {campaign.title}
          </h1>

          <div style={{ marginTop: 14, fontSize: 16, fontWeight: 600, color: '#3f4254' }}>ID: {campaign.codeId}</div>

          {/* Progresso + valores (no desktop ficam na coluna lateral) */}
          <div style={{ marginTop: 34, height: 6, borderRadius: 3, background: '#e4e6ef', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, background: VERDE, width: `${progresso}%` }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: VERDE, lineHeight: 1.1 }}>{brl(campaign.currentAmount)}</span>
            <span style={{ fontSize: 16, color: CINZA }}>de {brl(campaign.targetAmount)}</span>
          </div>

          <div style={{ background: '#eefbf2', borderRadius: 6, padding: '14px 16px', marginTop: 26, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, color: '#3f4254', display: 'flex', alignItems: 'center', gap: 6 }}>
                Corações Recebidos <Coracao cor="#1b6e3d" tamanho={17} />
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: TEXTO }}>{campaign.heartsCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, color: '#3f4254' }}>Apoiadores</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: TEXTO }}>{campaign.supportersCount}</span>
            </div>
          </div>

          <p style={{ margin: '24px 0 0', fontSize: 16, lineHeight: 1.55, color: '#4a4a4e', textWrap: 'pretty' }}>
            {campaign.summary}
          </p>

          <div style={{ marginTop: 26, fontSize: 16, lineHeight: 1.6, color: '#4a4a4e', textWrap: 'pretty' }}>
            <CitacaoDestaque texto={abertura} tamanho={18} />
            {paragrafos.map((paragrafo, i) => (
              <ParagrafoHistoria key={i} texto={paragrafo} primeiro={i === 0} />
            ))}
          </div>

          <div style={{ height: 1, background: '#e6e6e9', margin: '24px 0 20px' }} />

          <div style={{ background: '#f7f7f9', borderRadius: 12, padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <img
              src={campaign.organizer.avatarUrl}
              alt={campaign.organizer.name}
              // contain, não cover: o organizador é um carimbo, e cortar comeria a borda dele.
              style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'contain', background: '#fff', display: 'block', flex: 'none' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: TEXTO }}>{campaign.organizer.name}</span>
              <span style={{ fontSize: 14, color: '#5e6278' }}>Ativo(a) desde {campaign.organizer.activeSince}</span>
            </div>
          </div>
        </div>

        {/* ---------- ABAS (rolam na horizontal) ---------- */}
        <div
          style={{
            display: 'flex',
            gap: 30,
            marginTop: 30,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {ABAS.map((aba, i) => (
            <span
              key={aba}
              style={{
                fontSize: 20,
                fontWeight: i === 0 ? 700 : 400,
                color: i === 0 ? VERDE : '#3f4254',
                borderBottom: i === 0 ? `3px solid ${VERDE}` : '2px solid #d9d9de',
                padding: '0 16px 14px',
                whiteSpace: 'nowrap',
                flex: 'none',
              }}
            >
              {aba}
            </span>
          ))}
        </div>

        {/* O cartão "Sobre" saiu: chave Pix, data, foto e história repetiam o que já
            está no cartão do topo — a história inteira abre ali pelo "ver tudo". */}

        <div style={{ marginTop: 28, fontSize: 16, fontWeight: 700, color: '#3d3d40' }}>Denunciar essa vaquinha</div>
        <div style={{ marginTop: 14, marginBottom: 36, fontSize: 12.5, lineHeight: 1.6, color: '#8a8a8f' }}>
          AVISO LEGAL: O texto e as imagens incluídos nessa página são de única e exclusiva responsabilidade do
          criador da vaquinha e não representam a opinião ou endosso da plataforma Vakinha.
        </div>
      </div>

      {/* No lugar de "Outras histórias" (fora por enquanto; o componente segue em SecoesAtual.tsx). */}
      <QuemAjudou totalApoiadores={campaign.supportersCount} quemRecebe="as crianças do Nepal" />
      <RodapeAtual />

      {/* Folga para a barra fixa não cobrir o fim do rodapé */}
      <div aria-hidden style={{ height: 240, background: '#5a5a5e' }} />

      <BarraAcaoMobile aoAjudar={aoAbrirDoacao} />
    </div>
  );
};
