import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Phone, RefreshCw, Send } from 'lucide-react';
import { CustomerHeading } from '../components/customer/CustomerHeading';
import { BookingSharing } from '../components/customer/BookingSharing';
import { LoadingState } from '../components/ui/LoadingState';
import { useCustomer } from '../context/useCustomer';
import { useLocale } from '../context/useLocale';
import { mechanicMessages, sendMechanicMessage } from '../services/mechanicService';
import { safeSupportContact } from '../utils/accountValidation';
import { tr } from '../i18n/translations';

export function ProviderChat() {
  const { bookingId } = useParams();
  return <Conversation key={bookingId} bookingId={bookingId} />;
}
function Conversation({ bookingId }) {
  const { bookings, bookingStatus, refreshData } = useCustomer();
  const { t, language } = useLocale();
  const booking = bookings.find(item => String(item.id) === bookingId && item.serviceType === 'mechanic');
  const provider = booking?.mechanic?.provider;
  const available = provider?.chatEnabled === true && bookingStatus === 'ready';
  const phone = safeSupportContact(provider).phone;
  const [messages, setMessages] = useState([]), [draft, setDraft] = useState('');
  const [status, setStatus] = useState('idle'), [busy, setBusy] = useState(false), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  const attempt = useRef(null), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!available) return;
    const controller = new AbortController(); setStatus('loading'); setError('');
    mechanicMessages(bookingId, controller.signal).then(items => { if (!controller.signal.aborted) { setMessages(items); setStatus('ready'); } }).catch(problem => { if (!controller.signal.aborted) { setError(problem.message); setStatus('error'); } });
    return () => controller.abort();
  }, [available, bookingId, retry]);
  async function send(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || busy || !available || status !== 'ready') return;
    if (attempt.current?.body !== body) attempt.current = { body, id: crypto.randomUUID() };
    setBusy(true); setError('');
    try {
      const message = await sendMechanicMessage(bookingId, body, attempt.current.id);
      if (!mounted.current) return;
      setMessages(current => current.some(item => item.id === message.id) ? current : [...current, message]); setDraft(''); attempt.current = null;
    } catch (problem) { if (mounted.current) setError(problem.message); }
    finally { if (mounted.current) setBusy(false); }
  }
  const date = value => Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString(language === 'fil' ? 'fil-PH' : 'en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '';
  return <>
    <CustomerHeading title={t('Chat with your mechanic','Makipag-chat sa iyong mekaniko')} backTo={`/bookings/${encodeURIComponent(bookingId)}/service`}>{provider?.name || booking?.providerName || t('Assigned provider conversation','Usapan sa nakatalagang provider')}</CustomerHeading>
    {bookingStatus === 'loading' ? <LoadingState /> : bookingStatus !== 'ready' ? <button type="button" className="auth-secondary" onClick={refreshData}>{t('Could not load booking. Try again.','Hindi makuha ang booking. Subukan muli.')}</button> : !available ? <p className="history-notice">{t('Assigned-provider messaging is unavailable for this booking.','Hindi available ang chat sa provider para sa booking na ito.')}</p> : <>
      {phone && <a className="auth-secondary" href={`tel:${phone}`}><Phone size={22} />{t('Call mechanic','Tawagan ang mekaniko')}</a>}
      <button type="button" className="customer-text-button account-inline-action" disabled={busy || status === 'loading'} onClick={() => setRetry(value => value + 1)}><RefreshCw size={20} />{t('Refresh messages','I-refresh ang mga mensahe')}</button>
      {status === 'loading' ? <LoadingState /> : <div className="support-messages" role="log" aria-live="polite" aria-label={t('Mechanic conversation','Usapan sa mekaniko')}>{!messages.length && status === 'ready' && <p className="auth-hint">{t('No messages yet.','Wala pang mensahe.')}</p>}{messages.map(message => <article key={message.id} className={message.sender === 'customer' ? 'from-customer' : 'from-support'}><strong>{message.sender === 'customer' ? t('You','Ikaw') : provider.name || t('Mechanic','Mekaniko')}</strong><p>{message.body}</p>{date(message.createdAt) && <time dateTime={message.createdAt}>{date(message.createdAt)}</time>}{message.sender === 'customer' && date(message.readAt) && <small>{t('Read','Nabasa')} · {date(message.readAt)}</small>}</article>)}</div>}
      <form className="request-form" onSubmit={send}><label className="request-field">{t('Message','Mensahe')}<textarea rows={3} maxLength={2000} required disabled={busy} value={draft} onChange={event => setDraft(event.target.value)} /></label><button className="auth-primary" type="submit" disabled={!draft.trim() || busy || status !== 'ready'}><Send size={22} />{busy ? t('Sending...','Ipinapadala...') : t('Send message','Ipadala ang mensahe')}</button></form>
      <BookingSharing key={`${booking.id}-${booking.sharing?.enabled}`} booking={booking} />
    </>}
    {error && <p role="alert" className="auth-error">{tr(error)}</p>}
    <Link to="/help" className="provider-text-link">{t('Need help? Contact support','Kailangan ng tulong? Makipag-ugnayan sa suporta')}</Link>
  </>;
}
