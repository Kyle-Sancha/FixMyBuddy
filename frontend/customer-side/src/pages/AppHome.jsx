import { tr, trTemplate } from "../i18n/translations";
import { useRef, useState } from 'react';
import { CalendarDays, ChevronDown, LocateFixed, MapPin, Plus, Truck, Wrench } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthNotice } from '../components/auth/AuthControls';
import { BookingSummary } from '../components/customer/BookingSummary';
import { CustomerHeading } from '../components/customer/CustomerHeading';
import { VehicleIcon } from '../components/customer/VehicleIcon';
import { PickupPreview } from './auth/Welcome';
import { useApp } from '../context/useApp';
import { useAuth } from '../context/useAuth';
import { useCustomer } from '../context/useCustomer';
import { useGeolocation } from '../hooks/useGeolocation';
import { localDateTime, validateSchedule } from '../utils/vehicleValidation';
export function AppHome() {
  const {
    user
  } = useAuth();
  const {
    selectedVehicle,
    vehicles,
    vehicleStatus,
    bookings,
    bookingStatus,
    refreshData
  } = useCustomer();
  const {
    location,
    setLocation,
    request,
    resetRequest,
    updateRequest
  } = useApp();
  const {
    requestLocation,
    status,
    error: locationError
  } = useGeolocation();
  const [timing, setTiming] = useState(request.scheduledAt ? 'scheduled' : 'now');
  const [scheduledAt, setScheduledAt] = useState(request.scheduledAt ? localDateTime(new Date(request.scheduledAt)) : '');
  const [error, setError] = useState('');
  const scheduleInput = useRef(null);
  const navigate = useNavigate();
  const name = typeof user?.name === 'string' ? user.name.trim().split(/\s+/)[0] : '';
  const upcoming = bookings.filter(item => !['completed', 'cancelled', 'rejected'].includes(item.status)).sort((a, b) => Date.parse(a.scheduledAt || a.createdAt) - Date.parse(b.scheduledAt || b.createdAt));
  const gpsActive = location.source === 'GPS active' && Number.isFinite(location.latitude);
  async function locate() {
    const next = await requestLocation();
    if (next) setLocation(current => ({
      ...current,
      ...next
    }));
  }
  function start(service) {
    if (vehicleStatus === 'loading' || vehicleStatus === 'error') return;
    const selectedTime = scheduleInput.current?.value || scheduledAt;
    const scheduleError = timing === 'scheduled' ? validateSchedule(selectedTime) : '';
    setError(scheduleError);
    if (scheduleError) {
      scheduleInput.current?.focus();
      return;
    }
    resetRequest(service);
    updateRequest({
      vehicleId: selectedVehicle?.id || '',
      landmark: location.landmark || '',
      scheduledAt: timing === 'scheduled' ? new Date(selectedTime).toISOString() : null
    });
    navigate(selectedVehicle ? service === 'towing' ? '/request/towing' : '/request?service=mechanic' : `/vehicles?continue=${service}`);
  }
  return <>
      <CustomerHeading title={name ? trTemplate(["We've got you, ", "."], [name]) : tr("We've got you.")}>{tr("Roadside help, without the guesswork.")}</CustomerHeading>
      <div className="customer-location-row">
        <Link to="/location">
          <MapPin size={19} />
          <span>
            {location.address && location.address !== 'Use current location' ? location.address : tr("Set your pickup location")}
          </span>
        </Link>
        <button type="button" onClick={locate} disabled={status === 'loading'}>
          {status === 'loading' ? tr("Locating...") : gpsActive ? tr("GPS active") : tr("Use GPS")}
        </button>
      </div>
      <div className="customer-map">
        <PickupPreview onLocate={locate} locating={status === 'loading'} compact />
      </div>
      {locationError && <AuthNotice error>{locationError}</AuthNotice>}
      <Link to="/vehicles" className="customer-vehicle-selector">
        <span className="customer-yellow">
          {selectedVehicle ? <VehicleIcon type={selectedVehicle.type} /> : <Plus size={23} />}
        </span>
        <span>
          <strong>
            {vehicleStatus === 'loading' ? tr("Loading vehicles...") : selectedVehicle ? trTemplate(["", " ", " \xB7 ", ""], [selectedVehicle.make, selectedVehicle.model, selectedVehicle.year]) : vehicles.length ? tr("Choose your vehicle") : tr("Add your vehicle")}
          </strong>
          <small>
            {selectedVehicle ? [selectedVehicle.color, selectedVehicle.plate || tr('No plate added')].join(' · ') : tr("Select the ride that needs a buddy.")}
          </small>
        </span>
        <ChevronDown size={18} />
      </Link>
      {vehicleStatus === 'error' && <AuthNotice error>{tr("We could not load your vehicles.")} {' '}
          <button type="button" className="customer-text-button" onClick={refreshData}>{tr("Try again")}</button>
        </AuthNotice>}
      <div className="auth-segments customer-timing" role="group" aria-label={tr("When do you need help?")}>
        <button type="button" aria-pressed={timing === 'now'} onClick={() => setTiming('now')}>{tr("Help now")}</button>
        <button type="button" aria-pressed={timing === 'scheduled'} onClick={() => setTiming('scheduled')}>
          <CalendarDays size={16} />{tr("Schedule for later")}</button>
      </div>
      {timing === 'scheduled' && <div className="auth-field customer-schedule">
          <label htmlFor="schedule-time">{tr("Preferred date & time")}</label>
          <div className="auth-input-wrap">
            <input id="schedule-time" ref={scheduleInput} type="datetime-local" min={localDateTime()} value={scheduledAt} onChange={event => {
          setScheduledAt(event.target.value);
          setError('');
        }} aria-describedby="schedule-hint" />
          </div>
          <p id="schedule-hint" className="auth-hint">{tr("Uses your device's local time. Availability is confirmed when you book.")}</p>
        </div>}
      {error && <AuthNotice error>{tr(error)}</AuthNotice>}
      <div className="customer-service-actions">
        <button type="button" className="auth-primary" onClick={() => start('mechanic')} disabled={vehicleStatus !== 'ready'}>
          <Wrench size={22} />{tr("Request Mechanic")}</button>
        <button type="button" className="auth-secondary" onClick={() => start('towing')} disabled={vehicleStatus !== 'ready'}>
          <Truck size={22} />{tr("Request Towing")}</button>
      </div>
      <section className="customer-bookings">
        <div className="customer-section-heading">
          <h2>{tr("Your next booking")}</h2>
          <Link to="/history">{tr("View all")}</Link>
        </div>
        {bookingStatus === 'loading' ? <p className="customer-muted" role="status">{tr("Loading your bookings...")}</p> : bookingStatus === 'error' ? <AuthNotice error>{tr("Could not load bookings.")} {' '}
            <button type="button" onClick={refreshData} className="customer-text-button">{tr("Retry")}</button>
          </AuthNotice> : upcoming.length ? <BookingSummary booking={upcoming[0]} /> : <div className="customer-empty-inline">
            <CalendarDays size={23} />
            <div>
              <h3>
                {user ? tr("No upcoming bookings") : tr("Your bookings, all in one place")}
              </h3>
              <p>
                {user ? tr("Your next confirmed request will appear here.") : tr("Sign in to see scheduled and past assistance.")}
              </p>
              {!user && <Link to="/login">{tr("Sign in")}<LocateFixed size={13} />
                </Link>}
            </div>
          </div>}
      </section>
    </>;
}
