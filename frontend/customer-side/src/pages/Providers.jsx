import { tr, trTemplate } from "../i18n/translations";
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListFilter, Map, List, RefreshCw, Search, LoaderCircle } from 'lucide-react';
import { RequestFrame } from '../components/app/RequestFrame';
import { ProviderCard } from '../components/app/ProviderCard';
import { NoProviders } from './NoProviders';
import { useApp } from '../context/useApp';
import { searchProviders, isProviderApiConfigured } from '../services/providerService';
import { filterCount } from '../utils/bookingValidation';
export function Providers() {
  const {
    request,
    location,
    providerFilters,
    setProviderFilters,
    providers,
    setSearchProviders,
    selectedProviderId,
    setSelectedProviderId
  } = useApp();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [view, setView] = useState('list');
  const [retry, setRetry] = useState(0);
  const navigate = useNavigate();
  const ready = Boolean(request.vehicleId && request.issueType && (Number.isFinite(location.latitude) || location.address && location.address !== 'Use current location'));
  useEffect(() => {
    if (!ready) {
      setStatus('setup');
      return;
    }
    const controller = new AbortController();
    setStatus('loading');
    setError('');
    searchProviders({
      ...request,
      location,
      filters: providerFilters
    }, controller.signal).then(data => {
      if (controller.signal.aborted) return;
      setSearchProviders(data.providers);
      setStatus('ready');
      const recommended = data.providers.find(provider => provider.id === data.recommendedProviderId);
      if (request.matchingMode === 'auto' && recommended && !selectedProviderId) {
        setSelectedProviderId(recommended.id);
        navigate(`/providers/${encodeURIComponent(recommended.id)}`, {
          replace: true
        });
      }
    }).catch(problem => {
      if (!controller.signal.aborted) {
        setError(problem.message);
        setStatus('error');
      }
    });
    return () => controller.abort();
    // A selection is not a new search; only request/filter changes or retry reload results.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, location, providerFilters, retry, ready, setSearchProviders, setSelectedProviderId, navigate]);
  function open(provider) {
    setSelectedProviderId(provider.id);
    navigate(`/providers/${encodeURIComponent(provider.id)}`);
  }
  function schedule() {
    navigate('/provider-filters?schedule=1');
  }
  return <RequestFrame title={tr("Your nearby buddies")} subtitle={status === 'ready' ? trTemplate(["", " available \xB7 ", " assistance"], [providers.length, request.issueType]) : tr("Find the right help around your pickup.")} backTo="/request/matching">
    <div className="request-form">
      <div className="provider-tools">
        <Link className="provider-chip" to="/provider-filters"><ListFilter size={15} />{tr("Filters")} {filterCount(providerFilters) ? trTemplate([" \xB7 ", ""], [filterCount(providerFilters)]) : ''}</Link>
        <button className="provider-chip" type="button" aria-pressed={providerFilters.verifiedOnly} onClick={() => setProviderFilters(current => ({
          ...current,
          verifiedOnly: !current.verifiedOnly
        }))}>{tr("Verified")}</button>
        <div className="provider-view-toggle" role="group" aria-label={tr("Provider view")}><button type="button" aria-label={tr("List view")} title={tr("List view")} aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={18} /></button><button type="button" aria-label={tr("Map view")} title={tr("Map view")} aria-pressed={view === 'map'} onClick={() => setView('map')}><Map size={18} /></button></div>
      </div>
      <label className="provider-sort">{tr("Sort by")}<select value={providerFilters.sort} onChange={event => setProviderFilters(current => ({
          ...current,
          sort: event.target.value
        }))}><option value="eta">{tr("Fastest arrival")}</option><option value="price">{tr("Lowest visit estimate")}</option><option value="rating">{tr("Highest rating")}</option><option value="distance">{tr("Nearest first")}</option></select></label>
      {status === 'loading' && <div className="provider-loading" role="status"><LoaderCircle size={28} className="auth-spin" /><p>{tr("Finding available buddies...")}</p><div className="provider-skeleton" /><div className="provider-skeleton" /></div>}
      {status === 'setup' && <div className="provider-empty"><Search size={36} /><h2>{tr("Tell us what you need")}</h2><p>{tr("Choose your vehicle, issue and pickup before searching.")}</p><Link className="auth-primary" to="/app">{tr("Request assistance")}</Link></div>}
      {status === 'error' && <div className="provider-empty" role="status"><Search size={36} /><h2>{isProviderApiConfigured ? tr("Could not load buddies") : tr("Provider search is not connected yet")}</h2><p>{tr(error)}</p><button type="button" className="auth-secondary" onClick={() => setRetry(value => value + 1)}><RefreshCw size={18} />{tr("Try again")}</button><Link className="provider-text-link" to="/confirm-location">{tr("Check pickup location")}</Link></div>}
      {status === 'ready' && !providers.length && <NoProviders radius={providerFilters.radiusKm} onExpand={() => setProviderFilters(current => ({
        ...current,
        radiusKm: Math.min(30, Math.max(15, current.radiusKm + 10))
      }))} onRetry={() => setRetry(value => value + 1)} onSchedule={schedule} />}
      {status === 'ready' && providers.length > 0 && <div className="provider-results" key={view}>
        {request.matchingMode === 'auto' && <p className="auth-hint">{tr("Prefer to choose? Review any available buddy below.")}</p>}
        {providers.map(provider => <div key={provider.id}>
          {view === 'map' && <ProviderMap provider={provider} />}
          <ProviderCard {...provider} mapUnavailable={view === 'map' && !(Number.isFinite(provider.latitude) && Number.isFinite(provider.longitude))} selected={selectedProviderId === provider.id} onClick={() => open(provider)} />
        </div>)}
      </div>}
    </div>
  </RequestFrame>;
}
function ProviderMap({
  provider
}) {
  if (!Number.isFinite(provider.latitude) || !Number.isFinite(provider.longitude)) return null;
  const {
    latitude: lat,
    longitude: lng
  } = provider;
  return <iframe className="provider-map" title={trTemplate(["Location of ", ""], [provider.name])} loading="lazy" referrerPolicy="no-referrer" src={`https://www.openstreetmap.org/export/embed.html?bbox=${[lng - .008, lat - .008, lng + .008, lat + .008].join(',')}&layer=mapnik&marker=${lat},${lng}`} />;
}
