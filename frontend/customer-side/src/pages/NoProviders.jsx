import { tr, trTemplate } from "../i18n/translations";
import { CalendarDays, Headphones, Radar, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
export function NoProviders({
  radius,
  onExpand,
  onRetry,
  onSchedule
}) {
  return <div className="provider-empty">
    <span className="provider-empty-symbol"><Radar size={34} /></span><h2>{tr("No buddies nearby yet")}</h2><p>{tr("No matching providers were returned within")} {radius} {tr("km. Try a wider search or choose another time.")}</p>
    <button type="button" className="provider-option" onClick={onSchedule}><CalendarDays size={20} /><span><strong>{tr("Book for later")}</strong><small>{tr("Choose a date and time. Availability still needs confirmation.")}</small></span></button>
    <Link className="provider-option" to="/account"><Headphones size={20} /><span><strong>{tr("Need a hand?")}</strong><small>{tr("Check your account and contact options.")}</small></span></Link>
    <button type="button" className="auth-primary" onClick={onExpand} disabled={radius >= 30}><Radar size={20} />{radius >= 30 ? tr("Maximum search radius reached") : trTemplate(["Expand search to ", " km"], [Math.min(30, Math.max(15, radius + 10))])}</button>
    <button type="button" className="auth-secondary" onClick={onRetry}><RefreshCw size={18} />{tr("Try again")}</button>
  </div>;
}
