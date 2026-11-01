import { tr } from "../../i18n/translations";
import { useState } from 'react';
import { Bell, Check, LocateFixed, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthHeading, AuthNotice } from '../../components/auth/AuthControls';
import { useApp } from '../../context/useApp';
import { useGeolocation } from '../../hooks/useGeolocation';
export function Permissions() {
  const {
    location,
    setLocation
  } = useApp();
  const {
    requestLocation,
    error,
    status
  } = useGeolocation();
  const [notificationStatus, setNotificationStatus] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported');
  const [notificationError, setNotificationError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const hasLocation = location.source === 'GPS active';
  async function enableLocation() {
    if (status === 'loading') return;
    const next = await requestLocation();
    if (next) setLocation(current => ({
      ...current,
      ...next
    }));
  }
  async function enableNotifications() {
    if (requesting) return;
    setNotificationError('');
    if (!('Notification' in window)) {
      setNotificationStatus('unsupported');
      return;
    }
    setRequesting(true);
    try {
      setNotificationStatus(await Notification.requestPermission());
    } catch {
      setNotificationError('Could not request notifications. You can try again later.');
    } finally {
      setRequesting(false);
    }
  }
  return <div className="auth-page">
      <AuthHeading title={tr("Help finds you faster.")}>{tr("A little access. A safer roadside experience.")}</AuthHeading>
      <div className="auth-permission-visual">
        <img src="/images/roadside-buddy.png" alt={tr("Illustration of a motorcycle rider and service vehicle")} />
        <span>
          <MapPin size={15} />{tr("Your journey, a little easier.")}</span>
      </div>
      <div className="auth-permission-list">
        <section className="auth-permission">
          <div>
            <span className="auth-feature-icon">
              <LocateFixed size={21} />
            </span>
            <h3>{tr("Precise location")}</h3>
            <button type="button" onClick={enableLocation} disabled={status === 'loading'}>
              {status === 'loading' ? tr("Locating...") : hasLocation ? <>
                  <Check size={15} />{tr("Update")}</> : tr("Enable")}
            </button>
          </div>
          <p>
            {hasLocation ? tr("Your current position is set. You can change your pickup location before booking.") : tr("Set your pickup point accurately. You can also enter your address manually.")}
          </p>
        </section>
        <section className="auth-permission">
          <div>
            <span className="auth-feature-icon">
              <Bell size={21} />
            </span>
            <h3>{tr("Notifications")}</h3>
            <button type="button" onClick={enableNotifications} disabled={requesting || notificationStatus !== 'default'}>
              {notificationStatus === 'granted' ? <>
                  <Check size={15} />{tr("Allowed")}</> : notificationStatus === 'denied' ? tr("Blocked") : notificationStatus === 'unsupported' ? tr("Unavailable") : requesting ? tr("Requesting...") : tr("Enable")}
            </button>
          </div>
          <p>
            {notificationStatus === 'granted' ? tr("Notification permission is enabled for this browser.") : notificationStatus === 'denied' ? tr("Notifications are blocked. You can change this in your browser site settings.") : notificationStatus === 'unsupported' ? tr("This browser does not support notification permissions. You can continue without them.") : tr("Allow this browser to receive notifications. You stay in control of its permissions.")}
          </p>
        </section>
      </div>
      {(error || notificationError) && <AuthNotice error>{error || notificationError}</AuthNotice>}
      <p className="auth-hint">{tr("Both are optional. You can change permissions in your browser settings at any time.")}</p>
      <div className="auth-actions">
        <Link to="/profile" className="auth-primary">{tr("Continue")}<Check size={18} />
        </Link>
        <Link to="/profile" className="auth-secondary">{tr("Skip for now")}</Link>
      </div>
    </div>;
}
