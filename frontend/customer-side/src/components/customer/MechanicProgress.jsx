import { useEffect, useRef, useState } from 'react';
import { Check, Circle, Clock3, KeyRound, MessageCircle, Phone, RefreshCw, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../context/useLocale';
import { validPosition } from '../../utils/towingValidation';
import { safeMediaUrl } from '../../utils/bookingValidation';
import { safeSupportContact } from '../../utils/accountValidation';
import { validServiceStep, validServiceUpdate } from '../../utils/activeServiceValidation';
import { getArrivalPin } from '../../services/mechanicService';
import { tr } from '../../i18n/translations';

export function MechanicProgress({ booking, onRefresh }) {
  const { t, language } = useLocale();
  const service = booking.mechanic || {};
  const provider = service.provider || {};
  const name = provider.name || booking.providerName;
  const phone = safeSupportContact(provider).phone;
  const terminal = ['completed', 'cancelled', 'rejected'].includes(booking.status);
  const [pin, setPin] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    const hide = () => { if (document.hidden) { setPin(null); controller.current?.abort(); setBusy(false); } };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, []);
  useEffect(() => {
    if (!pin) return;
    const remaining = Date.parse(pin.expiresAt) - Date.now();
    if (remaining <= 0) { setPin(null); return; }
    const timer = setTimeout(() => setPin(null), Math.min(remaining, 2147483647));
    return () => clearTimeout(timer);
  }, [pin]);
  const date = value => Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString(language === 'fil' ? 'fil-PH' : 'en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '';
  const position = validPosition(service.position) ? service.position : null;
  const steps = Array.isArray(service.timeline) ? service.timeline.filter(validServiceStep) : [];
  const updates = Array.isArray(service.updates) ? service.updates.filter(validServiceUpdate) : [];
  const statusLabels = {
    requested: t('Request sent','Naipadala ang kahilingan'), en_route: t('On the way','Papunta na'), arrived: t('Mechanic has arrived','Dumating na ang mekaniko'),
    diagnosing: t('Checking your vehicle','Sinusuri ang sasakyan'), awaiting_approval: t('Waiting for your decision','Naghihintay ng iyong pasya'),
    repairing: t('Repair in progress','Isinasagawa ang pagkukumpuni'), completed: t('Service completed','Tapos na ang serbisyo'), cancelled: t('Service cancelled','Kinansela ang serbisyo')
  };
  statusLabels.awaiting_provider = t('Waiting for provider update','Naghihintay ng update mula sa provider');
  async function revealPin() {
    if (busy || terminal || service.arrivalPinAvailable !== true) return;
    controller.current?.abort(); const active = new AbortController(); controller.current = active;
    setBusy(true); setError('');
    try { const data = await getArrivalPin(booking.id, active.signal); if (!active.signal.aborted && !document.hidden) setPin(data); }
    catch (problem) { if (!active.signal.aborted) setError(problem.message); }
    finally { if (!active.signal.aborted) setBusy(false); }
  }
  return <section className="active-service" aria-label={t('Active service','Kasalukuyang serbisyo')}>
    {statusLabels[service.status || booking.status] && <h2>{statusLabels[service.status || booking.status]}</h2>}
    <div className="service-provider"><Wrench size={26} /><div><h2>{name || t('Waiting for an assigned mechanic','Naghihintay ng nakatalagang mekaniko')}</h2>{provider.verified === true && <p>{t('Verified mechanic','Beripikadong mekaniko')}</p>}{Number.isFinite(provider.rating) && provider.rating >= 0 && provider.rating <= 5 && <p>{provider.rating.toFixed(1)} / 5{Number.isInteger(provider.reviewsCount) && provider.reviewsCount >= 0 && ` (${provider.reviewsCount})`}</p>}</div></div>
    {Number.isFinite(service.etaMinutes) && service.etaMinutes >= 0 && <p className="service-arrival"><Clock3 size={22} />{t('Provider-estimated arrival','Tinatayang pagdating mula sa provider')}: {service.etaMinutes} {t('minutes','minuto')}</p>}
    {date(service.updatedAt) && <p className="auth-hint">{t('Last service update','Huling update sa serbisyo')}: {date(service.updatedAt)}</p>}
    {position ? <figure className="service-location"><iframe title={t('Last reported mechanic location','Huling naiulat na lokasyon ng mekaniko')} loading="lazy" referrerPolicy="no-referrer" src={`https://www.openstreetmap.org/export/embed.html?bbox=${[position.longitude - .008, position.latitude - .008, position.longitude + .008, position.latitude + .008].join(',')}&layer=mapnik&marker=${position.latitude},${position.longitude}`} /><figcaption>{t('Last reported location','Huling naiulat na lokasyon')}{date(position.updatedAt) ? ` · ${date(position.updatedAt)}` : ` · ${t('Update time unavailable','Walang oras ng update')}`}</figcaption></figure> : <p className="history-notice">{t('Your mechanic has not shared a map location yet. Refresh to check for updates.','Wala pang ibinabahaging lokasyon ang mekaniko. I-refresh para makita ang update.')}</p>}
    <div className="history-action-row">{provider.chatEnabled === true && <Link className="auth-secondary" to={`/bookings/${encodeURIComponent(booking.id)}/provider-chat`}><MessageCircle size={22} />{t('Chat with mechanic','Makipag-chat sa mekaniko')}</Link>}{phone && <a className="auth-secondary" href={`tel:${phone}`}><Phone size={22} />{t('Call mechanic','Tawagan ang mekaniko')}</a>}</div>
    <button type="button" className="auth-secondary" onClick={onRefresh}><RefreshCw size={22} />{t('Refresh service updates','I-refresh ang mga update sa serbisyo')}</button>
    <h2>{t('Service progress','Progreso ng serbisyo')}</h2>
    {steps.length ? <ol className="service-timeline">{steps.map(step => <li key={step.id} data-state={step.status} aria-current={step.status === 'current' ? 'step' : undefined}>{step.status === 'completed' ? <Check size={22} aria-hidden="true" /> : <Circle size={22} aria-hidden="true" />}<div><strong>{step.label}</strong><small>{step.status === 'completed' ? t('Completed','Tapos na') : step.status === 'current' ? t('Current step','Kasalukuyang hakbang') : t('Upcoming','Susunod')}{date(step.at) && ` · ${date(step.at)}`}</small></div></li>)}</ol> : <p className="auth-hint">{t('No progress updates have been supplied yet.','Wala pang ibinibigay na update sa progreso.')}</p>}
    {service.arrivalPinAvailable === true && !terminal && <section className="service-pin"><h2><KeyRound size={22} />{t('Arrival PIN','PIN sa pagdating')}</h2><p className="auth-hint">{t('Share only with your assigned mechanic after they arrive. This does not approve repairs or payment.','Ibahagi lamang sa nakatalagang mekaniko kapag dumating na siya. Hindi nito inaaprubahan ang pagkukumpuni o bayad.')}</p>{pin ? <><strong className="service-pin-value">{pin.pin}</strong><p className="auth-hint">{t('Expires','Mag-e-expire')}: {date(pin.expiresAt)}</p><button className="auth-secondary" type="button" onClick={() => setPin(null)}>{t('Hide PIN','Itago ang PIN')}</button></> : <button className="auth-secondary" type="button" disabled={busy} onClick={revealPin}>{busy ? t('Loading...','Kinukuha...') : t('Show arrival PIN','Ipakita ang arrival PIN')}</button>}</section>}
    {error && <p className="auth-error" role="alert">{tr(error)}</p>}
    {typeof service.diagnosis?.summary === 'string' && service.diagnosis.summary.trim() && <section className="service-update"><h2>{t('Mechanic findings','Natuklasan ng mekaniko')}</h2><p>{service.diagnosis.summary}</p>{date(service.diagnosis.createdAt) && <small>{date(service.diagnosis.createdAt)}</small>}</section>}
    {date(service.estimatedFinishAt) && <p className="auth-hint">{t('Provider-estimated finish','Tinatayang pagtatapos mula sa provider')}: {date(service.estimatedFinishAt)}</p>}
    {updates.length > 0 && <section className="service-updates"><h2>{t('From your mechanic','Mula sa iyong mekaniko')}</h2>{updates.map(update => <article className="service-update" key={update.id}><h3>{update.title}</h3>{safeMediaUrl(update.photoUrl) && <ServicePhoto url={safeMediaUrl(update.photoUrl)} alt={update.title} />}{update.body && <p>{update.body}</p>}{date(update.createdAt) && <small>{date(update.createdAt)}</small>}</article>)}</section>}
  </section>;
}
function ServicePhoto({ url, alt }) {
  const [failed, setFailed] = useState(false);
  const { t } = useLocale();
  return failed ? <p className="auth-hint">{t('Photo unavailable','Hindi makita ang larawan')}</p> : <img src={url} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}
