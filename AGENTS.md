# AGENTS.md — Directives for Claude Code & AI System Assistants

## 📌 Project Context & Assignment Summary
This repository represents the **official first design proposal (Concept #1)** delivered by a Senior Product Designer under contract to modernize and evolve the **Vakinha** crowdfunding platform.

### Key Mandate
- **Role**: Senior Lead Product Designer (Consultant).
- **Deliverable**: Concept #1 — High-Fidelity UI/UX Evolution Prototype.
- **Objective**: Dramatically elevate the visual trust, accessibility, typography, spatial rhythm, and donation conversion rates while preserving 100% of the original information architecture, user flows, and core features.
- **Brand Identity**: Must strictly utilize the official Vakinha logo asset (`https://i.ibb.co/nyPdCK9/vakinha-logo-1.webp`).

---

## 🎨 Design Philosophy & Architecture Rules

1. **Evolutionary, Not Destructive**:
   - Do NOT modify established user flows, navigation categories ("Como ajudar", "Descubra", "Como funciona"), or section placement.
   - Preserve all primary campaign components: Header metadata (category, location, ID), Gallery, Sidebar metrics (raised amount, target, hearts, supporters), Content Tabs ("Sobre", "Atualizações", "Quem ajudou", "Vakinha Premiada", "Selos"), and Related Campaigns.

2. **Trust & Conversion Engineering**:
   - The platform handles sensitive medical and social fundraising.
   - Trust indicators (GRAACC audit badges, "Doação Protegida" seals, verified biometric identity indicators) must remain prominent.
   - Donation CTA buttons must be high-contrast, obvious, and supported by instant PIX payment flows and preset amount triggers (R$ 25, R$ 50, R$ 100).

3. **Visual Aesthetics (2026 Benchmark)**:
   - Inspired by Stripe, Airbnb, Linear, and Apple UI craftsmanship.
   - Clean neutral canvas (`#f8fafc` / `#ffffff`), refined borders (`16px - 24px` radius), high-contrast typography, and generous negative space.
   - Zero AI clichés (no glassmorphism, no flashy neon gradients, no saturated glow effects).

---

## 🛠️ Repository Blueprint
- `src/App.tsx`: Main application shell with state management for donation overlays and toast notifications.
- `src/components/Navbar.tsx`: Sticky navigation header embedding official Vakinha branding.
- `src/components/CampaignHeader.tsx`: Campaign title, category tags, location, and share/favorite triggers.
- `src/components/CampaignGallery.tsx`: Interactive gallery with photo lightbox and GRAACC audit badges.
- `src/components/DonationSidebar.tsx`: Raised progress bar, conversion stats, and main "Quero Ajudar" trigger.
- `src/components/CampaignTabs.tsx`: Tabbed narrative, campaign updates timeline, supporter list, and security badges.
- `src/components/DonationModal.tsx`: High-conversion donation modal with preset values and instant PIX QR code generation.
- `src/components/Footer.tsx`: Official footer with trust seals, fast links, and app download triggers.
- `REDESIGN_DOCS.md`: Official client proposal documentation.
