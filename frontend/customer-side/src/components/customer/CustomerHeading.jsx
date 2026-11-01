import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../context/useLocale';

export function CustomerHeading({ title, children, backTo }) {
  const { t } = useLocale();
  return (
    <div className="customer-heading">
      {backTo && (
        <Link to={backTo} className="auth-back">
          <ArrowLeft size={17} /> {t('Back','Bumalik')}
        </Link>
      )}
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  );
}
