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
      <header className="mb-5">
        <h1 className="m-0 text-xl font-bold">Your Pro updates</h1>
        <p className="mb-0 mt-1 text-xs text-[#aebbd0]">
          Job alerts, account help and support.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        {initialUpdates.map(({ id, title, time, detail, icon: Icon }) => (
          <article
            key={id}
            className="rounded-xl border border-[#34435b] bg-[#1c293d] p-3.5"
          >
            <div className="flex items-center gap-2">
              <Icon size={16} className="text-[#aebbd0]" />
              <strong className="flex-1 text-xs font-semibold">{title}</strong>
              <span className="text-[11px] text-[#d8e0ec]">{time}</span>
            </div>
            <p className="mb-0 mt-2 text-xs leading-5 text-[#aebbd0]">
              {detail}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-5 rounded-xl border border-[#34435b] bg-[#1c293d] p-3.5">
        <div className="flex items-center gap-2">
          <CircleHelp size={17} className="text-[#ffda45]" />
          <h2 className="m-0 text-sm font-semibold">Support case · CL-086</h2>
          <span className="ml-auto text-xs font-semibold text-[#ffda45]">
            Review
          </span>
        </div>
        <p className="mb-0 mt-2 text-xs leading-5 text-[#aebbd0]">
          TOW-1036 · Customer receipt query. Please share your distance log.
        </p>
        <button
          type="button"
          onClick={() => setSupportMessage('Support case details will be connected later.')}
          className="mt-2 min-h-9 text-xs font-semibold text-[#ffda45]"
        >
          Open case
        </button>
        {supportMessage && (
          <p role="status" className="mb-0 mt-2 text-xs text-[#aebbd0]">
            {supportMessage}
          </p>
        )}
      </section>

      <Link
        to="/mechanic/account"
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ffda45] px-4 text-sm font-bold text-[#111827]"
      >
        <Headphones size={18} />
        Contact provider support
      </Link>

      <Link
        to="/mechanic/account"
        className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs text-[#aebbd0]"
      >
        <Bell size={16} />
        Provider account &amp; settings
      </Link>
    </div>
  );
}
