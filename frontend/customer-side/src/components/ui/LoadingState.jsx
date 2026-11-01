import { LoaderCircle, Wrench } from 'lucide-react';
import { useLocale } from '../../context/useLocale';

export function LoadingState({ label }) {
  const { t } = useLocale();
  return <div className="buddy-loader" role="status" aria-live="polite" aria-busy="true">
    <span className="buddy-loader-symbol" aria-hidden="true"><LoaderCircle className="buddy-loader-ring" size={64} strokeWidth={1.5} /><Wrench className="buddy-loader-wrench" size={24} /></span>
    <span>{label || t('Loading...','Kinukuha...')}</span>
  </div>;
}

