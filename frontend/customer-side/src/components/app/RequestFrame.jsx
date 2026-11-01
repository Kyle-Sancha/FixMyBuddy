import { tr, trTemplate } from "../../i18n/translations";
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { BrandLogo } from '../BrandLogo';
export function RequestFrame({
  backTo = '/app',
  title,
  subtitle,
  children
}) {
  const {
    pathname
  } = useLocation();
  const { request } = useApp();
  const towing = request.serviceType === 'towing';
  const step = towing ? { '/request/towing': 1, '/request/matching': 2, '/confirm-request': 3 }[pathname] : { '/request': 1, '/request/details': 2, '/confirm-location': 3, '/request/matching': 4 }[pathname];
  return <section className="request-shell">
    <header className="request-header">
      <Link to={backTo} className="auth-back" aria-label={backTo === '/app' ? tr("Back to home") : tr("Back to previous step")}><ArrowLeft size={22} /><span>{tr("Back")}</span></Link>
      <Link to="/app" className="request-brand"><BrandLogo />{tr("FixMyBuddy")}</Link>
      <span>{tr("ROADSIDE")}</span>
    </header>
    <div className="request-content" key={pathname}>
      {step && <p className="request-progress">{trTemplate(['Step ', ' of ', ''], [step, towing ? 3 : 4])}</p>}
      <h1>{tr(title)}</h1><p className="request-subtitle">{tr(subtitle)}</p>
      {children}
    </div>
  </section>;
}
