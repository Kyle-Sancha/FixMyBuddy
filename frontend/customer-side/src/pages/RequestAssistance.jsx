import { tr, trTemplate } from "../i18n/translations";
import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/useApp';
import { useCustomer } from '../context/useCustomer';
import { issuesFor } from '../data/requestIssues';
import { validateSchedule } from '../utils/vehicleValidation';
import { RequestFrame } from '../components/app/RequestFrame';
import { RequestVehicle } from '../components/app/RequestVehicle';
export function RequestAssistance() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const {
    request,
    updateRequest
  } = useApp();
  const {
    selectedVehicle,
    vehicleStatus,
    vehicleError
  } = useCustomer();
  const [error, setError] = useState('');
  const service = ['mechanic', 'towing'].includes(params.get('service')) ? params.get('service') : request.serviceType;
  const options = issuesFor(service);
  const selected = options.some(item => item.title === request.issueType) ? request.issueType : '';
  useEffect(() => {
    if (service !== request.serviceType) updateRequest({
      serviceType: service,
      issueType: ''
    });
  }, [service, request.serviceType, updateRequest]);
  if (service === 'towing') return <Navigate to="/request/towing" replace />;
  if (vehicleStatus === 'loading') return <RequestFrame title={tr("Your vehicle")} subtitle={tr("Loading your vehicles...")} />;
  if (vehicleStatus === 'error') return <RequestFrame title={tr("Could not load vehicles")} subtitle={vehicleError || tr("Please return home and try again.")} />;
  if (!selectedVehicle) return <Navigate to={`/vehicles?continue=${service}`} replace />;
  function submit(event) {
    event.preventDefault();
    if (!selected) {
      setError('Choose the closest match to continue.');
      return;
    }
    if (request.scheduledAt && validateSchedule(request.scheduledAt)) {
      setError('Your scheduled time has passed. Return home to choose a new time.');
      return;
    }
    updateRequest({
      vehicleId: selectedVehicle.id
    });
    navigate('/request/details');
  }
  return <RequestFrame title={tr("What's the trouble?")} subtitle={tr("Choose the closest match. You can change it later.")}>
    <form onSubmit={submit} className="request-form">
      <RequestVehicle vehicle={selectedVehicle} service={service} />
      <fieldset className="request-issues"><legend className="sr-only">{tr("Choose your issue")}</legend>
        {options.map(({
          title,
          description,
          icon: Icon
        }) => <label key={title} className={`request-issue ${selected === title ? 'is-selected' : ''}`}>
          <input type="radio" name="issue" value={title} checked={selected === title} onChange={() => {
            updateRequest({
              issueType: title
            });
            setError('');
          }} />
          <Icon size={24} /><span><strong>{tr(title)}</strong><small>{tr(description)}</small></span>{selected === title ? <CheckCircle2 size={20} /> : <ChevronRight size={20} />}
        </label>)}
      </fieldset>
      {error && <p className="auth-error" role="alert">{tr(error)}</p>}
      <button className="auth-primary request-continue" type="submit"><ArrowRight size={20} />{selected ? trTemplate(["Continue with ", ""], [selected.toLowerCase()]) : tr("Continue")}</button>
    </form>
  </RequestFrame>;
}
