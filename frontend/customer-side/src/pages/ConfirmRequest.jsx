import { tr, trTemplate } from "../i18n/translations";
import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { Check, QrCode, Info, CalendarDays } from 'lucide-react';
import { RequestFrame } from '../components/app/RequestFrame';
import { RequestVehicle } from '../components/app/RequestVehicle';
import { ProviderIdentity } from '../components/app/ProviderIdentity';
import { VisitEstimate } from '../components/app/VisitEstimate';
import { useApp } from '../context/useApp';
import { useCustomer } from '../context/useCustomer';
import { validEstimate } from '../utils/bookingValidation';
import { validTowingCondition, validTowingQuote } from '../utils/towingValidation';
import { TowingRouteSummary } from '../components/customer/TowingRouteSummary';
import { useLocale } from '../context/useLocale';
export function ConfirmRequest() {
  const {
    request,
    selectedProvider
  } = useApp();
  const {
    selectedVehicle,
    vehicleStatus
  } = useCustomer();
  if (vehicleStatus === 'loading') return <RequestFrame title={tr("Review your booking")} subtitle={tr("Loading vehicle...")} />;
  if (!selectedProvider) return <Navigate to="/providers" replace />;
  if (!selectedVehicle || selectedVehicle.id !== request.vehicleId) return <Navigate to="/request" replace />;
  return <BookingReview key={`${selectedProvider.id}-${selectedProvider.estimate?.id}-${selectedProvider.estimate?.version}-${selectedProvider.cancellationPolicy?.id}`} />;
}
function BookingReview() {
  const { t } = useLocale();
  const {
    confirmRequest,
    request,
    location,
    selectedProvider,
    attachments
  } = useApp();
  const {
    selectedVehicle,
    refreshData
  } = useCustomer();
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const policy = selectedProvider.cancellationPolicy;
  const canBook = validEstimate(selectedProvider.estimate) && Boolean(policy?.id && policy.text) && attachments.length === 0 && (request.serviceType !== 'towing' || (validTowingCondition(request.towingCondition) && validTowingQuote(selectedProvider.towingQuote)));
  async function submit(event) {
    event.preventDefault();
    if (!confirmed || busy || !canBook) return;
    setBusy(true);
    setError('');
    try {
      const booking = await confirmRequest({
        estimateId: selectedProvider.estimate.id,
        cancellationPolicyId: policy.id
      });
      refreshData();
      navigate(`/history?booking=${encodeURIComponent(booking.id)}`);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return <RequestFrame title={tr("Review your booking")} subtitle={trTemplate(["", " \xB7 ", " assistance"], [request.issueType, request.serviceType === 'towing' ? tr("Towing") : tr("Mechanic")])} backTo={`/providers/${encodeURIComponent(selectedProvider.id)}`}>
    <form className="request-form" onSubmit={submit}>
      <ProviderIdentity provider={selectedProvider} />
      <div className="provider-tools"><span className="provider-chip" data-selected="true">{request.scheduledAt ? tr("Scheduled request") : Number.isFinite(selectedProvider.etaMinutes) ? trTemplate(["Now \xB7 ", " min ETA"], [selectedProvider.etaMinutes]) : tr("Now \xB7 ETA pending")}</span><Link className="provider-chip" to="/provider-filters?schedule=1"><CalendarDays size={15} />{request.scheduledAt ? tr("Change time") : tr("Schedule")}</Link></div>
      {request.scheduledAt && <p className="auth-hint">{tr("Requested time:")} {new Date(request.scheduledAt).toLocaleString()} {tr(". Provider availability must be confirmed.")}</p>}
      <RequestVehicle vehicle={selectedVehicle} service={request.serviceType} />
      {request.serviceType === 'towing' && <TowingRouteSummary quote={selectedProvider.towingQuote} />}
      <VisitEstimate estimate={selectedProvider.estimate} service={request.serviceType} />
      <div className="request-summary"><p>{tr("Pickup:")} {location.address}</p>{request.landmark && <p>{request.landmark}</p>}{request.notes && <p>{request.notes}</p>}{request.serviceType === 'towing' && <p>{tr("Destination:")} {request.destination}</p>}<Link className="provider-text-link" to="/request/details">{tr("Edit request details")}</Link></div>
      <div className="provider-payment-method"><QrCode size={22} /><span><strong>{tr("Provider GCash QR")}</strong><small>{tr("The provider supplies the QR. Payment stays unverified until receipt is confirmed.")}</small></span></div>
      <div className="request-safety"><Info size={20} /><p>{policy?.text || tr("Cancellation terms have not been provided. Booking is unavailable until the provider supplies them.")}</p></div>
      {attachments.length > 0 && <p className="auth-hint">{attachments.length} {tr("attachments selected. Upload is not connected yet, so requests with attachments cannot be submitted.")}</p>}
      <label className="provider-consent"><input type="checkbox" checked={confirmed} disabled={!canBook || busy} onChange={event => setConfirmed(event.target.checked)} /><span>{request.serviceType === 'towing' ? t('I agree to the route, towing estimate and provider terms. Additional work needs my approval.','Sumasang-ayon ako sa ruta, tantiya at tuntunin ng provider. Kailangan ang pag-apruba ko sa dagdag na trabaho.') : tr("I agree to this visit estimate and the cancellation terms. Parts and repairs require my separate approval.")}</span></label>
      {error && <p className="auth-error" role="alert">{tr(error)}</p>}
      <button className="auth-primary request-continue" type="submit" disabled={!confirmed || busy || !canBook}><Check size={20} />{busy ? tr("Confirming...") : tr("Confirm booking")}</button>
    </form>
  </RequestFrame>;
}
