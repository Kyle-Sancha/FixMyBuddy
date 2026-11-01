import { Fragment, useEffect, useState } from 'react';
import { LocaleContext } from './localeContext';
import { setActiveLanguage, tr } from '../i18n/translations';
export function LocaleProvider({ children }) {
  const [language, setLanguageState] = useState(() => { let initial = 'en'; try { initial = localStorage.getItem('fixmybuddy-language') === 'fil' ? 'fil' : 'en'; } catch { /* Use English when storage is unavailable. */ } setActiveLanguage(initial); return initial; });
  const [storageError, setStorageError] = useState(false);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  function setLanguage(next) {
    if (!['en', 'fil'].includes(next)) return;
    setActiveLanguage(next);
    try { localStorage.setItem('fixmybuddy-language', next); setStorageError(false); } catch { setStorageError(true); }
    setLanguageState(next);
  }
  const t = (english, filipino) => language === 'fil' ? (filipino || tr(english)) : english;
  return <LocaleContext.Provider value={{ language, setLanguage, storageError, t }}><Fragment key={language}>{children}</Fragment></LocaleContext.Provider>;
}

