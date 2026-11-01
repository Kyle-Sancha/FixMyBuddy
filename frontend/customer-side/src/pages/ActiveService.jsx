import { Link, useParams } from 'react-router-dom';
import { CustomerHeading } from '../components/customer/CustomerHeading';
import { MechanicProgress } from '../components/customer/MechanicProgress';
import { QuoteReview } from '../components/customer/QuoteReview';
import { BookingSharing } from '../components/customer/BookingSharing';
import { LoadingState } from '../components/ui/LoadingState';
import { useCustomer } from '../context/useCustomer';
import { useLocale } from '../context/useLocale';

export function ActiveService() {
  const { bookingId } = useParams();
  const { bookings, bookingStatus, refreshData } = useCustomer();
  const { t } = useLocale();
  const booking = bookings.find(item => String(item.id) === bookingId && item.serviceType === 'mechanic');
  return <>
    <CustomerHeading title={t('Your mechanic service','Serbisyo ng iyong mekaniko')} backTo="/history">{booking?.reference || t('Follow your service and stay in touch.','Subaybayan ang serbisyo at makipag-ugnayan.')}</CustomerHeading>
    {bookingStatus === 'loading' ? <LoadingState /> : bookingStatus !== 'ready' ? <div className="history-notice"><p>{t('Your service could not be loaded. Sign in or try again.','Hindi makuha ang serbisyo. Mag-sign in o subukan muli.')}</p><button className="auth-secondary" type="button" onClick={refreshData}>{t('Try again','Subukan muli')}</button><Link to="/login" className="provider-text-link">{t('Sign in','Mag-sign in')}</Link></div> : !booking ? <p className="history-notice">{t('This mechanic booking is not available to your account.','Hindi available sa iyong account ang booking na ito.')}</p> : <>
      <MechanicProgress key={`${booking.id}-${booking.version}-${booking.status}`} booking={booking} onRefresh={refreshData} />
      {booking.mechanic?.workPaused === true && <p className="request-safety">{booking.revisionStatus === 'awaiting_customer' || booking.repairApprovalStatus === 'awaiting_customer' ? t('Your provider reports that work is paused. Review any pending quote below.','Ayon sa provider, nakahinto ang trabaho. Suriin ang quote na naghihintay ng pasya.') : t('Your provider reports that work is paused. Contact them for the next step.','Ayon sa provider, nakahinto ang trabaho. Makipag-ugnayan para sa susunod na hakbang.')}</p>}
      <QuoteReview key={`${booking.id}-${booking.pendingRevision?.id}-${booking.pendingRevision?.version}-${booking.repairEstimate?.id}-${booking.repairEstimate?.version}-${booking.revisionStatus}-${booking.repairApprovalStatus}`} booking={booking} onRefresh={refreshData} />
      <BookingSharing key={`${booking.id}-${booking.sharing?.enabled}`} booking={booking} />
      <Link className="auth-secondary" to={`/history?booking=${encodeURIComponent(booking.id)}`}>{t('Booking details, payment and receipts','Detalye ng booking, bayad at resibo')}</Link>
    </>}
  </>;
}
