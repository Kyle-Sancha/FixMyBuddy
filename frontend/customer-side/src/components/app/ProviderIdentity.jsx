import { tr, trTemplate } from "../../i18n/translations";
import { ShieldCheck, Star, UserRound } from 'lucide-react';
export function ProviderIdentity({
  provider,
  compact = false
}) {
  const initials = provider.name?.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return <div className={`provider-identity ${compact ? 'is-compact' : ''}`}>
    <span className="provider-avatar" aria-hidden="true">{initials || <UserRound size={22} />}</span>
    <span className="provider-identity-text"><strong>{provider.name}</strong>
      <small>{Number.isFinite(provider.rating) ? <><Star size={12} /> {provider.rating.toFixed(1)}{Number.isFinite(provider.reviewsCount ?? provider.reviews) ? trTemplate([" (", ")"], [provider.reviewsCount ?? provider.reviews]) : ''}</> : tr("No rating available")}
      {provider.verified === true && <><ShieldCheck size={13} />{tr("Verified")}</>}</small>
    </span>
  </div>;
}
