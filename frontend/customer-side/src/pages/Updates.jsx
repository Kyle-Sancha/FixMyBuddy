import { tr, trTemplate } from "../i18n/translations";
import { LoadingState } from '../components/ui/LoadingState';
import { useState } from 'react';
import { Bell, CheckCheck, ShieldCheck, Wallet, CircleCheck, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CustomerHeading } from '../components/customer/CustomerHeading';
import { MaintenanceReminders } from '../components/customer/MaintenanceReminders';
import { useAuth } from '../context/useAuth';
import { useCustomer } from '../context/useCustomer';
export function Updates() {
  const {
    user
  } = useAuth();
  const {
    updates,
    updatesStatus,
    refreshData,
    markUpdatesRead,
    selectedVehicle
  } = useCustomer();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const unread = updates.filter(item => !item.read && !item.readAt);
  async function read(ids) {
    if (busy || !ids.length) return;
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const confirmed = await markUpdatesRead(ids);
      setMessage(`${confirmed.length} notification${confirmed.length === 1 ? '' : 's'} marked read.`);
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }
  return <>
    <CustomerHeading title={tr("Stay one step ahead")} backTo="/app">{selectedVehicle ? trTemplate(["Reminders and updates for your ", " ", "."], [selectedVehicle.make, selectedVehicle.model]) : tr("Your maintenance reminders and booking updates.")}</CustomerHeading>
    <MaintenanceReminders key={user?.id || 'guest'} user={user} />
    <section className="updates-notifications">
      <div className="customer-section-heading"><h2>{tr("Notifications")}</h2><button type="button" className="customer-text-button" disabled={busy || !unread.length || updatesStatus !== 'ready'} onClick={() => read(unread.map(item => item.id))}><CheckCheck size={16} />{busy ? tr("Saving...") : tr("Mark all read")}</button></div>
      {updatesStatus === 'loading' ? <LoadingState label={tr("Loading notifications...")} /> : updatesStatus === 'error' ? <div className="history-notice"><p>{tr("Could not load notifications.")}</p><button type="button" className="auth-secondary" onClick={refreshData}>{tr("Try again")}</button></div> : updatesStatus === 'unavailable' ? <div className="history-notice"><Bell size={24} /><p>{user ? tr("Notification service is not connected yet.") : tr("Sign in to view notifications for your bookings.")}</p>{!user && <Link className="auth-secondary" to="/login">{tr("Sign in")}</Link>}</div> : !updates.length ? <p className="history-empty-copy">{tr("No notifications yet. Booking and provider updates will appear here.")}</p> : <div className="notification-list">
        {updates.map(item => {
          const Icon = item.type === 'payment_received' ? Wallet : item.type === 'warranty' ? ShieldCheck : item.type === 'booking_confirmed' ? CircleCheck : Bell;
          const isUnread = !item.read && !item.readAt;
          const validDate = item.createdAt && Number.isFinite(Date.parse(item.createdAt));
          return <article key={item.id} className={isUnread ? 'is-unread' : ''}><header><Icon size={20} /><h3>{item.title}</h3>{validDate && <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZone: 'Asia/Manila'
                })}</time>}{isUnread && <span className="notification-dot" aria-label={tr("Unread")} />}</header><p>{item.message}</p><div className="notification-actions">{item.bookingId && <Link className="customer-text-button" to={`/history?booking=${encodeURIComponent(item.bookingId)}`}>{tr("View booking")}</Link>}{isUnread && <button className="customer-text-button" type="button" disabled={busy} onClick={() => read([item.id])}>{tr("Mark read")}</button>}</div></article>;
        })}
      </div>}
      {message && <p role="status" className="customer-save-status">{tr(message)}</p>}{error && <p role="alert" className="auth-error">{tr(error)}</p>}
      {updatesStatus === 'ready' && <button className="customer-text-button" type="button" onClick={refreshData}><RefreshCw size={16} />{tr("Refresh notifications")}</button>}
    </section>
  </>;
}
