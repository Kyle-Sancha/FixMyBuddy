import { useContext } from 'react';
import { LocaleContext } from './localeContext';
export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('LocaleProvider is missing.');
  return value;
}

