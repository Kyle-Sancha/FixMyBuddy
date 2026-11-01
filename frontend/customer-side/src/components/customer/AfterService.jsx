import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShieldCheck, Send, FileWarning } from 'lucide-react';
import { useLocale } from '../../context/useLocale';
import { customerService } from '../../services/customerService';
import { validReview, validWarranty } from '../../utils/afterServiceValidation';
export function AfterService({ booking, onRefresh }) {
  const { t, language } = useLocale();
  const initial = validReview(booking.review, booking.id) ? booking.review : null;
  const [saved, setSaved] = useState(initial);
  const [rating, setRating] = useState(initial?.rating || 0), [body, setBody] = useState(initial?.body || '');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const attempt = useRef(null);
  if (booking.status !== 'completed') return null;
  const canEdit = booking.canReview !== false && (!saved || booking.canEditReview !== false);
  const warranties = Array.isArray(booking.warranties) ? booking.warranties.filter(validWarranty) : [];
  function date(value) {
    return value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString(language === 'fil' ? 'fil-PH' : 'en-PH', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Manila' }) : t('Not provided','Walang nakalagay');
  }
  async function submit(event) {
    event.preventDefault(); setError(''); setNotice('');
    if (!canEdit || busy) return;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) { setError(t('Choose a rating from 1 to 5.','Pumili ng rating mula 1 hanggang 5.')); return; }
    const signature = JSON.stringify([rating, body.trim(), saved?.version]);
    if (attempt.current?.signature !== signature) attempt.current = { signature, id: crypto.randomUUID() };
    setBusy(true);
    try {
      const review = await customerService.saveReview(booking.id, { rating, body: body.trim(), version: saved?.version, clientId: attempt.current.id });
      setSaved(review); setRating(review.rating); setBody(review.body); attempt.current = null;
      setNotice(t('Your review was saved.','Na-save ang iyong review.'));
      onRefresh();
    } catch (problem) { setError(problem.message); } finally { setBusy(false); }
  }
  return <section className="after-service">
    <h2>{t('How was your service?','Kumusta ang serbisyo?')}</h2>
    {booking.providerName && <p className="customer-muted">{booking.providerName}</p>}
    <form className="request-form" onSubmit={submit}>
      <fieldset className="service-stars" disabled={!canEdit || busy}><legend>{t('Your rating','Iyong rating')}</legend><div>{[1,2,3,4,5].map(value => <label key={value} title={`${value} / 5`}><input type="radio" name="service-rating" value={value} checked={rating === value} onChange={() => { setRating(value); setNotice(''); }} aria-label={`${value} ${t('stars','bituin')}`} /><Star size={29} fill={rating >= value ? 'currentColor' : 'none'} aria-hidden="true" /></label>)}</div></fieldset>
      <label className="request-field">{t('Your review','Iyong review')} <span className="request-optional">{t('Optional','Opsyonal')}</span><textarea rows={4} maxLength={2000} value={body} disabled={!canEdit || busy} onChange={event => { setBody(event.target.value); setNotice(''); }} /></label>
      {canEdit ? <button className="auth-primary" type="submit" disabled={busy || rating === 0 || (saved?.rating === rating && saved?.body === body.trim())}><Send size={18} />{busy ? t('Saving...','Sine-save...') : saved ? t('Update review','Baguhin ang review') : t('Submit review','Isumite ang review')}</button> : <p className="auth-hint">{t('Review changes are not available for this booking.','Hindi available ang pagbabago ng review sa booking na ito.')}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}{notice && <p className="customer-save-status" role="status">{notice}</p>}
    </form>
    <section className="service-warranties"><h2><ShieldCheck size={21} />{t('Your warranty','Iyong warranty')}</h2>
      {!warranties.length && <p className="auth-hint">{t('No warranty details have been supplied for this booking. Ask your provider about coverage.','Wala pang ibinigay na detalye ng warranty. Tanungin ang provider tungkol sa coverage.')}</p>}
      {warranties.map(item => <article key={item.id}><header><h3>{item.title}</h3><span>{item.status.replaceAll('_',' ')}</span></header><dl><div><dt>{t('Starts','Simula')}</dt><dd>{date(item.startsAt)}</dd></div><div><dt>{t('Ends','Katapusan')}</dt><dd>{date(item.endsAt)}</dd></div></dl><details><summary>{t('Coverage & exclusions','Coverage at mga hindi saklaw')}</summary><p>{item.coverage || t('Coverage has not been provided.','Wala pang ibinigay na coverage.')}</p><p>{item.exclusions || t('Exclusions have not been provided.','Wala pang ibinigay na mga hindi saklaw.')}</p></details></article>)}
      <Link className="auth-secondary" to={`/help/disputes?booking=${encodeURIComponent(booking.id)}&reason=warranty`}><ShieldCheck size={18} />{t('Get warranty support','Humingi ng suporta sa warranty')}</Link>
    </section>
    <Link className="provider-text-link" to={`/help/disputes?booking=${encodeURIComponent(booking.id)}&reason=refund`}><FileWarning size={17} />{t('Refunds & disputes','Refund at mga dispute')}</Link>
  </section>;
}

