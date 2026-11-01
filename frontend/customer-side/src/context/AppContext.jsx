import { useCallback, useEffect, useMemo, useState } from 'react';
import { customerService } from '../services/customerService';
import { AppContext } from './appContextValue';
import { validateSchedule } from '../utils/vehicleValidation';
import { defaultProviderFilters, validEstimate } from '../utils/bookingValidation';
import { validTowingCondition, validTowingQuote } from '../utils/towingValidation';
import { validateTowingDestination } from '../utils/towingDestination';

const defaultLocation = {
  latitude: null,
  longitude: null,
  city: '',
  address: 'Use current location',
  source: 'GPS pending',
};

const defaultRequest = {
  serviceType: 'mechanic',
  issueType: '',
  photoName: '',
  notes: '',
  destination: '',
  destinationMode: 'manual',
  destinationShop: null,
  towingCondition: {},
  landmark: '',
  matchingMode: 'manual',
  searchRadiusKm: 5,
  vehicleId: '',
  scheduledAt: null,
};

const STORAGE_KEY = 'fixmybuddy-state';

function readStoredState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }) {
  const storedState = readStoredState();
  const [request, setRequest] = useState(
    { ...defaultRequest, ...storedState?.request, photoName: '' },
  );
  const [location, setLocation] = useState(
    storedState?.location || defaultLocation,
  );
  const [selectedProviderId, setSelectedProviderId] = useState(
    storedState?.selectedProviderId || '',
  );
  const [attachments, setAttachments] = useState([]);
  const [searchProviders, setSearchProviders] = useState([]);
  const [providerFilters, setProviderFilters] = useState(defaultProviderFilters);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          request,
          location,
          selectedProviderId,
        }),
      );
    } catch {
      /* The current request can still be used without browser storage. */
    }
  }, [location, request, selectedProviderId]);

  const updateRequest = useCallback((nextFields) => {
    setRequest((current) => ({ ...current, ...nextFields }));
    setSearchProviders([]);
    setSelectedProviderId('');
  }, []);

  const resetRequest = useCallback((serviceType = 'mechanic') => {
    setRequest({ ...defaultRequest, serviceType });
    setSelectedProviderId('');
    setAttachments([]);
    setSearchProviders([]);
    setProviderFilters(defaultProviderFilters);
  }, []);

  const providers = searchProviders;

  const selectedProvider = useMemo(
    () =>
      providers.find((provider) => provider.id === selectedProviderId) || null,
    [providers, selectedProviderId],
  );

  const confirmRequest = async (approval) => {
    if (request.serviceType === 'towing' && validateTowingDestination(request, location)) throw new Error(validateTowingDestination(request, location));
    if (request.serviceType === 'towing' && (!validTowingCondition(request.towingCondition) || !validTowingQuote(selectedProvider?.towingQuote) || request.destination.trim().length < 5)) {
      throw new Error('Confirm your towing destination, vehicle condition and provider route before booking.');
    }
    if (!validEstimate(selectedProvider?.estimate) || !selectedProvider?.cancellationPolicy?.id || !selectedProvider.cancellationPolicy.text) {
      throw new Error('A current estimate and cancellation terms are required before booking.');
    }
    if (approval?.estimateId !== selectedProvider.estimate.id || approval?.cancellationPolicyId !== selectedProvider.cancellationPolicy.id) {
      throw new Error('Review and accept the current estimate and cancellation terms.');
    }
    if (request.scheduledAt && validateSchedule(request.scheduledAt)) {
      throw new Error('Your scheduled time has passed. Return home to choose a new time.');
    }
    if (attachments.length) {
      throw new Error('Media upload is not connected yet. Your request has not been submitted.');
    }
    if (!selectedProvider || !request.issueType || !request.vehicleId) {
      throw new Error(
        'Choose a provider, vehicle, and issue before confirming.',
      );
    }

    const booking = await customerService.createBooking({
      ...request,
      location,
      providerId: selectedProvider.id,
      estimateId: selectedProvider.estimate.id,
      estimateVersion: selectedProvider.estimate.version,
      cancellationPolicyId: selectedProvider.cancellationPolicy.id,
      paymentMethod: 'provider_qr',
      repairsApproved: false,
      ...(request.serviceType === 'towing' ? { towingRouteId: selectedProvider.towingQuote.routeId, towingRouteVersion: selectedProvider.towingQuote.version } : {}),
    });
    resetRequest(request.serviceType);
    return booking;
  };

  const value = {
    providerFilters,
    setProviderFilters,
    attachments,
    setAttachments,
    setSearchProviders,
    confirmRequest,
    location,
    providers,
    request,
    resetRequest,
    selectedProvider,
    selectedProviderId,
    setLocation,
    setSelectedProviderId,
    updateRequest,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
