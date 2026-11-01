import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Phone, MessageCircle, RefreshCw, Truck } from 'lucide-react';
import { useLocale } from '../../context/useLocale';
import { customerService } from '../../services/customerService';
import { handoverAvailable, validHandoverInput, validPosition } from '../../utils/towingValidation';
import { safeMediaUrl } from '../../utils/bookingValidation';
import { EvidencePicker } from './EvidencePicker';
export function TowingJourney({ booking, onRefresh }) {
  const { t, language } = useLocale();
  const [condition, setCondition] = useState(''), [vehicleReceived, setVehicleReceived] = useState(false), [keysReceived, setKeysReceived] = useState(false);
  const [damageNotes, setDamageNotes] = useState(''), [pin, setPin] = useState(''), [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const attempt = useRef(null);
  const pinVersion = useRef(0);
  if (booking.serviceType !== 'towing') return null;
  const trip = booking.towing;
  const provider = trip?.provider;
  const position = provider?.position;
  const available = handoverAvailable(booking);
  const requiresPin = trip?.handover?.requiresPin === true;
  const phone = typeof provider?.phone === 'string' && /^\+?[0-9 ()-]{5,25}$/.test(provider.phone) ? provider.phone.replace(/[ ()-]/g,'') : '';
  const pickupPhotos = Array.isArray(trip?.pickupPhotos) ? trip.pickupPhotos.filter(item => safeMediaUrl(item?.url)) : [];
  const arrivalPhotos = Array.isArray(trip?.arrivalPhotos) ? trip.arrivalPhotos.filter(item => safeMediaUrl(item?.url)) : [];
  async function confirm(event) {
    event.preventDefault();
    const details = { condition, vehicleReceived, keysReceived, damageNotes: damageNotes.trim(), pin: pin.trim() };
    if (!available || busy || notice) return;
    if (!validHandoverInput(details, requiresPin)) { setError(t('Confirm receipt, choose the vehicle condition, and describe any damage. Enter the issued PIN if required.','Kumpirmahin ang pagtanggap, piliin ang kondisyon at ilarawan ang pinsala. Ilagay ang ibinigay na PIN kung kailangan.')); return; }
    const signature = JSON.stringify([condition,vehicleReceived,keysReceived,damageNotes,pinVersion.current,files.map(file => [file.name,file.size,file.lastModified])]);
    if (attempt.current?.signature !== signature) attempt.current = { signature, id: crypto.randomUUID() };
    setBusy(true); setError('');
    try {
      await customerService.confirmHandover(booking, { ...details, clientId: attempt.current.id }, files);
      setNotice(t('Vehicle handover confirmed by the server.','Kinumpirma ng server ang handover ng sasakyan.')); setPin(''); setFiles([]); onRefresh();
    } catch (problem) { setError(problem.message); } finally { setBusy(false); }
  }
  return <section className="towing-journey"><h2><Truck size={21} />{t('Your tow, in view','Kalagayan ng iyong towing')}</h2>
    {!trip ? <p className="auth-hint">{t('Tracking and handover details have not been returned for this booking.','Wala pang tracking at handover na detalye para sa booking.')}</p> : <>
      <dl className="towing-facts"><div><dt>{t('Status reported by provider','Estadong iniulat ng provider')}</dt><dd>{typeof trip.status === 'string' ? trip.status.replaceAll('_',' ') : t('Not provided','Walang nakalagay')}</dd></div><div><dt>{t('Destination','Destinasyon')}</dt><dd>{trip.destinationAddress || booking.destination || t('Not provided','Walang nakalagay')}</dd></div>{Number.isFinite(trip.distanceKm) && <div><dt>{t('Route distance','Distansya ng ruta')}</dt><dd>{trip.distanceKm} km</dd></div>}{Number.isFinite(trip.etaMinutes) && <div><dt>{t('Reported ETA','Iniulat na ETA')}</dt><dd>{trip.etaMinutes} {t('minutes','minuto')}</dd></div>}</dl>
      {validPosition(position) && <><iframe className="provider-map" title={t('Last reported provider location','Huling iniulat na lokasyon ng provider')} referrerPolicy="no-referrer" loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${[position.longitude-.008,position.latitude-.008,position.longitude+.008,position.latitude+.008].join(',')}&layer=mapnik&marker=${position.latitude},${position.longitude}`} /><p className="auth-hint">{t('Last reported provider location. Not simulated movement.','Huling iniulat na lokasyon ng provider. Hindi simulated na paggalaw.')}{Number.isFinite(Date.parse(position.updatedAt)) ? ' · ' + new Date(position.updatedAt).toLocaleString(language === 'fil' ? 'fil-PH' : 'en-PH', {timeZone:'Asia/Manila'}) : ''}</p></>}
      {typeof provider?.name === 'string' && <p className="customer-muted">{provider.name}{typeof trip.equipment === 'string' ? ' · ' + trip.equipment : ''}</p>}
      <div className="history-action-row">{provider?.chatEnabled === true && <Link className="auth-secondary" to={`/bookings/${encodeURIComponent(booking.id)}/towing-chat`}><MessageCircle size={18} />{t('Chat with provider','Makipag-chat sa provider')}</Link>}{phone && <a className="auth-secondary" href={`tel:${phone}`}><Phone size={18} />{t('Call provider','Tawagan ang provider')}</a>}<button className="auth-secondary" type="button" disabled={busy} onClick={onRefresh}><RefreshCw size={18} />{t('Refresh trip status','I-refresh ang estado ng biyahe')}</button></div>
      <h3>{t('Pickup photo record','Mga larawan sa pickup')}</h3>
      {pickupPhotos.length ? <div className="request-media-grid">{pickupPhotos.map((photo,index) => <a href={safeMediaUrl(photo.url)} key={photo.id || index} target="_blank" rel="noreferrer"><img className="towing-photo" src={safeMediaUrl(photo.url)} alt={t('Provider pickup record','Larawan sa pickup mula sa provider')} loading="lazy" referrerPolicy="no-referrer" /></a>)}</div> : <p className="auth-hint">{t('No pickup photos have been returned.','Walang naibalik na larawan sa pickup.')}</p>}
      {arrivalPhotos.length > 0 && <><h3>{t('Arrival photo record','Mga larawan sa pagdating')}</h3><div className="request-media-grid">{arrivalPhotos.map((photo,index) => <a key={photo.id || index} href={safeMediaUrl(photo.url)} target="_blank" rel="noreferrer"><img className="towing-photo" src={safeMediaUrl(photo.url)} alt={t('Arrival condition record','Larawan ng kondisyon pagdating')} loading="lazy" referrerPolicy="no-referrer" /></a>)}</div></>}
      {trip.handover?.status === 'confirmed' && <p className="customer-save-status">{t('Handover confirmed. Payment verification is separate.','Nakumpirma ang handover. Hiwalay ang verification ng bayad.')}{trip.handover.condition === 'damage_reported' ? ' ' + t('Damage was reported.','May iniulat na pinsala.') : ''}</p>}
      {available && <form className="request-form" onSubmit={confirm}><h3>{t('Handover check','Pagsusuri sa handover')}</h3>
        <fieldset className="request-issues"><legend>{t('Vehicle condition on arrival','Kondisyon pagdating')}</legend>{[['no_new_damage','No new damage observed','Walang bagong pinsalang napansin'],['damage_reported','Report new damage','Mag-ulat ng bagong pinsala']].map(([value,en,fil]) => <label className="provider-consent" key={value}><input type="radio" name="handover-condition" required value={value} checked={condition === value} disabled={busy} onChange={() => setCondition(value)} /><span>{t(en,fil)}</span></label>)}</fieldset>
        {condition === 'damage_reported' && <label className="request-field">{t('Describe the damage','Ilarawan ang pinsala')}<textarea required minLength={10} maxLength={2000} value={damageNotes} disabled={busy} onChange={event => setDamageNotes(event.target.value)} /></label>}
        <label className="provider-consent"><input type="checkbox" required checked={vehicleReceived} disabled={busy} onChange={event => setVehicleReceived(event.target.checked)} /><span>{t('Vehicle received','Natanggap ang sasakyan')}</span></label>
        <label className="provider-consent"><input type="checkbox" required checked={keysReceived} disabled={busy} onChange={event => setKeysReceived(event.target.checked)} /><span>{t('Keys received','Natanggap ang mga susi')}</span></label>
        {requiresPin && <label className="request-field">{t('Issued handover PIN','Ibinigay na handover PIN')}<input type="password" required maxLength={32} autoComplete="off" value={pin} disabled={busy} onChange={event => { pinVersion.current += 1; setPin(event.target.value); }} /></label>}
        <EvidencePicker files={files} setFiles={setFiles} disabled={busy} />
        <button className="auth-primary" type="submit" disabled={busy || Boolean(notice)}><Check size={18} />{busy ? t('Confirming...','Kinukumpirma...') : t('Confirm vehicle handover','Kumpirmahin ang handover')}</button>
      </form>}
    </>}
    {error && <p className="auth-error" role="alert">{error}</p>}{notice && <p className="customer-save-status" role="status">{notice}</p>}
    <Link className="provider-text-link" to={`/help/disputes?booking=${encodeURIComponent(booking.id)}`}>{t('Report a problem with this tow','Mag-ulat ng problema sa towing')}</Link>
  </section>;
}

