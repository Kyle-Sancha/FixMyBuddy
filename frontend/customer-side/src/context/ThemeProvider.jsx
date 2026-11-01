import { useEffect, useState } from 'react';
import { ThemeContext } from './themeContext';

const storageKey = 'fixmybuddy-theme';
const validPreference = value => ['light', 'dark', 'system'].includes(value) ? value : 'system';

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => {
    try { return validPreference(localStorage.getItem(storageKey)); }
    catch { return 'system'; }
  });
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [storageError, setStorageError] = useState(false);
  const resolvedTheme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = event => setSystemDark(event.matches);
    setSystemDark(media.matches);
    media.addEventListener('change', update);
    const sync = event => {
      if (event.key === storageKey || event.key === null) {
        setPreference(validPreference(event.newValue));
        setStorageError(false);
      }
    };
    window.addEventListener('storage', sync);
    return () => { media.removeEventListener('change', update); window.removeEventListener('storage', sync); };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolvedTheme === 'dark' ? '#101827' : '#f6f8fc');
  }, [resolvedTheme]);

  function setTheme(next) {
    if (!['light', 'dark', 'system'].includes(next)) return;
    setPreference(next);
    try { localStorage.setItem(storageKey, next); setStorageError(false); }
    catch { setStorageError(true); }
  }

  return <ThemeContext.Provider value={{ preference, resolvedTheme, setTheme, storageError }}>{children}</ThemeContext.Provider>;
}
