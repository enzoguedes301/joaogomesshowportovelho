import { Campaign, Donor, CampaignUpdate, RelatedCampaign, BadgeItem } from '../types';

/**
 * DADOS DE EXEMPLO para a tela de campanha.
 *
 * O texto da campanha veio do cliente. Os números (valor arrecadado, meta,
 * apoiadores, corações), as datas, a localização e os depoimentos abaixo são
 * PREENCHIMENTO DE PROTÓTIPO — servem para a tela ter volume na apresentação.
 * Antes de qualquer publicação, trocar pelos dados reais da campanha: exibir
 * arrecadação e apoiadores inventados como se fossem reais engana quem doa.
 */
export const mainCampaign: Campaign = {
  id: '4192874',
  codeId: '4192874',
  title: 'Ajuda urgente para as famílias atingidas pelas enchentes no Nepal',
  category: 'DESASTRE HUMANITÁRIO',
  subcategory: 'CATÁSTROFE NATURAL',
  location: 'SÃO PAULO / SP',
  currentAmount: 5187.00,
  targetAmount: 1000000.00,
  heartsCount: 156,
  supportersCount: 225,
  createdAt: '09/08/2026',
  organizer: {
    name: 'Salve o Nepal',
    avatarUrl: '/organizador-sos-nepal.jpg',
    activeSince: 'agosto/2026',
    verified: true,
    location: 'São Paulo, SP',
    documentsVerified: true,
  },
  summary:
    'Em 26 de agosto de 2026, uma forte inundação súbita atingiu áreas do Nepal próximas à fronteira com o Tibete. A força da água, da lama e das rochas destruiu casas, estradas, pontes e estruturas de energia, deixando famílias em situação de emergência.',
  fullStory: [
    'As equipes de resgate continuam mobilizadas para localizar pessoas desaparecidas, retirar sobreviventes das áreas de risco e levar assistência às comunidades afetadas. O balanço oficial ainda está sendo atualizado pelas autoridades, e a dimensão da destruição continua sendo avaliada.',
    'Esta Vakinha foi criada para reunir recursos e apoiar a operação de ajuda no local ocorrido. O objetivo é contribuir com a aquisição e a distribuição de água potável, alimentos, itens de higiene, materiais de emergência e outros recursos definidos conforme as necessidades confirmadas das famílias atingidas.',
    'Informações da campanha:',
    '• Meta total: R$ 1.000.000,00',
    '• Finalidade: apoio emergencial às comunidades atingidas pelas enchentes no Nepal',
    '• Aplicação dos recursos: alimentos, água, higiene, materiais emergenciais e logística de atendimento, conforme as necessidades confirmadas no local',
    '• Prestação de contas: atualizações, comprovantes e informações sobre a utilização dos recursos serão publicados nesta campanha',
    'Uma contribuição de R$ 50, R$ 100, R$ 500, R$ 1.000 ou qualquer outro valor pode ajudar esta campanha a avançar. Se você puder contribuir com um valor maior, sua doação poderá fortalecer os primeiros esforços de assistência. Doe somente o valor que estiver dentro das suas possibilidades.',
    'Se você não puder doar neste momento, compartilhar esta Vakinha também é uma forma importante de ajudar. Uma única divulgação pode fazer a campanha chegar a pessoas, empresas e grupos dispostos a contribuir com a assistência emergencial.',
    'Ajude o Nepal. Faça sua contribuição, compartilhe esta campanha e acompanhe as atualizações sobre a aplicação dos recursos. Juntos, podemos transformar solidariedade em ajuda real.',
    'Os números da emergência podem ser alterados conforme as autoridades atualizam o balanço. Esta campanha será atualizada sempre que novas informações verificadas estiverem disponíveis.',
  ],
  images: [
    {
      url: '/sos-nepal.jpg',
      caption: 'Equipes entregam água e alimentos às famílias atingidas no Nepal',
    },
  ],
};

/** Depoimentos de exemplo (texto do cliente). Nenhuma doação real por trás deles — ver o aviso no topo do arquivo. */
export const sampleDonors: Donor[] = [
  {
    id: 'd1',
    name: 'Daniela N.',
    amount: 50.00,
    date: 'há 3 min',
    message: 'Doação feita. Que as crianças possam sobreviver e ter um lindo futuro pela frente. ❤️',
    isAnonymous: false,
    hearts: 341,
  },
  {
    id: 'd2',
    name: 'Emerson O.',
    amount: 100.00,
    date: 'há 12 min',
    message: 'Doei R$ 100, era o mínimo que eu poderia fazer por ter o privilégio que essas crianças não têm.',
    isAnonymous: false,
    hearts: 287,
  },
  {
    id: 'd3',
    name: 'Flávia P.',
    amount: 25.00,
    date: 'há 18 min',
    message: 'Compartilhado. Vamos todos juntos poder proporcionar um futuro para essas crianças.',
    isAnonymous: false,
    hearts: 312,
  },
  {
    id: 'd4',
    name: 'Gerson Q.',
    amount: 100.00,
    date: 'há 31 min',
    message: 'Gente, pelo amor de Deus, vamos ajudar essas crianças o quanto antes!!! 🙏',
    isAnonymous: false,
    hearts: 198,
  },
];

export const sampleUpdates: CampaignUpdate[] = [
  {
    id: 'up1',
    date: '14/08/2026',
    title: 'Pandora voltou a balançar o rabinho',
    content:
      'As lesões estão cicatrizando e ela vem reagindo muito bem ao tratamento. Está cada dia mais carinhosa e já reconhece a família na hora dos curativos.',
    likesCount: 34,
  },
  {
    id: 'up2',
    date: '11/08/2026',
    title: 'Como estão sendo usadas as doações',
    content:
      'O valor arrecadado até aqui cobriu os primeiros curativos das queimaduras, os exames dos olhos e os medicamentos desta semana. Seguimos com as consultas de acompanhamento da córnea.',
    likesCount: 42,
  },
];

export const relatedCampaigns: RelatedCampaign[] = [
  {
    id: 'r1',
    title: 'Urgente: Cirurgia e tratamento para a gatinha Nina',
    category: 'ANIMAIS',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600',
    currentAmount: 0.01,
    targetAmount: 3000.00,
    heartsCount: 48,
    isSponsored: true,
    location: 'Rio de Janeiro / RJ'
  },
  {
    id: 'r2',
    title: 'Estudante de Medicina de 50 anos precisa de ajuda',
    category: 'EDUCAÇÃO',
    imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=600',
    currentAmount: 600.00,
    targetAmount: 200000.00,
    heartsCount: 0,
    isSponsored: true,
    location: 'Belo Horizonte / MG'
  },
  {
    id: 'r3',
    title: 'Tratamento médico Orah Beila bat Sarah',
    category: 'SAÚDE',
    imageUrl: 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&q=80&w=600',
    currentAmount: 64839.36,
    targetAmount: 60000.00,
    heartsCount: 228,
    isSponsored: false,
    location: 'São Paulo / SP'
  },
  {
    id: 'r4',
    title: 'Áurea bravo - Prótese do braço direito',
    category: 'SAÚDE',
    imageUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=600',
    currentAmount: 63871.91,
    targetAmount: 200000.00,
    heartsCount: 527,
    isSponsored: false,
    location: 'Curitiba / PR'
  }
];

export const sampleBadges: BadgeItem[] = [
  {
    id: 'b1',
    title: 'Identidade Verificada',
    description: 'Documentos do criador da vaquinha validados com biometria facial pela plataforma Vakinha.',
    iconName: 'ShieldCheck',
    earnedDate: '09/08/2026'
  },
  {
    id: 'b2',
    title: 'Laudo Veterinário Validado',
    description: 'Relatório da clínica que atende a Pandora verificado por auditoria de segurança.',
    iconName: 'FileText',
    earnedDate: '11/08/2026'
  },
  {
    id: 'b3',
    title: 'Transparência nas Atualizações',
    description: 'Criador publica prestações de contas frequentes e fotos do progresso.',
    iconName: 'Award',
    earnedDate: '14/08/2026'
  },
  {
    id: 'b4',
    title: 'Comunidade Mobilizada',
    description: 'Mais de 50 corações de apoio recebidos de doadores de todo o Brasil.',
    iconName: 'HeartHandshake',
    earnedDate: '15/08/2026'
  }
];
