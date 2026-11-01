import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, MapPin, Search } from 'lucide-react';
import { useLocale } from '../../context/useLocale';
import { tr } from '../../i18n/translations';
import { validPosition } from '../../utils/towingValidation';
import { isRepairShopApiConfigured, searchRepairShops } from '../../services/repairShopService';
import { LoadingState } from '../ui/LoadingState';

export function RepairShopPicker({ location, vehicleType, selected, onSelect }) {
  const { t } = useLocale();
  const [shops, setShops] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const active = useRef(null);
  useEffect(() => {
    active.current?.abort(); setShops([]); setStatus('idle'); setError('');
    return () => active.current?.abort();
  }, [location.latitude, location.longitude, location.address, vehicleType]);
  const ready = validPosition(location) || Boolean(location.address && location.address !== 'Use current location' && location.address.trim().length >= 5);
  async function search() {
    active.current?.abort();
    const controller = new AbortController(); active.current = controller;
    setStatus('loading'); setError(''); setShops([]);
    try {
      const found = await searchRepairShops({ location, vehicleType, radiusKm: 5 }, controller.signal);
      if (!controller.signal.aborted) { setShops(found); setStatus('ready'); }
    } catch (problem) { if (!controller.signal.aborted) { setError(problem.message); setStatus('error'); } }
  }
  return <section className="towing-shops" aria-label={t('Nearby repair shops','Mga malapit na talyer')}>
    <p className="auth-hint">{t('Find repair shops around your pickup. Opening hours and repair availability must be confirmed with the shop.','Maghanap ng talyer malapit sa pickup. Kumpirmahin sa talyer ang oras at availability ng pagkukumpuni.')}</p>
    {!ready && <p className="auth-hint">{t('Set your pickup location first.','Ilagay muna ang pickup location.')}</p>}
    <button type="button" className="auth-secondary" onClick={search} disabled={!ready || status === 'loading'}><Search size={20} />{t('Search nearby repair shops','Maghanap ng malapit na talyer')}</button>
    {!isRepairShopApiConfigured && status === 'idle' && <p className="auth-hint">{t('Repair shop search is not connected yet. You can enter a destination instead.','Hindi pa nakakonekta ang paghahanap ng talyer. Maaari mong ilagay ang destinasyon.')}</p>}
    {status === 'loading' && <LoadingState label={t('Finding repair shops...','Naghahanap ng mga talyer...')} />}
    {status === 'error' && <p className="auth-error" role="alert">{tr(error)}</p>}
    {status === 'ready' && !shops.length && <p className="auth-hint" role="status">{t('No repair shops were returned. Try again or enter your own destination.','Walang nahanap na talyer. Subukan muli o ilagay ang sariling destinasyon.')}</p>}
    {shops.length > 0 && <fieldset className="request-issues"><legend>{t('Choose a destination shop','Piliin ang destinasyong talyer')}</legend>{shops.map(shop => <label className={`request-issue ${selected?.id === shop.id ? 'is-selected' : ''}`} key={shop.id}><input type="radio" name="destination-shop" checked={selected?.id === shop.id} onChange={() => onSelect(shop)} /><MapPin size={22} /><span><strong>{shop.name}</strong><small>{shop.address}</small>{Number.isFinite(shop.distanceKm) && <small>{shop.distanceKm} km</small>}</span>{selected?.id === shop.id && <CheckCircle2 size={22} />}</label>)}</fieldset>}
    {selected && <p className="request-summary" role="status"><strong>{t('Selected destination','Napiling destinasyon')}: {selected.name}</strong><br />{selected.address}</p>}
  </section>;
}
