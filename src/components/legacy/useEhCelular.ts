import { useEffect, useState } from 'react';

/**
 * Até 1023px vale a tela de celular. O desktop tem colunas fixas (730 + 32 + 335 =
 * 1097px): abaixo disso a lateral quebrava para baixo e o "Quero Ajudar" ia parar
 * depois do aviso legal, no fim da página. Em tablet e celular deitado a tela de
 * uma coluna com barra fixa é a que mantém o CTA à mão.
 */
const CONSULTA = '(max-width: 1023px)';

/** true em telas de celular e tablet (< 1024px). Reage a rotação/redimensionamento. */
export function useEhCelular(): boolean {
  const [ehCelular, setEhCelular] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia(CONSULTA).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(CONSULTA);
    const aoMudar = (e: MediaQueryListEvent) => setEhCelular(e.matches);
    mq.addEventListener('change', aoMudar);
    return () => mq.removeEventListener('change', aoMudar);
  }, []);

  return ehCelular;
}
