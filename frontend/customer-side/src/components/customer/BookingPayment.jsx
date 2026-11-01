import { tr, trTemplate } from "../../i18n/translations";
import { useState } from 'react';
import { QrCode, ShieldCheck } from 'lucide-react';
import { customerService } from '../../services/customerService';
import { safeMediaUrl } from '../../utils/bookingValidation';
import { QuoteReview } from './QuoteReview';
export function BookingPayment({
  booking,
  onRefresh
}) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reference, setReference] = useState('');
  const [qrFailed, setQrFailed] = useState(false);
  const [reported, setReported] = useState(false);
  const payment = booking.payment;
  const quotePending = booking.revisionStatus === 'awaiting_customer' || booking.repairApprovalStatus === 'awaiting_customer';
  const handoverPending = booking.serviceType === 'towing' && booking.towing?.handover?.status !== 'confirmed';
  const qrUrl = safeMediaUrl(payment?.qrUrl);
  async function report() {
    if (busy || quotePending || handoverPending || reported || payment?.reportable !== true || ['verified','pending_verification'].includes(payment?.status)) return;
    setBusy('payment');
    setError('');
    setNotice('');
    try {
      const result = await customerService.reportPayment(booking.id, {
        reference: reference.trim() || undefined
      });
      if (result?.payment?.status !== 'pending_verification') throw new Error('Could not confirm the payment report. Refresh your booking before retrying.');
      setReported(true);
      setNotice('Payment reported. Waiting for the provider to confirm receipt.');
      onRefresh();
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy('');
    }
  }
  return <div className="booking-followup">
    {(booking.serviceType !== 'towing' || booking.initialEstimate || booking.approvedQuote || booking.pendingRevision || booking.repairEstimate) && <QuoteReview key={`${booking.id}-${booking.pendingRevision?.id}-${booking.pendingRevision?.version}-${booking.repairEstimate?.id}-${booking.repairEstimate?.version}-${booking.revisionStatus}-${booking.repairApprovalStatus}`} booking={booking} onRefresh={onRefresh} />}
    <h2><QrCode size={21} />{tr("Provider QR payment")}</h2>
    {payment?.status === 'verified' ? <p className="customer-save-status"><ShieldCheck size={18} />{tr("Payment receipt confirmed by provider.")}</p> : payment?.status === 'pending_verification' || reported ? <p className="auth-hint">{tr("Payment reported. Waiting for provider confirmation.")}</p> : handoverPending ? <p className="auth-hint">{tr('Confirm vehicle handover before paying for this tow.')}</p> : quotePending ? <p className="auth-hint">{tr('Record your quote decision before proceeding to payment.')}</p> : qrUrl && !qrFailed ? <>
      <img className="provider-payment-qr" src={qrUrl} alt={trTemplate(["Payment QR supplied by ", ""], [booking.providerName || tr("your provider")])} referrerPolicy="no-referrer" onError={() => setQrFailed(true)} />
      {payment.payeeName && <p className="customer-muted">{tr("Payee:")} {payment.payeeName}</p>}
      <p className="auth-hint">{tr("Check the payee and amount in GCash before sending. Reporting payment does not verify it.")}</p>
      {payment.reportable === true && <><label className="request-field">{tr("Payment reference")}<span className="request-optional">{tr("Optional")}</span><input maxLength={100} value={reference} onChange={event => setReference(event.target.value)} /></label>
        <button type="button" className="auth-secondary" disabled={Boolean(busy) || reported} onClick={report}>{busy === 'payment' ? tr("Reporting...") : tr("I have sent payment")}</button></>}
    </> : <p className="auth-hint">{qrFailed ? tr("The provider QR could not be loaded. Refresh the booking before paying.") : tr("No payment QR has been supplied for this booking yet.")}</p>}
    {notice && <p role="status" className="customer-save-status">{tr(notice)}</p>}{error && <p className="auth-error" role="alert">{tr(error)}</p>}
  </div>;
}
