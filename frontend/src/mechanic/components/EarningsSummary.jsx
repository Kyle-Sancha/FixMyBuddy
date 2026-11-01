import { ArrowUpRight, Wallet } from 'lucide-react';

function formatPeso(value) {
  return `₱${Number(value || 0).toLocaleString('en-PH')}`;
}

export function EarningsSummary({
  grossCollected = 0,
  platformFeeRate = 0.1,
  completedJobs = 0,
  payoutDate = 'Pending',
  payoutStatus = 'Pending',
}) {
  const platformFee = Math.round(grossCollected * platformFeeRate);
  const netEarnings = grossCollected - platformFee;

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-xl border border-[rgb(var(--fmb-accent)/0.4)] bg-[rgb(var(--fmb-accent)/0.12)] p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-base font-semibold">Today’s earnings</h2>
          <Wallet size={18} className="text-[rgb(var(--fmb-accent))]" aria-hidden="true" />
        </div>

        <dl className="mb-0 mt-4 flex flex-col gap-3 text-base">
          <div className="flex justify-between gap-3 text-[rgb(var(--fmb-secondary))]">
            <dt>Gross collected</dt>
            <dd className="m-0 font-semibold text-[rgb(var(--fmb-text))]">
              {formatPeso(grossCollected)}
            </dd>
          </div>
          <div className="flex justify-between gap-3 text-[rgb(var(--fmb-secondary))]">
            <dt>Platform fee ({Math.round(platformFeeRate * 100)}%)</dt>
            <dd className="m-0 font-semibold text-[rgb(var(--fmb-text))]">
              −{formatPeso(platformFee)}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-[rgb(var(--fmb-accent)/0.4)] pt-3">
            <dt className="font-semibold text-[rgb(var(--fmb-text))]">Net earnings</dt>
            <dd className="m-0 font-bold text-[rgb(var(--fmb-accent))]">
              {formatPeso(netEarnings)}
            </dd>
          </div>
        </dl>

        <p className="mb-0 mt-3 text-base text-[rgb(var(--fmb-secondary))]">
          {completedJobs} completed {completedJobs === 1 ? 'job' : 'jobs'}
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[rgb(var(--fmb-selected))] text-[rgb(var(--fmb-accent))]">
          <Wallet size={18} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="m-0 text-base font-medium">Next payout · {payoutDate}</p>
          <p className="mb-0 mt-1 text-base text-[rgb(var(--fmb-muted))]">
            Net payout: {formatPeso(netEarnings)}
          </p>
        </div>

        <span className="flex shrink-0 items-center gap-1 text-base font-semibold text-[rgb(var(--fmb-accent))]">
          {payoutStatus}
          <ArrowUpRight size={14} aria-hidden="true" />
        </span>
      </div>
    </section>
  );
}