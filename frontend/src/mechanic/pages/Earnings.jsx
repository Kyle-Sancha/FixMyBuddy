import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CarFront, ChevronRight } from 'lucide-react';
import { EarningsSummary } from '../components/EarningsSummary';

const periods = ['Today', 'This week', 'This month'];

export function Earnings() {
  const [period, setPeriod] = useState('Today');

  return (
    <div className="pb-4">
      <header className="mb-5">
        <h1 className="m-0 text-xl font-bold">Your work. Your earnings.</h1>
        <p className="mb-0 mt-1 text-xs text-[#aebbd0]">
          Monday, 19 October 2026
        </p>
      </header>

      <div className="mb-4 flex gap-2">
        {periods.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={period === item}
            onClick={() => setPeriod(item)}
            className={[
              'min-h-9 rounded-full border px-3 text-xs',
              period === item
                ? 'border-[#ffda45] bg-[#ffda45]/15 font-semibold text-[#ffda45]'
                : 'border-[#34435b] bg-[#1c293d] text-[#aebbd0]',
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
        <h2 className="m-0 text-sm font-semibold">Job history</h2>
        <button
          type="button"
          className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-[#ffda45]"
        >
          View all
          <ChevronRight size={15} />
        </button>
      </div>

      <section className="rounded-xl border border-[#34435b] bg-[#1c293d]">
        <Link
          to="/mechanic/jobs/FMB-1042/complete"
          className="flex items-center gap-3 border-b border-[#34435b] p-3.5"
        >
          <CarFront size={18} className="shrink-0 text-[#aebbd0]" />
          <span className="min-w-0 flex-1">
            <strong className="block text-xs font-medium">
              FMB-1042 · Battery
            </strong>
            <small className="mt-1 block text-xs text-[#aebbd0]">
              19 Oct · Completed · Net ₱4,140
            </small>
          </span>
          <strong className="shrink-0 text-xs">₱4,600</strong>
        </Link>

        <div className="flex items-center gap-3 border-b border-[#34435b] p-3.5">
          <CarFront size={18} className="shrink-0 text-[#aebbd0]" />
          <span className="min-w-0 flex-1">
            <strong className="block text-xs font-medium">TOW-1036 · Towing</strong>
            <small className="mt-1 block text-xs text-[#aebbd0]">
              12 Oct · Completed · Net ₱1,350
            </small>
          </span>
          <strong className="shrink-0 text-xs">₱1,500</strong>
        </div>

        <div className="flex items-center gap-3 p-3.5">
          <CalendarDays size={18} className="shrink-0 text-[#aebbd0]" />
          <span className="min-w-0 flex-1">
            <strong className="block text-xs font-medium">
              FMB-1051 · Battery check
            </strong>
            <small className="mt-1 block text-xs text-[#aebbd0]">
              21 Oct · 9:00 AM · Visit estimate ₱450
            </small>
          </span>
          <span className="shrink-0 text-xs text-[#aebbd0]">Scheduled</span>
        </div>
      </section>
    </div>
  );
}