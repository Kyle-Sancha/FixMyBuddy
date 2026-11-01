import { tr } from "../i18n/translations";
import { useEffect, useState } from 'react';
import { Check, LocateFixed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthField, AuthNotice } from '../components/auth/AuthControls';
import { CustomerHeading } from '../components/customer/CustomerHeading';
import { useApp } from '../context/useApp';
import { useGeolocation } from '../hooks/useGeolocation';
import { PickupPreview } from './auth/Welcome';
export function PickupLocation() {
  const {
    location,
    setLocation
  } = useApp();
  const {
    requestLocation,
    status,
    error: gpsError
  } = useGeolocation();
  const [address, setAddress] = useState(location.address === 'Use current location' ? '' : location.address);
  const [error, setError] = useState('');
  useEffect(() => { setAddress(location.address === 'Use current location' ? '' : location.address); }, [location.address]);
  const navigate = useNavigate();
  async function locate() {
    const next = await requestLocation();
    if (next) {
      setLocation(current => ({
        ...current,
        ...next
      }));
      setAddress(next.address);
      setError('');
    }
  }
  function submit(event) {
    event.preventDefault();
    if (address.trim().length < 5) {
      setError('Enter an address or use your current location.');
      return;
    }
    const unchanged = address.trim() === location.address;
    setLocation(current => ({
      ...current,
      address: address.trim(),
      ...(unchanged ? {} : {
        latitude: null,
        longitude: null,
        source: 'Manual address'
      })
    }));
    navigate('/app');
  }
  return <>
      <CustomerHeading title={tr("Pickup location")} backTo="/app">{tr("Where should your roadside buddy meet you?")}</CustomerHeading>
      <div className="customer-map">
        <PickupPreview onLocate={locate} locating={status === 'loading'} />
      </div>
      <form className="auth-form" onSubmit={submit}>
        <AuthField id="pickup-address" label={tr("Address or nearest landmark")} value={address} onChange={event => setAddress(event.target.value)} error={error} maxLength={250} hint={tr("Include your street, barangay, and city when entering an address.")} />
        <button type="button" className="auth-secondary" onClick={locate} disabled={status === 'loading'}>
          <LocateFixed size={19} />
          {status === 'loading' ? tr("Getting location...") : tr("Use current location")}
        </button>
        {gpsError && <AuthNotice error>{gpsError}</AuthNotice>}
        <button className="auth-primary" type="submit">
          <Check size={19} />{tr("Save pickup location")}</button>
      </form>
    </>;
}
