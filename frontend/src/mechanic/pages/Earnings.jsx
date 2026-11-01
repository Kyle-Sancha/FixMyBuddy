import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CarFront, ChevronRight } from 'lucide-react';
import { EarningsSummary } from '../components/EarningsSummary';
import { MechanicHeader } from '../components/MechanicHeader';

const periods = ['Today', 'This week', 'This month'];

export function Earnings() {
  const [period, setPeriod] = useState('Today');

  return (
    <div className="pb-4">
      <MechanicHeader showBrand={false} title="Your work. Your earnings." subtitle="Monday, 19 October 2026" />

      <div className="mb-4 flex gap-2">
        {periods.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={period === item}
            onClick={() => setPeriod(item)}
            className={[
              'min-h-9 rounded-full border px-3 text-base',
              period === item
                ? 'border-[rgb(var(--fmb-accent))] bg-[rgb(var(--fmb-accent)/0.15)] font-semibold text-[rgb(var(--fmb-accent))]'
                : 'border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] text-[rgb(var(--fmb-muted))]',
            ].join(' ')}
          >
            {item}
          </button>
        ))}
      </div>

      <EarningsSummary
        grossCollected={4600}
        platformFeeRate={0.1}
        completedJobs={1}
        payoutDate="20 Oct"
        payoutStatus="Pending"
      />

      <div className="mb-3 mt-6 flex items-center justify-between">
        <h2 className="m-0 text-base font-semibold">Job history</h2>
        <button
          type="button"
          className="inline-flex min-h-9 items-center gap-1 text-base font-semibold text-[rgb(var(--fmb-accent))]"
        >
          View all
          <ChevronRight size={15} />
        </button>
      </div>

      <section className="rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))]">
        <Link
          to="/mechanic/jobs/FMB-1042/complete"
          className="flex items-center gap-3 border-b border-[rgb(var(--fmb-border))] p-3.5"
        >
          <CarFront size={18} className="shrink-0 text-[rgb(var(--fmb-muted))]" />
          <span className="min-w-0 flex-1">
            <strong className="block text-base font-medium">
              FMB-1042 · Battery
            </strong>
            <small className="mt-1 block text-base text-[rgb(var(--fmb-muted))]">
              19 Oct · Completed · Net ₱4,140
            </small>
          </span>
          <strong className="shrink-0 text-base">₱4,600</strong>
        </Link>

        <div className="flex items-center gap-3 border-b border-[rgb(var(--fmb-border))] p-3.5">
          <CarFront size={18} className="shrink-0 text-[rgb(var(--fmb-muted))]" />
          <span className="min-w-0 flex-1">
            <strong className="block text-base font-medium">TOW-1036 · Towing</strong>
            <small className="mt-1 block text-base text-[rgb(var(--fmb-muted))]">
              12 Oct · Completed · Net ₱1,350
            </small>
          </span>
          <strong className="shrink-0 text-base">₱1,500</strong>
        </div>

        <div className="flex items-center gap-3 p-3.5">
          <CalendarDays size={18} className="shrink-0 text-[rgb(var(--fmb-muted))]" />
          <span className="min-w-0 flex-1">
            <strong className="block text-base font-medium">
              FMB-1051 · Battery check
            </strong>
            <small className="mt-1 block text-base text-[rgb(var(--fmb-muted))]">
              21 Oct · 9:00 AM · Visit estimate ₱450
            </small>
          </span>
          <span className="shrink-0 text-base text-[rgb(var(--fmb-muted))]">Scheduled</span>
        </div>
      </section>
    </div>
  );
}