import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Send, RefreshCw } from 'lucide-react';
import { CustomerHeading } from '../components/customer/CustomerHeading';
import { useCustomer } from '../context/useCustomer';
import { useLocale } from '../context/useLocale';
import { customerService } from '../services/customerService';
export function TowingChat() {
  const { bookingId } = useParams(), { bookings, bookingStatus } = useCustomer(), { t } = useLocale();
  const booking = bookings.find(item => item.id === bookingId && item.serviceType === 'towing');
  const available = booking?.towing?.provider?.chatEnabled === true;
  const [messages, setMessages] = useState([]), [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false), [status, setStatus] = useState('loading'), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  const attempt = useRef(null), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!available) { setMessages([]); setStatus('unavailable'); return; }
    const controller = new AbortController(); setStatus('loading'); setError('');
    customerService.towingMessages(bookingId, controller.signal).then(items => { if (!controller.signal.aborted) { setMessages(items); setStatus('ready'); } }).catch(problem => { if (!controller.signal.aborted) { setError(problem.message); setStatus('error'); } });
    return () => controller.abort();
  }, [available, bookingId, retry]);
  async function send(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || busy || !available || status !== 'ready') return;
    if (attempt.current?.body !== body) attempt.current = { body, id: crypto.randomUUID() };
    setBusy(true); setError('');
    try {
      const message = await customerService.sendTowingMessage(bookingId, body, attempt.current.id);
      if (!mounted.current) return;
      setMessages(current => current.some(item => item.id === message.id) ? current : [...current,message]); setDraft(''); attempt.current = null;
    } catch (problem) { if (mounted.current) setError(problem.message); } finally { if (mounted.current) setBusy(false); }
  }
  return <>
    <CustomerHeading title={t('Chat with towing provider','Chat sa towing provider')} backTo={`/history?booking=${encodeURIComponent(bookingId)}`}>{booking?.towing?.provider?.name || t('Assigned provider conversation','Usapan sa nakatalagang provider')}</CustomerHeading>
    {bookingStatus === 'loading' || status === 'loading' ? <p role="status">{t('Loading...','Kinukuha...')}</p> : !available ? <p className="history-notice">{t('Assigned-provider messaging is unavailable for this booking.','Hindi available ang chat sa provider para sa booking na ito.')}</p> : <>
      <button className="customer-text-button account-inline-action" type="button" disabled={busy} onClick={() => setRetry(value => value + 1)}><RefreshCw size={17} />{t('Refresh messages','I-refresh ang mga mensahe')}</button>
      <div className="support-messages" role="log" aria-live="polite" aria-label={t('Provider conversation','Usapan sa provider')}>{!messages.length && status === 'ready' && <p className="auth-hint">{t('No messages yet.','Wala pang mensahe.')}</p>}{messages.map(item => <article key={item.id} className={item.sender === 'customer' ? 'from-customer' : 'from-support'}><strong>{item.sender === 'customer' ? t('You','Ikaw') : t('Provider','Provider')}</strong><p>{item.body}</p></article>)}</div>
      <form className="request-form" onSubmit={send}><label className="request-field">{t('Message','Mensahe')}<textarea rows={3} required maxLength={2000} value={draft} disabled={busy} onChange={event => setDraft(event.target.value)} /></label><button className="auth-primary" type="submit" disabled={busy || status !== 'ready' || !draft.trim()}><Send size={18} />{busy ? t('Sending...','Ipinapadala...') : t('Send message','Ipadala ang mensahe')}</button></form>
    </>}
    {error && <p className="auth-error" role="alert">{error}</p>}
  </>;
}

