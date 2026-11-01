import { useCallback, useState } from 'react';
import { lookupAddress } from '../services/locationService';

export function useGeolocation() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unsupported');
      setError('Geolocation is not supported by this browser.');
      return Promise.resolve(null);
    }

    setStatus('loading');

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const next = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            updatedAt: new Date(position.timestamp).toISOString(),
            address: 'Current GPS location',
            source: 'GPS active',
          };
          try { next.address = await lookupAddress(next); }
          catch { next.addressLookupFailed = true; }
          setStatus('ready');
          setError('');
          resolve(next);
        },
        () => {
          setStatus('error');
          setError('Location permission was denied or unavailable.');
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
      );
    });
  }, []);

  return { error, requestLocation, status };
}

