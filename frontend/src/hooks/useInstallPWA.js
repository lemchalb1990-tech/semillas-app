import { useState, useEffect } from 'react';

export function useInstallPWA() {
  const [prompt, setPrompt]         = useState(null);
  const [instalada, setInstalada]   = useState(false);
  const [esIOS, setEsIOS]           = useState(false);

  useEffect(() => {
    // Ya está instalada si corre en modo standalone
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setInstalada(standalone);

    // Detectar iOS (Safari no dispara beforeinstallprompt)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    setEsIOS(ios);

    const handler = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalada(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function instalar() {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalada(true);
    setPrompt(null);
  }

  return { prompt, instalada, esIOS, instalar };
}
