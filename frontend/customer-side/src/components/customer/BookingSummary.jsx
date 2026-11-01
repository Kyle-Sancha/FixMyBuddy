import { tr } from "../../i18n/translations";
import { CalendarDays, ChevronRight, Truck, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { hasReceipt } from '../../utils/historyValidation';
export function BookingSummary({
  booking,
  detailed = false
}) {
  const date = booking.scheduledAt || booking.createdAt;
  const parsed = date ? new Date(date) : null;
  const formatted = parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Manila'
  }) : '';
  const paid = booking.payment?.status === 'verified' && Number.isFinite(booking.paidAmount);
  const amount = paid ? formatCurrency(booking.paidAmount) : Number.isFinite(booking.quotedAmount) ? `${tr('Estimated cost')}: ${formatCurrency(booking.quotedAmount)}` : tr('Waiting for price');
  const statusLabels = { requested: 'Request sent', scheduled: 'Scheduled', dispatched: 'On the way', en_route: 'On the way', in_progress: 'Service in progress', completed: 'Completed', cancelled: 'Cancelled', rejected: 'Not accepted' };
  const Icon = detailed ? booking.serviceType === 'towing' ? Truck : Wrench : CalendarDays;
  const activeMechanic = booking.serviceType === 'mechanic' && ['requested','accepted','dispatched','en_route','arrived','diagnosing','in_progress','repairing','awaiting_approval'].includes(booking.status);
  return <Link to={activeMechanic ? `/bookings/${encodeURIComponent(booking.id)}/service` : `/history?booking=${encodeURIComponent(booking.id)}`} className="customer-booking history-booking">
    <div><Icon size={21} /><h3>{booking.issueType || (booking.serviceType === 'towing' ? tr("Towing assistance") : tr("Mechanic assistance"))}</h3><span className="customer-status">{tr(statusLabels[booking.status] || (booking.status || 'Status pending').replaceAll('_', ' '))}</span></div>
    <p>{[formatted, detailed ? booking.reference : booking.vehicleLabel].filter(Boolean).join(' · ') || tr("Request details")}</p>
    <p><span>{booking.providerName || booking.towing?.provider?.name || tr("Provider pending")}</span><strong className="history-amount">{amount}</strong></p>
    {detailed && booking.vehicleLabel && <p>{booking.vehicleLabel}</p>}
    {detailed && booking.serviceType === 'towing' && booking.destination && <p>{tr("Destination:")} {booking.destination}</p>}
    <p><span>{hasReceipt(booking) ? tr("Receipt available") : paid ? tr("Payment verified") : tr("Payment not verified")}</span><span className="history-manage">{tr(activeMechanic ? 'View service' : 'View booking')} <ChevronRight size={18} /></span></p>
  </Link>;
}
