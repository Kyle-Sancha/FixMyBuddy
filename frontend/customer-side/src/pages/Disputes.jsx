import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileWarning, Send, RefreshCw } from 'lucide-react';
import { CustomerHeading } from '../components/customer/CustomerHeading';
import { EvidencePicker } from '../components/customer/EvidencePicker';
import { useAuth } from '../context/useAuth';
import { useCustomer } from '../context/useCustomer';
import { useLocale } from '../context/useLocale';
import { accountApiConfigured, accountService } from '../services/accountService';
import { validClaimAmount } from '../utils/afterServiceValidation';
import { formatCurrency } from '../utils/formatters';
export function Disputes() {
  const { t, language } = useLocale(), { user } = useAuth();
  const { bookings, bookingStatus } = useCustomer();
  const [params] = useSearchParams();
  const [cases, setCases] = useState([]), [status, setStatus] = useState('loading');
  const [bookingId, setBookingId] = useState(params.get('booking') || ''), [subject, setSubject] = useState(''), [description, setDescription] = useState('');
  const [files, setFiles] = useState([]), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);
  const [reason, setReason] = useState(['refund','warranty'].includes(params.get('reason')) ? params.get('reason') : 'service');
  const [amount, setAmount] = useState('');
  const attempt = useRef(null), mounted = useRef(true);
  const connected = Boolean(user && accountApiConfigured);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!connected) { setStatus('unavailable'); setCases([]); return; }
    const controller = new AbortController(); setStatus('loading');
    accountService.disputes(controller.signal).then(items => { if (!controller.signal.aborted) { setCases(items); setStatus('ready'); } }).catch(problem => { if (!controller.signal.aborted) { setError(problem.message); setStatus('error'); } });
    return () => controller.abort();
  }, [connected, user?.id, retry]);
  async function submit(event) {
    event.preventDefault(); if (!connected || busy) return;
    setError(''); setNotice('');
    if (!validClaimAmount(amount)) { setError(t('Enter a nonnegative PHP amount with up to two decimal places.','Maglagay ng halagang PHP na hindi negatibo at hanggang dalawang decimal.')); return; }
    if (!bookings.some(item => item.id === bookingId) || subject.trim().length < 3 || description.trim().length < 10) { setError(t('Choose your booking, add a subject and describe the concern in at least 10 characters.','Piliin ang booking, maglagay ng paksa at hindi bababa sa 10 karakter na paliwanag.')); return; }
    const signature = JSON.stringify([bookingId,subject.trim(),description.trim(),reason,amount,files.map(file => [file.name,file.size,file.lastModified])]);
    if (attempt.current?.signature !== signature) attempt.current = { signature, id: crypto.randomUUID() };
    setBusy(true);
    try {
      const dispute = await accountService.createDispute({ bookingId, subject: subject.trim(), description: description.trim(), reason, amountInQuestion: amount === '' ? null : Number(amount), currency: 'PHP' }, files, attempt.current.id);
      if (!mounted.current) return;
      setCases(current => [dispute, ...current.filter(item => item.id !== dispute.id)]);
      setNotice(`${t('Concern saved. Reference:','Na-save ang concern. Reference:')} ${dispute.reference || dispute.id}`);
      setSubject(''); setDescription(''); setAmount(''); setFiles([]); attempt.current = null; setStatus('ready');
    } catch (problem) { if (mounted.current) setError(problem.message); } finally { if (mounted.current) setBusy(false); }
  }
  const focused = cases.find(item => item.id === params.get('case'));
  const visible = focused ? [focused] : cases;
  return <>
    <CustomerHeading title={t('Concerns & disputes','Mga concern at dispute')} backTo="/help">{t('Link a concern to your booking and keep its evidence together.','Iugnay ang concern sa iyong booking at ilakip ang ebidensya.')}</CustomerHeading>
    {!connected && <div className="history-notice"><FileWarning size={25} /><p>{user ? t('Dispute submission is not connected yet. Nothing has been submitted.','Hindi pa nakakonekta ang pagsusumite. Wala pang naipapadala.') : t('Sign in to submit a booking concern.','Mag-sign in para magsumite ng concern sa booking.')}</p>{!user && <Link className="auth-primary" to="/login">{t('Sign in','Mag-sign in')}</Link>}</div>}
    <form className="request-form dispute-form" onSubmit={submit}>
      <label className="request-field">{t('Booking','Booking')}<select required value={bookingId} disabled={busy || bookingStatus !== 'ready'} onChange={event => setBookingId(event.target.value)}><option value="">{t('Choose your booking','Piliin ang iyong booking')}</option>{bookings.map(item => <option key={item.id} value={item.id}>{item.reference || item.id} · {item.issueType || item.serviceType}</option>)}</select></label>
      <label className="request-field">{t('Subject','Paksa')}<input required minLength={3} maxLength={150} value={subject} disabled={busy} onChange={event => setSubject(event.target.value)} /></label>
      <label className="request-field">{t('Reason','Dahilan')}<select value={reason} disabled={busy} onChange={event => setReason(event.target.value)}>{[['service','Service concern','Concern sa serbisyo'],['refund','Refund request','Kahilingan sa refund'],['warranty','Warranty concern','Concern sa warranty'],['payment','Payment concern','Concern sa bayad'],['other','Other','Iba']].map(([value,en,fil]) => <option key={value} value={value}>{t(en,fil)}</option>)}</select></label>
      <label className="request-field">{t('Amount in question (PHP)','Halagang pinag-uusapan (PHP)')} <span className="request-optional">{t('Optional','Opsyonal')}</span><input type="number" min="0" step="0.01" value={amount} disabled={busy} onChange={event => setAmount(event.target.value)} /></label>
      <label className="request-field">{t('Describe your concern','Ilarawan ang concern')}<textarea required minLength={10} maxLength={5000} rows={4} value={description} disabled={busy} onChange={event => setDescription(event.target.value)} /></label>
      <EvidencePicker files={files} setFiles={setFiles} disabled={busy} />
      <p className="auth-hint">{t('Submitting a concern does not approve a refund. The outcome and timing depend on the actual review and applicable provider terms.','Hindi pag-apruba ng refund ang pagsusumite. Nakabatay sa aktuwal na pagsusuri at tuntunin ng provider ang resulta at oras.')}</p>
      <p className="auth-hint">{t('Include only evidence relevant to this booking. Do not include passwords, OTPs or unrelated personal information.','Ilakip lang ang ebidensyang may kaugnayan sa booking. Huwag isama ang password, OTP o personal na impormasyong walang kaugnayan.')}</p>
      <button className="auth-primary" type="submit" disabled={!connected || busy || bookingStatus !== 'ready'}><Send size={18} />{busy ? t('Submitting...','Isinusumite...') : t('Submit concern','Isumite ang concern')}</button>
    </form>
    {error && <p className="auth-error" role="alert">{error}</p>}{notice && <p className="customer-save-status" role="status">{notice}</p>}
    {connected && <section className="dispute-list"><div className="customer-section-heading"><h2>{t('Your concerns','Iyong mga concern')}</h2><button className="customer-text-button account-inline-action" type="button" disabled={busy} onClick={() => setRetry(value => value + 1)}><RefreshCw size={16} />{t('Refresh','I-refresh')}</button></div>
      {status === 'loading' && <p role="status">{t('Loading concerns...','Kinukuha ang mga concern...')}</p>}{status === 'error' && <p>{t('Could not load concerns. Refresh before submitting again.','Hindi makuha ang mga concern. I-refresh bago muling magsumite.')}</p>}
      {status === 'ready' && !visible.length && <p className="auth-hint">{t('No concerns have been returned for your account.','Walang concern na naibalik para sa iyong account.')}</p>}
      {visible.map(item => <article key={item.id}><h3>{item.subject}</h3><p>{item.reference || item.id} · {item.status.replaceAll('_',' ')}</p>{Number.isFinite(item.amountInQuestion) && item.amountInQuestion >= 0 && item.currency === 'PHP' && <p>{t('Amount in question','Halagang pinag-uusapan')}: {formatCurrency(item.amountInQuestion)}</p>}{typeof item.description === 'string' && <p>{item.description}</p>}{Number.isFinite(Date.parse(item.updatedAt)) && <time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleString(language === 'fil' ? 'fil-PH' : 'en-PH', { timeZone:'Asia/Manila' })}</time>}{item.bookingId && <Link className="provider-text-link" to={`/history?booking=${encodeURIComponent(item.bookingId)}`}>{t('View booking','Tingnan ang booking')}</Link>}</article>)}
    </section>}
  </>;
}

