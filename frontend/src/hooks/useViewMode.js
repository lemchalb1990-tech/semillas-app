import { useState } from 'react';

export function useViewMode(key, defaultMode = 'cards') {
  const [mode, setModeState] = useState(
    () => localStorage.getItem(`viewMode_${key}`) || defaultMode
  );

  function setMode(m) {
    localStorage.setItem(`viewMode_${key}`, m);
    setModeState(m);
  }

  return [mode, setMode];
}
