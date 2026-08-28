import { useCallback, useEffect, useState } from 'react';

/**
 * Roteamento do tamanho do projeto: duas telas (a vaquinha e /checkout).
 * Usa a History API direto — uma biblioteca de rotas aqui seria peso morto.
 */

export interface Rota {
  caminho: string;
  parametros: URLSearchParams;
}

function lerRota(): Rota {
  return {
    caminho: window.location.pathname,
    parametros: new URLSearchParams(window.location.search),
  };
}

export function useRota() {
  const [rota, setRota] = useState<Rota>(lerRota);

  useEffect(() => {
    // Botão voltar do navegador.
    const aoVoltar = () => setRota(lerRota());
    window.addEventListener('popstate', aoVoltar);
    return () => window.removeEventListener('popstate', aoVoltar);
  }, []);

  const navegar = useCallback((destino: string) => {
    window.history.pushState({}, '', destino);
    setRota(lerRota());
    window.scrollTo(0, 0);
  }, []);

  return { rota, navegar };
}
