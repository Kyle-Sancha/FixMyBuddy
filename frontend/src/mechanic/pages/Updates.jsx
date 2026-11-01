import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  CreditCard,
  Headphones,
} from 'lucide-react';
import { MechanicHeader } from '../components/MechanicHeader';

const initialUpdates = [
  {
    id: 'payment',
    title: 'Payment received',
    time: '10:38 AM',
    detail: 'FMB-1042 · ₱4,600 collected. Net payout ₱4,140 is pending.',
    icon: CreditCard,
  },
  {
    id: 'extra',
    title: 'Extra work approved',
    time: '10:08 AM',
    detail: 'Alex approved the ₱200 terminal extra. Revised total: ₱4,600.',
    icon: CheckCircle2,
  },
  {
    id: 'schedule',
    title: 'Scheduled job reminder',
    time: '21 Oct',
    detail: 'FMB-1051 · Alex · Battery check at 9 AM.',
    icon: CalendarDays,
  },
];

export function Updates() {
  const [supportMessage, setSupportMessage] = useState('');

  return (
    <div className="pb-4">
      <MechanicHeader showBrand={false} title="Your Pro updates" subtitle="Job alerts, account help and support." />

      <section className="flex flex-col gap-3">
        {initialUpdates.map(({ id, title, time, detail, icon: Icon }) => (
          <article
            key={id}
            className="rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-3.5"
          >
            <div className="flex items-center gap-2">
              <Icon size={16} className="text-[rgb(var(--fmb-muted))]" />
              <strong className="flex-1 text-base font-semibold">{title}</strong>
              <span className="text-base text-[rgb(var(--fmb-secondary))]">{time}</span>
            </div>
            <p className="mb-0 mt-2 text-base leading-5 text-[rgb(var(--fmb-muted))]">
              {detail}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-5 rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-3.5">
        <div className="flex items-center gap-2">
          <CircleHelp size={17} className="text-[rgb(var(--fmb-accent))]" />
          <h2 className="m-0 text-base font-semibold">Support case · CL-086</h2>
          <span className="ml-auto text-base font-semibold text-[rgb(var(--fmb-accent))]">
            Review
          </span>
        </div>
        <p className="mb-0 mt-2 text-base leading-5 text-[rgb(var(--fmb-muted))]">
          TOW-1036 · Customer receipt query. Please share your distance log.
        </p>
        <button
          type="button"
          onClick={() => setSupportMessage('Support case details will be connected later.')}
          className="mt-2 min-h-9 text-base font-semibold text-[rgb(var(--fmb-accent))]"
        >
          Open case
        </button>
        {supportMessage && (
          <p role="status" className="mb-0 mt-2 text-base text-[rgb(var(--fmb-muted))]">
            {supportMessage}
          </p>
        )}
      </section>

      <Link
        to="/mechanic/account"
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--fmb-accent))] px-4 text-base font-bold text-[rgb(var(--fmb-ink))]"
      >
        <Headphones size={18} />
        Contact provider support
      </Link>

      <Link
        to="/mechanic/account"
        className="mt-3 inline-flex min-h-11 items-center gap-2 text-base text-[rgb(var(--fmb-muted))]"
      >
        <Bell size={16} />
        Provider account &amp; settings
      </Link>
    </div>
  );
}
