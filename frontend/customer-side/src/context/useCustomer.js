import { useContext } from 'react';
import { CustomerContext } from './customerContextValue';
export function useCustomer() {
  const value = useContext(CustomerContext);
  if (!value)
    throw new Error('useCustomer must be used inside CustomerProvider');
  return value;
}
