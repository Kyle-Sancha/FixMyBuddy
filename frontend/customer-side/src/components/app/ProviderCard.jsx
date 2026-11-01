import { tr, trTemplate } from "../../i18n/translations";
import { ChevronRight, Clock3, MapPin } from 'lucide-react';
import { ProviderIdentity } from './ProviderIdentity';
import { validEstimate } from '../../utils/bookingValidation';
export function ProviderCard({
  onClick,
  selected = false,
  ...provider
}) {
  const price = validEstimate(provider.estimate) ? provider.estimate.total : null;
  const content = <><ProviderIdentity provider={provider} compact />
    <div className="provider-card-metrics"><span><Clock3 size={18} />{Number.isFinite(provider.etaMinutes) ? trTemplate(["Arriving in ", " minutes"], [provider.etaMinutes]) : tr("Arrival time not available")}{Number.isFinite(provider.distanceKm) && <> · {provider.distanceKm}{tr("km")}</>}</span>
      <strong>{price !== null ? new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP'
        }).format(price) : tr("Quote pending")}</strong></div>
    {Array.isArray(provider.specialties) && <p className="provider-specialties">{provider.specialties.join(' · ')}</p>}
    {onClick && <span className="provider-card-open">{tr("View profile")}<ChevronRight size={15} /></span>}
    {provider.mapUnavailable && <p className="auth-hint"><MapPin size={14} />{tr("Map coordinates unavailable")}</p>}
  </>;
  return onClick ? <button type="button" className={`provider-card ${selected ? 'is-selected' : ''}`} onClick={onClick}>{content}</button> : <div className="provider-card">{content}</div>;
}
