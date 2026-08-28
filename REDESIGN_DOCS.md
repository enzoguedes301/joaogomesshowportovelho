# Proposta de Redesign Oficial — Plataforma Vakinha (Exemplo #1)

> **Documentação de Entrega de Projeto**  
> **Contratado:** Lead Product Design & UX Engineering Consultant  
> **Cliente:** Vakinha  
> **Status da Entrega:** Exemplo #1 / Conceito de Evolução Visual e Conversão (Fase 1)  

---

## 🎯 Resumo do Projeto

Este repositório contém a **primeira proposta oficial de redesign (Exemplo #1)** para a plataforma **Vakinha**. O objetivo do trabalho contratado é demonstrar como a interface pode ser elevada aos padrões globais de design de produto (benchmark: *Stripe, Airbnb, Linear, Apple*), aumentando expressivamente a **confiança, clareza e taxa de conversão de doações**, sem alterar a arquitetura de informação já consolidada e familiar para milhões de usuários.

---

## 📐 Diretrizes Estratégicas do Redesign

### 1. Preservação Total da Arquitetura de Informação
- Mantida a estrutura de navegação principal (`Como ajudar`, `Descubra`, `Como funciona`, `Minha conta`).
- Mantida a navegação em abas na página de campanha (`Sobre`, `Atualizações`, `Quem ajudou`, `Vakinha Premiada`, `Selos recebidos`).
- Preservados os dados essenciais: ID da vaquinha, selos de verificação, hospital parceiro (GRAACC), valor arrecadado, meta, número de corações e apoiadores.

### 2. Aumento de Confiança & Credibilidade (Trust Engineering)
- **Identidade Oficial:** Uso estrito do logotipo original do Vakinha (`https://i.ibb.co/nyPdCK9/vakinha-logo-1.webp`) na barra de navegação e rodapé.
- **Micro-Barra de Segurança:** Destaque no topo informando plataforma 100% segura e doações auditadas.
- **Selo Doação Protegida:** Card interativo explicando a garantia Vakinha de repasse e verificação biométrica.
- **Comprovante Hospitalar:** Bloco destacado com dados de acompanhamento médico no hospital GRAACC.

### 3. Otimização do Fluxo de Doação (Conversion Rate Optimization)
- **Modal de Doação em 3 Passos:**
  1. Seleção rápida de valores pré-definidos (R$ 25, R$ 50, R$ 100, R$ 250) ou valor customizado + corações de incentivo.
  2. Identificação do doador ou opção de doação anônima + mensagem de carinho.
  3. Pagamento instantâneo via PIX com QR Code gerado e botão "Copia e Cola" com feedback visual imediato.

---

## 📁 Estrutura de Arquivos do Projeto

```
/
├── AGENTS.md                  # Instruções para IAs (Claude Code, Cursor, GitHub Copilot)
├── REDESIGN_DOCS.md           # Documentação oficial do trabalho de redesign
├── README.md                  # Guia de execução e informações do projeto
├── src/
│   ├── App.tsx                # Shell principal da aplicação
│   ├── types.ts               # Interfaces TypeScript (Campaign, Donor, Update, etc.)
│   ├── data/
│   │   └── mockData.ts        # Dados reais de teste (Campanha Samuel/GRAACC)
│   └── components/
│       ├── Navbar.tsx         # Cabeçalho fixo com logo oficial do Vakinha
│       ├── CampaignHeader.tsx # Título, categoria, localização e ações
│       ├── CampaignGallery.tsx# Galeria de fotos com lightbox e selos
│       ├── DonationSidebar.tsx# Sidebar sticky de progresso e botão de doação
│       ├── CampaignTabs.tsx   # Abas com a história, atualizações e apoiadores
│       ├── DonationModal.tsx  # Modal de doação instantânea via PIX
│       ├── ShareModal.tsx     # Modal de compartilhamento WhatsApp/redes
│       ├── ProtectedDonationModal.tsx # Modal explicativo de doação protegida
│       ├── SearchModal.tsx    # Modal de busca rápida de vaquinhas
│       ├── RelatedCampaigns.tsx # Vitrine de outras causas relevantes
│       ├── Footer.tsx         # Rodapé completo com selo de segurança e apps
│       └── RedesignNotes.tsx  # Painel flutuante de notas do redesign
```

---

## 🚀 Como Visualizar
O projeto roda em React 18 + Vite + Tailwind CSS. A aplicação compila nativamente e exibe a interface responsiva completa pronta para revisão e testes de usabilidade.
