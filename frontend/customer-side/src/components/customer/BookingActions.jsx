import { tr } from "../../i18n/translations";
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, X, RotateCcw, ReceiptText, Download, Check } from 'lucide-react';
import { useApp } from '../../context/useApp';
import { useCustomer } from '../../context/useCustomer';
import { customerService } from '../../services/customerService';
import { canManageBooking, hasReceipt } from '../../utils/historyValidation';
import { localDateTime, validateSchedule } from '../../utils/vehicleValidation';
export function BookingActions({
  booking
}) {
  const {
    vehicles,
    selectVehicle,
    refreshData
  } = useCustomer();
  const {
    resetRequest,
    updateRequest,
    setLocation
  } = useApp();
  const [mode, setMode] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const dialog = useRef(null);
  const mounted = useRef(true);
  const navigate = useNavigate();
  useEffect(() => () => {
    if (receiptUrl) URL.revokeObjectURL(receiptUrl);
  }, [receiptUrl]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  function open(value) {
    setMode(value);
    setError('');
    setConsent(false);
    dialog.current.showModal();
  }
  async function manage(event) {
    event.preventDefault();
    if (busy || !consent || !canManageBooking(booking, mode)) return;
    const time = event.currentTarget.elements.namedItem('scheduledAt')?.value || '';
    if (mode === 'reschedule' && validateSchedule(time)) {
      setError(validateSchedule(time));
      return;
    }
    setBusy(true);
    setError('');
    try {
      await customerService.manageBooking(booking.id, mode, {
        version: booking.version,
        cancellationPolicyId: booking.cancellationPolicy.id,
        ...(mode === 'reschedule' ? {
          scheduledAt: new Date(time).toISOString()
        } : {})
      });
      dialog.current.close();
      setNotice(mode === 'cancel' ? 'Booking cancellation confirmed.' : 'Schedule change saved. Check the booking status for confirmation.');
      refreshData();
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }
  function rebook() {
    setError('');
    const vehicle = vehicles.find(item => item.id === booking.vehicleId);
    try {
      if (vehicle) selectVehicle(vehicle.id);
      resetRequest(booking.serviceType === 'towing' ? 'towing' : 'mechanic');
      updateRequest({
        issueType: booking.issueType || '',
        vehicleId: vehicle?.id || ''
      });
      setLocation({
        latitude: null,
        longitude: null,
        address: 'Use current location',
        source: 'GPS pending'
      });
      navigate(vehicle ? `/request?service=${booking.serviceType === 'towing' ? 'towing' : 'mechanic'}` : `/vehicles?continue=${booking.serviceType === 'towing' ? 'towing' : 'mechanic'}`);
    } catch (problem) {
      setError(problem.message);
    }
  }
  async function receipt() {
    if (!hasReceipt(booking) || busy) return;
    setBusy(true);
    setError('');
    setMode('receipt');
    dialog.current.showModal();
    try {
      const blob = await customerService.receipt(booking.id);
      if (mounted.current) setReceiptUrl(URL.createObjectURL(blob));
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }
  return <div className="booking-actions">
    <div className="history-action-row">
      {canManageBooking(booking, 'reschedule') && <button type="button" className="auth-secondary" onClick={() => open('reschedule')} disabled={busy}><CalendarDays size={18} />{tr("Reschedule")}</button>}
      {canManageBooking(booking, 'cancel') && <button type="button" className="auth-secondary" onClick={() => open('cancel')} disabled={busy}><X size={18} />{tr("Cancel booking")}</button>}
      <button type="button" className="auth-secondary" onClick={rebook} disabled={busy}><RotateCcw size={18} />{tr("Rebook")}</button>
      {hasReceipt(booking) && <button type="button" className="auth-secondary" onClick={receipt} disabled={busy}><ReceiptText size={18} />{tr("View receipt")}</button>}
    </div>
    <Link className="provider-text-link" to={`/help/disputes?booking=${encodeURIComponent(booking.id)}`}>{tr("Get help with this booking")}</Link>
    <p className="auth-hint">{tr("Rebooking starts a fresh request. Confirm your location, provider availability and current pricing again.")}</p>
    {!hasReceipt(booking) && <p className="auth-hint">{tr("Receipts appear after the provider confirms payment and the receipt is issued.")}</p>}
    {notice && <p role="status" className="customer-save-status">{tr(notice)}</p>}
    {error && !dialog.current?.open && <p role="alert" className="auth-error">{tr(error)}</p>}
    <dialog ref={dialog} className="auth-policy history-dialog" aria-labelledby="booking-action-title" onCancel={event => {
      if (busy) event.preventDefault();
    }} onClose={() => {
      setReceiptUrl('');
    }}>
      <h2 id="booking-action-title">{mode === 'receipt' ? tr("Your receipt") : mode === 'cancel' ? tr("Cancel booking?") : tr("Reschedule booking")}</h2>
      {mode === 'receipt' ? <>{busy && <p role="status">{tr("Loading verified receipt...")}</p>}{receiptUrl && <><iframe className="receipt-preview" src={receiptUrl} title={tr("Verified booking receipt")} /><a className="auth-primary" href={receiptUrl} download={`FixMyBuddy-receipt-${String(booking.id).replace(/[^a-zA-Z0-9_-]/g, '')}.pdf`}><Download size={18} />{tr("Download PDF")}</a><a className="provider-text-link" href={receiptUrl} target="_blank" rel="noreferrer">{tr("Open PDF")}</a></>}</> : <form className="request-form" onSubmit={manage}>
        <p>{booking.cancellationPolicy?.text}</p>
        {mode === 'reschedule' && <label className="request-field">{tr("New date and time")}<input name="scheduledAt" type="datetime-local" required min={localDateTime()} defaultValue="" /><small>{tr("Uses your device time zone. Provider availability must be rechecked.")}</small></label>}
        <label className="provider-consent"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} /><span>{tr("I understand and accept these booking terms.")}</span></label>
        <button type="submit" className="auth-primary" disabled={!consent || busy}><Check size={18} />{busy ? tr("Saving...") : mode === 'cancel' ? tr("Confirm cancellation") : tr("Request new time")}</button>
      </form>}
      {error && <p role="alert" className="auth-error">{tr(error)}</p>}
      <button className="auth-secondary" type="button" disabled={busy} onClick={() => dialog.current.close()}>{tr("Close")}</button>
    </dialog>
  </div>;
}
