import { tr } from "../i18n/translations";
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, RotateCcw, ShieldCheck } from 'lucide-react';
import { RequestFrame } from '../components/app/RequestFrame';
import { useApp } from '../context/useApp';
import { defaultProviderFilters, validateFilters } from '../utils/bookingValidation';
import { issuesFor } from '../data/requestIssues';
import { localDateTime, validateSchedule } from '../utils/vehicleValidation';
export function ProviderFilters() {
  const {
    request,
    updateRequest,
    providerFilters,
    setProviderFilters,
    setSelectedProviderId
  } = useApp();
  const [params] = useSearchParams();
  const [filters, setFilters] = useState(providerFilters);
  const [scheduled, setScheduled] = useState(Boolean(request.scheduledAt) || params.has('schedule'));
  const [time, setTime] = useState(request.scheduledAt ? localDateTime(new Date(request.scheduledAt)) : '');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const update = (key, value) => {
    setFilters(current => ({
      ...current,
      [key]: value
    }));
    setError('');
  };
  function submit(event) {
    event.preventDefault();
    const problem = validateFilters(filters) || (scheduled ? validateSchedule(time) : '');
    if (problem) {
      setError(problem);
      return;
    }
    setProviderFilters({
      ...filters,
      maximumVisitPrice: filters.maximumVisitPrice === '' ? '' : Number(filters.maximumVisitPrice)
    });
    updateRequest({
      scheduledAt: scheduled ? new Date(time).toISOString() : null
    });
    setSelectedProviderId('');
    navigate('/providers');
  }
  return <RequestFrame title={tr("Find the right fit")} subtitle={tr("Filter providers around your pickup.")} backTo="/providers">
    <form className="request-form provider-filter-form" onSubmit={submit}>
      <label className="request-field"><span className="provider-filter-label">{tr("Search radius")}<strong>{filters.radiusKm} {tr("km")}</strong></span><input type="range" min="1" max="30" step="1" value={filters.radiusKm} onChange={event => update('radiusKm', Number(event.target.value))} /></label>
      <div className="provider-tools" role="group" aria-label={tr("Quick search radius")}>{[2, 5, 15].map(radius => <button className="provider-chip" type="button" key={radius} aria-pressed={filters.radiusKm === radius} onClick={() => update('radiusKm', radius)}>{radius} {tr("km")}</button>)}</div>
      <label className="request-field">{tr("Specialty")}<select value={filters.specialty} onChange={event => update('specialty', event.target.value)}><option value="">{tr("All services")}</option>{issuesFor(request.serviceType).map(issue => <option key={issue.title}>{issue.title}</option>)}</select></label>
      <fieldset className="provider-filter-group"><legend>{tr("Minimum rating")}</legend><div className="provider-tools">{[[4.5, '4.5+ stars'], [4, '4.0+ stars'], [0, 'Any']].map(([value, label]) => <label className="provider-chip" key={value} data-selected={filters.minimumRating === value}><input className="sr-only" type="radio" name="rating" checked={filters.minimumRating === value} onChange={() => update('minimumRating', value)} />{tr(label)}</label>)}</div></fieldset>
      <label className="provider-switch"><ShieldCheck size={20} /><span>{tr("Verified providers only")}</span><input type="checkbox" role="switch" checked={filters.verifiedOnly} onChange={event => update('verifiedOnly', event.target.checked)} /></label>
      <label className="request-field">{tr("Maximum visit estimate (PHP)")}<input type="number" min="0" step="0.01" value={filters.maximumVisitPrice} placeholder={tr("No price limit")} onChange={event => update('maximumVisitPrice', event.target.value)} /></label>
      <fieldset className="provider-filter-group"><legend>{tr("Availability")}</legend><div className="provider-tools">{[[false, 'Available now'], [true, 'Scheduled']].map(([value, label]) => <label className="provider-chip" key={label} data-selected={scheduled === value}><input className="sr-only" type="radio" name="availability" checked={scheduled === value} onChange={() => setScheduled(value)} />{tr(label)}</label>)}</div></fieldset>
      {scheduled && <label className="request-field">{tr("Date and time")}<input type="datetime-local" required min={localDateTime(new Date())} value={time} onChange={event => setTime(event.target.value)} /><small>{tr("Times use your device time zone. Availability will be checked.")}</small></label>}
      {error && <p className="auth-error" role="alert">{tr(error)}</p>}
      <button type="submit" className="auth-primary request-continue"><ArrowRight size={19} />{tr("Apply filters")}</button>
      <button type="button" className="auth-secondary" onClick={() => {
        setFilters(defaultProviderFilters);
        setScheduled(false);
        setTime('');
        setError('');
      }}><RotateCcw size={18} />{tr("Reset all filters")}</button>
    </form>
  </RequestFrame>;
}
