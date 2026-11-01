import { useEffect, useRef, useState } from 'react';
import { LoadingState } from '../components/ui/LoadingState';
import { Link } from 'react-router-dom';
import { Send, RefreshCw, Headphones } from 'lucide-react';
import { CustomerHeading } from '../components/customer/CustomerHeading';
import { useLocale } from '../context/useLocale';
import { useAuth } from '../context/useAuth';
import { accountApiConfigured, accountService } from '../services/accountService';
export function SupportChat() {
  const { t, language } = useLocale(), { user } = useAuth();
  const [messages, setMessages] = useState([]), [draft, setDraft] = useState('');
  const [status, setStatus] = useState('loading'), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const attempt = useRef(null), mounted = useRef(true), end = useRef(null);
  const connected = Boolean(user && accountApiConfigured);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!connected) { setStatus('unavailable'); setMessages([]); return; }
    const controller = new AbortController(); setStatus('loading'); setError('');
    accountService.messages(controller.signal).then(data => { if (!controller.signal.aborted) { setMessages(data); setStatus('ready'); } }).catch(problem => { if (!controller.signal.aborted) { setError(problem.message); setStatus('error'); } });
    return () => controller.abort();
  }, [connected, user?.id, retry]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' }); }, [messages.length]);
  async function send(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || busy || !connected || status !== 'ready') return;
    if (attempt.current?.body !== body) attempt.current = { body, id: crypto.randomUUID() };
    setBusy(true); setError('');
    try {
      const message = await accountService.sendMessage(body, attempt.current.id);
      if (!mounted.current) return;
      setMessages(current => current.some(item => item.id === message.id) ? current : [...current, message]); setDraft(''); attempt.current = null;
    } catch (problem) { if (mounted.current) setError(problem.message); } finally { if (mounted.current) setBusy(false); }
  }
  return <>
    <CustomerHeading title={t('Chat with support','Makipag-chat sa suporta')} backTo="/help">{t('Only confirmed messages appear in this conversation.','Mga nakumpirmang mensahe lang ang nasa usapang ito.')}</CustomerHeading>
    {status === 'unavailable' ? <div className="history-notice"><Headphones size={25} /><p>{user ? t('Support messaging is not connected yet.','Hindi pa nakakonekta ang support messaging.') : t('Sign in to contact support. Messages cannot be sent without the backend.','Mag-sign in para sa suporta. Hindi makakapagpadala nang walang backend.')}</p>{!user && <Link className="auth-primary" to="/login">{t('Sign in','Mag-sign in')}</Link>}</div> : status === 'loading' ? <LoadingState label={t('Loading messages...','Kinukuha ang mga mensahe...')} /> : <>
      <button className="customer-text-button account-inline-action" type="button" disabled={busy} onClick={() => setRetry(value => value + 1)}><RefreshCw size={17} />{t('Refresh messages','I-refresh ang mga mensahe')}</button>
      <div className="support-messages" role="log" aria-live="polite" aria-label={t('Support conversation','Usapan sa suporta')}>
        {!messages.length && <p className="auth-hint">{t('No messages yet. Tell support what you need help with.','Wala pang mensahe. Sabihin sa suporta kung anong tulong ang kailangan.')}</p>}
        {messages.map(item => <article className={item.sender === 'customer' ? 'from-customer' : 'from-support'} key={item.id}><strong>{item.sender === 'customer' ? t('You','Ikaw') : t('Support','Suporta')}</strong><p>{item.body}</p>{Number.isFinite(Date.parse(item.createdAt)) && <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString(language === 'fil' ? 'fil-PH' : 'en-PH', { timeZone: 'Asia/Manila' })}</time>}</article>)}<div ref={end} />
      </div>
    </>}
    <form className="request-form support-composer" onSubmit={send}><label className="request-field">{t('Message','Mensahe')}<textarea rows={3} required maxLength={2000} value={draft} disabled={busy} onChange={event => setDraft(event.target.value)} /></label><button type="submit" className="auth-primary" disabled={!connected || status !== 'ready' || busy || !draft.trim()}><Send size={18} />{busy ? t('Sending...','Ipinapadala...') : t('Send message','Ipadala ang mensahe')}</button></form>
    {error && <p role="alert" className="auth-error">{error}</p>}
  </>;
}

