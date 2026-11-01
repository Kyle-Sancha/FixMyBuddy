import { tr } from "../i18n/translations";
import { Navigate, useNavigate } from 'react-router-dom';
import { ListFilter, Sparkles, ArrowRight } from 'lucide-react';
import { RequestFrame } from '../components/app/RequestFrame';
import { RequestVehicle } from '../components/app/RequestVehicle';
import { useApp } from '../context/useApp';
import { useCustomer } from '../context/useCustomer';
import { validateTowingDestination } from '../utils/towingDestination';
export function RequestMatching() {
  const {
    request,
    location,
    attachments,
    updateRequest
  } = useApp();
  const {
    selectedVehicle,
    vehicleStatus
  } = useCustomer();
  const navigate = useNavigate();
  if (vehicleStatus === 'loading') return <RequestFrame title={tr("Your vehicle")} subtitle={tr("Loading...")} />;
  if (request.serviceType === 'towing' && validateTowingDestination(request, location)) return <Navigate to="/request/towing" replace />;
  if (!selectedVehicle || !request.issueType) return <Navigate to="/request" replace />;
  if (!(Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) && (!location.address || location.address === 'Use current location' || location.address.trim().length < 5)) return <Navigate to="/confirm-location" replace />;
  return <RequestFrame backTo={request.serviceType === 'towing' ? '/request/towing' : '/confirm-location'} title={tr("Find your buddy")} subtitle={tr("Choose how you want to find help.")}>
    <form className="request-form" onSubmit={event => {
      event.preventDefault();
      navigate('/providers');
    }}>
      <RequestVehicle vehicle={selectedVehicle} service={request.serviceType} />
      <div className="request-summary"><strong>{request.issueType}</strong><p>{location.address}</p>{request.serviceType === 'towing' && <p>{tr("Destination:")} {request.destination}</p>}{request.scheduledAt && <p>{tr("Scheduled:")} {new Date(request.scheduledAt).toLocaleString()}</p>}<small>{attachments.length} {tr("attachments selected \xB7 Not submitted")}</small></div>
      <fieldset className="request-issues"><legend className="sr-only">{tr("Provider matching")}</legend>
        {[{
          value: 'manual',
          title: 'Choose a provider',
          description: 'Compare available providers before choosing.',
          icon: ListFilter
        }, {
          value: 'auto',
          title: 'Automatically match me',
          description: 'Review the suggested provider before confirming.',
          icon: Sparkles
        }].map(({
          value,
          title,
          description,
          icon: Icon
        }) => <label key={value} className={`request-issue ${request.matchingMode === value ? 'is-selected' : ''}`}><input type="radio" name="matching" checked={request.matchingMode === value} onChange={() => updateRequest({
            matchingMode: value
          })} /><Icon size={22} /><span><strong>{tr(title)}</strong><small>{tr(description)}</small></span></label>)}
      </fieldset>
      <p className="auth-hint">{tr(request.serviceType === 'towing' ? 'Review your towing provider, route and transport estimate before booking.' : 'Review the provider and visit estimate before booking. Repairs need separate approval after diagnosis.')}</p>
      <button type="submit" className="auth-primary request-continue"><ArrowRight size={20} />{request.matchingMode === 'auto' ? tr("Find my match") : tr("Find available providers")}</button>
    </form>
  </RequestFrame>;
}
