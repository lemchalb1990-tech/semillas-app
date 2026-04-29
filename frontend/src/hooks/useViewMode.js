import { useState, useEffect } from 'react';

const MOBILE_QUERY = '(max-width: 768px)';

function isMobile() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

export function useViewMode(key, defaultMode = 'cards') {
  const [mode, setModeState] = useState(
    () => localStorage.getItem(`viewMode_${key}`) || defaultMode
  );
  const [mobile, setMobile] = useState(isMobile);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const handler = (e) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  function setMode(m) {
    localStorage.setItem(`viewMode_${key}`, m);
    setModeState(m);
  }

  // En móvil siempre tarjetas, ignorando la preferencia guardada
  const efectivoMode = mobile ? 'cards' : mode;

  return [efectivoMode, setMode, mobile];
}
