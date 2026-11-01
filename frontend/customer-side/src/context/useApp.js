import { useContext } from 'react';
import { AppContext } from './appContextValue';

export function useApp() {
  const value = useContext(AppContext);

  if (!value) {
    throw new Error('useApp must be used inside AppProvider');
  }

  return value;
}

