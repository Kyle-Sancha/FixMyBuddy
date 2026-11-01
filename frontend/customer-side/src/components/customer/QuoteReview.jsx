import { useState } from 'react';
import { Check, X, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../context/useLocale';
import { VisitEstimate } from '../app/VisitEstimate';
import { customerService } from '../../services/customerService';
import { validEstimate } from '../../utils/bookingValidation';
import { canDecideQuote, pendingRepairQuote, validStoredQuote } from '../../utils/quoteValidation';
import { formatCurrency } from '../../utils/formatters';

export function QuoteReview({ booking, onRefresh }) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false), [consent, setConsent] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const quote = pendingRepairQuote(booking);
  const revision = booking.revisionStatus === 'awaiting_customer';
  const allowed = canDecideQuote(booking, quote);
  const approved = validStoredQuote(booking.approvedQuote);
  async function decide(decision) {
    if (!allowed || busy || notice || !consent) return;
    setBusy(true); setError('');
    try {
      await customerService.decideQuote(booking, quote, decision);
      setNotice(decision === 'approve' ? t('Approval confirmed.','Nakumpirma ang pag-apruba.') : t('Rejection confirmed. No additional work authorized.','Nakumpirma ang pagtanggi. Walang dagdag na trabahong pinayagan.'));
      setConsent(false); onRefresh();
    } catch (problem) { setError(problem.message); } finally { setBusy(false); }
  }
  async function inspect() {
    if (busy || notice) return;
    setBusy(true); setError('');
    try { await customerService.requestInspection(booking.id, booking.version); setNotice(t('Inspection request confirmed.','Nakumpirma ang kahilingan sa inspeksyon.')); onRefresh(); }
    catch (problem) { setError(problem.message); } finally { setBusy(false); }
  }
  const display = value => ({ ...value, expiresAt: null });
  return <section className="quote-review">
    <h2>{t('Your estimated price','Tinatayang presyo mo')}</h2>
    {validStoredQuote(booking.initialEstimate) && <><p className="quote-stage">{t('Before inspection · Not a final quote','Bago ang inspeksyon · Hindi pa pinal na quote')}</p><VisitEstimate estimate={display(booking.initialEstimate)} service="repair" /></>}
    {!booking.initialEstimate && !approved && !quote && <p className="auth-hint">{t('Your provider has not supplied an itemized repair estimate yet.','Wala pang ibinigay na detalyadong tantiya ang provider.')}</p>}
    {booking.initialEstimate && !validStoredQuote(booking.initialEstimate) && <p className="auth-error">{t('Invalid estimate. Ask your provider for an updated breakdown.','Hindi wastong tantiya. Humingi ng bagong breakdown sa provider.')}</p>}
    {booking.canRequestInspection === true && !['cancelled','rejected','completed'].includes(booking.status) && <button className="auth-secondary" type="button" disabled={busy || Boolean(notice)} onClick={inspect}><ClipboardCheck size={18} />{t('Continue to inspection','Magpatuloy sa inspeksyon')}</button>}
    {approved && <><h3>{t('Approved scope','Naaprubahang saklaw')}</h3><VisitEstimate estimate={display(booking.approvedQuote)} service="repair" /></>}
    {quote && <div className="quote-decision">
      <h3>{revision ? t('Extra work? You decide.','Dagdag na trabaho? Ikaw ang magpapasya.') : t('Review the final repair quote','Suriin ang pinal na quote')}</h3>
      <p className="quote-stage">{t('Awaiting approval · Version','Naghihintay ng pag-apruba · Bersyon')} {quote.version}</p>
      <VisitEstimate estimate={quote} service="repair" />
      {typeof quote.warrantySummary === 'string' && quote.warrantySummary.trim() && <div className="history-notice"><h3>{t('Provider warranty terms','Mga tuntunin ng warranty mula sa provider')}</h3><p>{quote.warrantySummary}</p></div>}
      {revision && approved && validEstimate(quote) && <dl className="quote-comparison"><div><dt>{t('Original approved total','Dating naaprubahang kabuuan')}</dt><dd>{formatCurrency(booking.approvedQuote.total)}</dd></div><div><dt>{t('Change in total','Pagbabago sa kabuuan')}</dt><dd>{formatCurrency((Math.round(quote.total * 100) - Math.round(booking.approvedQuote.total * 100)) / 100)}</dd></div><div><dt>{t('Revised total','Binagong kabuuan')}</dt><dd>{formatCurrency(quote.total)}</dd></div></dl>}
      <div className="request-safety"><p>{t('No extra work or charges without approval. Rejecting a revision keeps the previously approved scope unchanged.','Walang dagdag na trabaho o singil nang walang pag-apruba. Mananatili ang dating saklaw kung tatanggihan ang rebisyon.')}</p></div>
      {!allowed && <p role="status" className="auth-error">{t('Quote expired or changed. Refresh the booking before deciding.','Paso o nabago ang quote. I-refresh muna ang booking.')}</p>}
      <label className="provider-consent"><input type="checkbox" checked={consent} disabled={!allowed || busy || Boolean(notice)} onChange={event => setConsent(event.target.checked)} /><span>{t('I have reviewed this quote and am ready to record my decision.','Nasuri ko ang quote at handa akong itala ang pasya.')}</span></label>
      <button className="auth-primary" type="button" disabled={!allowed || !consent || busy || Boolean(notice)} onClick={() => decide('approve')}><Check size={18} />{busy ? t('Saving...','Sine-save...') : revision ? t('Approve revised quote','Aprubahan ang binagong quote') : t('Approve repair','Aprubahan ang pagkukumpuni')}{!busy && validEstimate(quote) && ` · ${formatCurrency(quote.total)}`}</button>
      <button className="auth-secondary" type="button" disabled={!allowed || !consent || busy || Boolean(notice)} onClick={() => decide('reject')}><X size={18} />{revision ? t('Reject revision · Keep approved scope','Tanggihan ang rebisyon · Panatilihin ang saklaw') : t('Decline repair quote','Tanggihan ang quote')}</button>
    </div>}
    {booking.revisionStatus === 'rejected' && <div className="history-notice"><h3>{t('Revision declined','Tinanggihan ang rebisyon')}</h3><p>{t('No additional work authorized. The previously approved scope remains unchanged.','Walang dagdag na trabahong pinayagan. Hindi nagbago ang dating saklaw.')}</p></div>}
    {validStoredQuote(booking.declinePayableEstimate) && <><h3>{t('Provider-stated amount if repairs are declined','Halaga mula sa provider kung tatanggihan ang pagkukumpuni')}</h3><VisitEstimate estimate={display(booking.declinePayableEstimate)} service="visit" /></>}
    {booking.status === 'completed' && approved && <><h3>{t('Back on the road','Tuloy na ang biyahe')}</h3><p className="quote-total">{t('Approved total','Naaprubahang kabuuan')}: {formatCurrency(booking.approvedQuote.total)}</p><p className="auth-hint">{t('Service completion does not confirm payment. Wait for provider verification.','Hindi kumpirmasyon ng bayad ang pagkumpleto ng serbisyo. Hintayin ang verification ng provider.')}</p></>}
    {notice && <p role="status" className="customer-save-status">{notice}</p>}{error && <p role="alert" className="auth-error">{error}</p>}
    <Link className="provider-text-link" to={`/help/disputes?booking=${encodeURIComponent(booking.id)}`}>{t('Need help with this estimate?','Kailangan ng tulong sa tantiya?')}</Link>
  </section>;
}

