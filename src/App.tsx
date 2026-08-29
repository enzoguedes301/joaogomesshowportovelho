import { lazy, Suspense, useCallback, useState } from 'react';
import { ModalDoacao } from './components/legacy/ModalDoacao';
import { VakinhaAtualPage } from './components/legacy/VakinhaAtualPage';
import { useEhCelular } from './components/legacy/useEhCelular';
import { mainCampaign } from './data/mockData';
import type { Cobranca } from './pix/usePix';
import { useRota } from './rota';
import { Campaign } from './types';

const PaginaCheckout = lazy(() => import('./components/legacy/PaginaCheckout').then(m => ({ default: m.PaginaCheckout })));

/** Chamada do topo da tela de pagamento. */
const CHAMADA_CHECKOUT = 'Você é a nossa última esperança';

/** Página de campanha do Vakinha (desktop e celular) e a tela de pagamento em /checkout. */
export default function App() {
  const [campaign, setCampaign] = useState<Campaign>(mainCampaign);
  const [doando, setDoando] = useState(false);
  // Guardada ao gerar o PIX: evita que /checkout precise buscar de novo o que acabou de chegar.
  const [cobranca, setCobranca] = useState<Cobranca | null>(null);
  const ehCelular = useEhCelular();
  const { rota, navegar } = useRota();

  // PIX confirmado: o total e a contagem de apoiadores sobem na hora, sem recarregar.
  const somarDoacao = useCallback((valor: number) => {
    setCampaign(c => ({
      ...c,
      currentAmount: c.currentAmount + valor,
      supportersCount: c.supportersCount + 1,
    }));
  }, []);

  if (rota.caminho === '/checkout') {
    return (
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando...</div>}>
        <PaginaCheckout
          paymentId={cobranca?.paymentId ?? rota.parametros.get('p') ?? ''}
          cobranca={cobranca}
          chamada={CHAMADA_CHECKOUT}
          aoVoltar={() => {
            setCobranca(null);
            navegar('/');
          }}
          aoConfirmar={somarDoacao}
        />
      </Suspense>
    );
  }

  return (
    <>
      <VakinhaAtualPage campaign={campaign} aoAbrirDoacao={() => setDoando(true)} />
      <ModalDoacao
        aberto={doando}
        aoFechar={() => setDoando(false)}
        campanha={campaign.codeId}
        tituloCampanha={campaign.title}
        chamadaValores="Cada real salva uma vida"
        ehCelular={ehCelular}
        aoGerarPix={nova => {
          setCobranca(nova);
          setDoando(false);
          navegar(`/checkout?p=${encodeURIComponent(nova.paymentId)}`);
        }}
      />
    </>
  );
}
