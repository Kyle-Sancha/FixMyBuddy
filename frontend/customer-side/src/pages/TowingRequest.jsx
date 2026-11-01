import { useEffect, useRef, useState } from 'react';
import { ArrowRight, LocateFixed, MapPin, Flag, Paperclip } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { RequestFrame } from '../components/app/RequestFrame';
import { RequestVehicle } from '../components/app/RequestVehicle';
import { TowingCondition } from '../components/customer/TowingCondition';
import { RepairShopPicker } from '../components/customer/RepairShopPicker';
import { useApp } from '../context/useApp';
import { useCustomer } from '../context/useCustomer';
import { useLocale } from '../context/useLocale';
import { useGeolocation } from '../hooks/useGeolocation';
import { PickupPreview } from './auth/Welcome';
import { validPosition } from '../utils/towingValidation';
import { validateTowingDestination } from '../utils/towingDestination';
import { validateSchedule } from '../utils/vehicleValidation';
import { tr } from '../i18n/translations';

export function TowingRequest() {
  const { request, updateRequest, location, setLocation, attachments } = useApp();
  const { selectedVehicle, vehicleStatus, vehicleError, refreshData } = useCustomer();
  const { t } = useLocale();
  const { requestLocation, status: gpsStatus, error: gpsError } = useGeolocation();
  const [error, setError] = useState('');
  const errorNotice = useRef(null), gpsAttempt = useRef(0);
  const navigate = useNavigate();
  useEffect(() => {
    if (request.serviceType !== 'towing' || !request.issueType) updateRequest({ serviceType: 'towing', issueType: 'Towing assistance' });
  }, [request.serviceType, request.issueType, updateRequest]);
  useEffect(() => () => { gpsAttempt.current += 1; }, []);
  useEffect(() => { if (error) errorNotice.current?.focus(); }, [error]);
  const mode = request.destinationMode === 'nearby' ? 'nearby' : 'manual';
  const hasPosition = validPosition(location);
  async function locate() {
    const attempt = ++gpsAttempt.current;
    const next = await requestLocation();
    if (next && attempt === gpsAttempt.current) { setLocation(next); setError(''); }
  }
  function submit(event) {
    event.preventDefault();
    const problem = validateTowingDestination(request, location) || (request.scheduledAt && validateSchedule(request.scheduledAt));
    if (problem) { setError(problem); return; }
    updateRequest({ serviceType: 'towing', issueType: request.issueType || 'Towing assistance', vehicleId: selectedVehicle.id, destination: request.destination.trim() });
    navigate('/request/matching');
  }
  if (vehicleStatus === 'loading') return <RequestFrame title={t('Where are we towing?','Saan natin dadalhin ang sasakyan?')} subtitle={t('Loading your vehicles...','Kinukuha ang mga sasakyan mo...')} />;
  if (vehicleStatus === 'error') return <RequestFrame title={t('Could not load vehicles','Hindi makuha ang mga sasakyan')}><p className="auth-error" role="alert">{vehicleError}</p><button className="auth-secondary" type="button" onClick={refreshData}>{t('Try again','Subukan muli')}</button></RequestFrame>;
  if (!selectedVehicle) return <Navigate to="/vehicles?continue=towing" replace />;
  return <RequestFrame title={t('Where are we towing?','Saan natin dadalhin ang sasakyan?')} subtitle={t('Plan your pickup and destination. Review the price before booking.','Ilagay ang pickup at destinasyon. Suriin ang presyo bago mag-book.')}>
    <form className="request-form" onSubmit={submit}>
      <RequestVehicle vehicle={selectedVehicle} service="towing" />
      <label className="request-field"><span className="request-label-icon"><MapPin size={22} />{t('Pickup location','Pickup location')}</span><input maxLength={300} autoComplete="street-address" value={location.address === 'Use current location' ? '' : location.address || ''} placeholder={t('Street, barangay and city','Kalye, barangay at lungsod')} onChange={event => {
        gpsAttempt.current += 1;
        setLocation({ address: event.target.value, latitude: null, longitude: null, source: 'Manual address' }); setError('');
      }} /></label>
      <button className="auth-secondary" type="button" onClick={locate} disabled={gpsStatus === 'loading'}><LocateFixed size={22} />{gpsStatus === 'loading' ? t('Locating...','Kinukuha ang lokasyon...') : t('Use my current location','Gamitin ang kasalukuyang lokasyon')}</button>
      {gpsError && <p className="auth-error" role="alert">{tr(gpsError)}</p>}
      {hasPosition && <p className="auth-hint">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}{Number.isFinite(location.accuracy) && <> · {t('GPS accuracy','Katumpakan ng GPS')}: ±{Math.round(location.accuracy)} m</>}</p>}
      {hasPosition ? <PickupPreview compact onLocate={locate} locating={gpsStatus === 'loading'} /> : <div className="towing-map-empty"><MapPin size={26} /><p>{t('Use GPS to show a pickup map, or continue with your full pickup address.','Gamitin ang GPS para makita ang mapa, o magpatuloy gamit ang buong pickup address.')}</p></div>}
      <fieldset className="settings-languages towing-destination-mode"><legend>{t('Choose your destination','Piliin ang iyong destinasyon')}</legend>{[
        ['manual', t('Enter an address or repair shop','Maglagay ng address o talyer')],
        ['nearby', t('Find a nearby repair shop','Maghanap ng malapit na talyer')]
      ].map(([value,label]) => <label key={value}><input type="radio" name="destination-mode" checked={mode === value} onChange={() => {
        updateRequest({ destinationMode: value, destinationShop: null }); setError('');
      }} />{label}</label>)}</fieldset>
      {mode === 'manual' ? <label className="request-field"><span className="request-label-icon"><Flag size={22} />{t('Destination','Destinasyon')}</span><input maxLength={300} value={request.destination} placeholder={t('Full address of your destination','Buong address ng iyong destinasyon')} onChange={event => { updateRequest({ destination: event.target.value, destinationShop: null }); setError(''); }} /></label>
        : <RepairShopPicker location={location} vehicleType={selectedVehicle.type} selected={request.destinationShop} onSelect={shop => { updateRequest({ destinationShop: shop, destination: shop.address }); setError(''); }} />}
      <TowingCondition value={request.towingCondition} onChange={value => { updateRequest({ towingCondition: value }); setError(''); }} />
      <details className="towing-more"><summary>{t('Landmark or instructions (optional)','Palatandaan o tagubilin (opsyonal)')}</summary><label className="request-field">{t('Help your driver find you','Tulungan ang driver na mahanap ka')}<textarea rows={3} maxLength={500} value={request.landmark} onChange={event => updateRequest({ landmark: event.target.value })} /></label></details>
      <Link className="auth-secondary" to="/request/details"><Paperclip size={22} />{t('Add details, photos or videos (optional)','Magdagdag ng detalye, larawan o video (opsyonal)')}{attachments.length > 0 && ` (${attachments.length})`}</Link>
      <p className="auth-hint">{t('Distance, arrival time and towing price come from the provider. No booking or payment is made on this page.','Mula sa provider ang distansya, oras ng pagdating at presyo ng towing. Wala pang booking o bayad sa pahinang ito.')}</p>
      {error && <p className="auth-error" role="alert" tabIndex={-1} ref={errorNotice}>{tr(error)}</p>}
      <button type="submit" className="auth-primary request-continue" disabled={gpsStatus === 'loading'}><ArrowRight size={22} />{t('Find towing providers','Maghanap ng towing provider')}</button>
    </form>
  </RequestFrame>;
}
