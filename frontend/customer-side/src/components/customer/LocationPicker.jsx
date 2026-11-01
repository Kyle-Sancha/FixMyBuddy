import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Check, LocateFixed, MapPin } from 'lucide-react';
import { useApp } from '../../context/useApp';
import { useLocale } from '../../context/useLocale';
import { useGeolocation } from '../../hooks/useGeolocation';
import { lookupAddress } from '../../services/locationService';
import { hasStreetAddress, validCoordinates } from '../../utils/locationAddress';

export function LocationPicker({ onClose }) {
  const { location, setLocation, request, updateRequest } = useApp();
  const { t } = useLocale();
  const dialog = useRef(null), canvas = useRef(null), map = useRef(null), revision = useRef(0);
  const moveTimer = useRef(null), suppressMove = useRef(false), lastCenter = useRef(null);
  const initial = useRef(location);
  const [pin, setPin] = useState(validCoordinates(location) ? location : null);
  const [address, setAddress] = useState(hasStreetAddress(location.address) ? location.address : '');
  const [landmark, setLandmark] = useState(request.landmark || '');
  const [finding, setFinding] = useState(false), [message, setMessage] = useState('');
  const { requestLocation, status, error } = useGeolocation();
  const active = useRef(true), select = useRef(null);
  select.current = async position => {
    const attempt = ++revision.current;
    setPin(position); setAddress(''); setFinding(true); setMessage('');
    try {
      const result = await lookupAddress(position);
      if (active.current && attempt === revision.current) setAddress(result);
    } catch {
      if (active.current && attempt === revision.current) setMessage(t('Could not find an address. Enter it below; your pin is still selected.','Hindi mahanap ang address. Ilagay ito sa ibaba; napili pa rin ang pin.'));
    } finally { if (active.current && attempt === revision.current) setFinding(false); }
  };
  useEffect(() => {
    active.current = true;
    const modal = dialog.current, opener = document.activeElement;
    modal.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const instance = L.map(canvas.current, { zoomControl: true });
    map.current = instance;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(instance);
    if (validCoordinates(initial.current)) instance.setView([initial.current.latitude, initial.current.longitude], 17);
    else instance.fitBounds([[4.5, 116], [21.2, 127]], { padding: [16, 16] });
    lastCenter.current = instance.getCenter();
    const moved = () => {
      if (suppressMove.current) return;
      const center = instance.getCenter();
      if (lastCenter.current?.equals(center, 1e-8)) return;
      lastCenter.current = center;
      clearTimeout(moveTimer.current); revision.current += 1; setFinding(true); setAddress(''); setMessage('');
      const position = { latitude: center.lat, longitude: center.wrap().lng, source: 'Map pin', updatedAt: new Date().toISOString() };
      setPin(position);
      const attempt = revision.current;
      moveTimer.current = setTimeout(() => { if (active.current && attempt === revision.current) select.current(position); }, 900);
    };
    instance.on('moveend', moved);
    if (validCoordinates(initial.current) && !hasStreetAddress(initial.current.address)) select.current(initial.current);
    const observer = new ResizeObserver(() => {
      suppressMove.current = true;
      instance.invalidateSize({ pan: false });
      lastCenter.current = instance.getCenter();
      suppressMove.current = false;
    });
    observer.observe(canvas.current);
    return () => {
      active.current = false; revision.current += 1; clearTimeout(moveTimer.current); observer.disconnect(); instance.remove(); map.current = null;
      document.body.style.overflow = previousOverflow;
      if (modal.open) modal.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  async function locate() {
    clearTimeout(moveTimer.current);
    const attempt = ++revision.current;
    const next = await requestLocation();
    if (!active.current || attempt !== revision.current || !next) return;
    suppressMove.current = true;
    map.current.setView([next.latitude, next.longitude], 17, { animate: false });
    lastCenter.current = map.current.getCenter();
    suppressMove.current = false;
    if (hasStreetAddress(next.address)) { setPin(next); setAddress(next.address); setFinding(false); }
    else select.current(next);
  }
  function confirm(event) {
    event.preventDefault();
    if (!validCoordinates(pin) || finding || address.trim().length < 5) return;
    setLocation({ ...pin, address: address.trim(), landmark: landmark.trim(), updatedAt: new Date().toISOString() });
    updateRequest({ landmark: landmark.trim() });
    onClose();
  }
  return createPortal(<dialog ref={dialog} className="location-picker" aria-labelledby="location-picker-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><button type="button" onClick={onClose}><ArrowLeft size={22} />{t('Back','Bumalik')}</button><h2 id="location-picker-title">{t('Choose pickup location','Piliin ang pickup location')}</h2></header>
    <div className="location-picker-map-wrap"><div ref={canvas} className="location-picker-map" role="region" aria-label={t('Move the map to position your pickup pin. Arrow keys also move the map.','Igalaw ang mapa para ilagay ang pickup pin. Puwede ring gamitin ang arrow keys.')} />
      <MapPin className="location-picker-pin" size={44} aria-hidden="true" />
      <button type="button" className="location-picker-gps" disabled={status === 'loading'} onClick={locate}><LocateFixed size={22} />{status === 'loading' ? t('Locating...','Kinukuha ang lokasyon...') : t('Use my location','Gamitin ang lokasyon ko')}</button>
    </div>
    <form onSubmit={confirm} className="location-picker-panel">
      <p role="status">{finding ? t('Finding address...','Hinahanap ang address...') : t('Move the map beneath the pin. Check the address before confirming.','Igalaw ang mapa sa ilalim ng pin. Suriin ang address bago kumpirmahin.')}</p>
      <label>{t('Pickup address','Pickup address')}<input value={address} required minLength={5} maxLength={300} autoComplete="street-address" onChange={event => { clearTimeout(moveTimer.current); revision.current += 1; setAddress(event.target.value); setFinding(false); setMessage(''); }} /></label>
      {pin && <small>{pin.latitude.toFixed(6)}, {pin.longitude.toFixed(6)}{Number.isFinite(pin.accuracy) ? ` · ±${Math.round(pin.accuracy)} m` : ''}</small>}
      <label>{t('Landmark / instructions (optional)','Palatandaan / tagubilin (opsyonal)')}<input value={landmark} maxLength={300} onChange={event => setLandmark(event.target.value)} /></label>
      {(message || error) && <p role="alert">{message || error}</p>}
      {!pin && <p>{t('Use GPS or move the map to choose a pin.','Gamitin ang GPS o igalaw ang mapa para pumili ng pin.')}</p>}
      <button className="auth-primary" type="submit" disabled={finding || !validCoordinates(pin) || address.trim().length < 5}><Check size={21} />{t('Confirm this location','Kumpirmahin ang lokasyong ito')}</button>
      <small>{t('Address lookup: Photon / OpenStreetMap. Map addresses may be approximate.','Address lookup: Photon / OpenStreetMap. Maaaring tantiya lang ang address sa mapa.')}</small>
    </form>
  </dialog>, document.body);
}
