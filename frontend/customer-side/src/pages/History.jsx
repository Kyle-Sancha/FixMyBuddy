import { tr } from "../i18n/translations";
import { LoadingState } from '../components/ui/LoadingState';
import { useState } from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookingSummary } from '../components/customer/BookingSummary';
import { BookingActions } from '../components/customer/BookingActions';
import { CustomerHeading } from '../components/customer/CustomerHeading';
import { useAuth } from '../context/useAuth';
import { useCustomer } from '../context/useCustomer';
import { BookingPayment } from '../components/customer/BookingPayment';
import { terminalStatuses } from '../utils/historyValidation';
import { BookingSharing } from '../components/customer/BookingSharing';
import { AfterService } from '../components/customer/AfterService';
import { TowingJourney } from '../components/customer/TowingJourney';
export function History() {
  const {
    user
  } = useAuth();
  const {
    bookings,
    bookingStatus,
    refreshData
  } = useCustomer();
  const [params] = useSearchParams();
  const [service, setService] = useState('all');
  const [status, setStatus] = useState('all');
  const focused = bookings.find(item => String(item.id) === params.get('booking'));
  const filtered = bookings.filter(item => (service === 'all' || item.serviceType === service) && (status === 'all' || (status === 'upcoming' ? !terminalStatuses.has(item.status) : item.status === status)));
  const groups = [{
    title: 'Coming up',
    items: filtered.filter(item => !terminalStatuses.has(item.status)).sort((a, b) => (Date.parse(a.scheduledAt || a.createdAt) || 0) - (Date.parse(b.scheduledAt || b.createdAt) || 0))
  }, {
    title: 'Completed',
    items: filtered.filter(item => item.status === 'completed').sort((a, b) => (Date.parse(b.completedAt || b.createdAt) || 0) - (Date.parse(a.completedAt || a.createdAt) || 0))
  }, {
    title: 'Cancelled / not accepted',
    items: filtered.filter(item => ['cancelled', 'rejected'].includes(item.status))
  }];
  return <>
    <CustomerHeading title={tr("Your bookings")} backTo="/app">{tr("Choose a booking to see its progress, cost or receipt.")}</CustomerHeading>
    {bookingStatus === 'ready' && <button className="customer-text-button history-refresh" type="button" onClick={refreshData}><RefreshCw size={16} />{tr("Refresh bookings")}</button>}
    {!params.has('booking') && <><div className="provider-tools history-filters" role="group" aria-label={tr("Filter by service")}>{[['all', 'All bookings'], ['mechanic', 'Mechanic'], ['towing', 'Towing']].map(([value, label]) => <button className="provider-chip" type="button" aria-pressed={service === value} key={value} onClick={() => setService(value)}>{tr(label)}</button>)}</div><label className="history-status-filter">{tr("Booking status")}<select value={status} onChange={event => setStatus(event.target.value)}><option value="all">{tr("All statuses")}</option><option value="upcoming">{tr("Coming up")}</option><option value="completed">{tr("Completed")}</option><option value="cancelled">{tr("Cancelled")}</option><option value="rejected">{tr("Not accepted")}</option></select></label></>}
    {bookingStatus === 'loading' ? <LoadingState label={tr("Loading bookings...")} /> : bookingStatus === 'error' ? <div className="history-notice" role="status"><p>{tr("Could not load your bookings.")}</p><button type="button" className="auth-secondary" onClick={refreshData}><RefreshCw size={18} />{tr("Try again")}</button></div> : bookingStatus === 'unavailable' ? <div className="customer-empty"><CalendarDays size={33} /><h2>{user ? tr("Booking history is not connected yet") : tr("Keep your roadside history together")}</h2><p>{user ? tr("Your records will appear when the booking service is available.") : tr("Sign in to view scheduled and past assistance.")}</p><Link className="auth-secondary" to={user ? '/app' : '/login'}>{user ? tr("Back to home") : tr("Sign in")}</Link></div> : params.has('booking') && !focused ? <div className="customer-empty"><h2>{tr("Booking not found")}</h2><p>{tr("This booking may no longer be available to your account.")}</p><Link className="auth-secondary" to="/history">{tr("Show all bookings")}</Link></div> : focused ? <section className="customer-booking-detail">
      <div className="customer-section-heading"><h2>{tr("Booking details")}</h2><Link to="/history">{tr("Show all")}</Link></div>
      <BookingSummary booking={focused} detailed />
      <TowingJourney key={`${focused.id}-${focused.towing?.handover?.status}`} booking={focused} onRefresh={refreshData} />
      {focused.notes && <p className="customer-muted">{focused.notes}</p>}
      <BookingActions key={`${focused.id}-${focused.version}-${focused.status}-${focused.scheduledAt}`} booking={focused} />
      <BookingSharing key={`${focused.id}-${focused.sharing?.enabled}`} booking={focused} />
      <BookingPayment key={`${focused.id}-${focused.repairEstimate?.id}-${focused.repairEstimate?.version}`} booking={focused} onRefresh={refreshData} />
      <AfterService key={`${focused.id}-${focused.review?.id}-${focused.review?.version}`} booking={focused} onRefresh={refreshData} />
    </section> : filtered.length ? <div className="history-groups" key={`${service}-${status}`}>{groups.filter(group => group.items.length).map(group => <section key={group.title}><h2>{group.title}</h2><div className="customer-history-list">{group.items.map(item => <BookingSummary key={item.id} booking={item} detailed />)}</div></section>)}</div> : <div className="customer-empty"><CalendarDays size={33} /><h2>{tr("No bookings here yet")}</h2><p>{tr("Your confirmed requests will appear here. Changing filters may show other bookings.")}</p><Link className="auth-secondary" to="/app">{tr("Request assistance")}</Link></div>}
  </>;
}
