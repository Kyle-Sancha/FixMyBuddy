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
      <div className="rounded-xl border border-[#65572c] bg-[#3b3420] p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-sm font-semibold">Today’s earnings</h2>
          <Wallet size={18} className="text-[#ffda45]" aria-hidden="true" />
        </div>

        <dl className="mb-0 mt-4 flex flex-col gap-3 text-xs">
          <div className="flex justify-between gap-3 text-[#d7c98d]">
            <dt>Gross collected</dt>
            <dd className="m-0 font-semibold text-white">
              {formatPeso(grossCollected)}
            </dd>
          </div>
          <div className="flex justify-between gap-3 text-[#d7c98d]">
            <dt>Platform fee ({Math.round(platformFeeRate * 100)}%)</dt>
            <dd className="m-0 font-semibold text-white">
              −{formatPeso(platformFee)}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-[#65572c] pt-3">
            <dt className="font-semibold text-white">Net earnings</dt>
            <dd className="m-0 font-bold text-[#ffda45]">
              {formatPeso(netEarnings)}
            </dd>
          </div>
        </dl>

        <p className="mb-0 mt-3 text-[11px] text-[#d7c98d]">
          {completedJobs} completed {completedJobs === 1 ? 'job' : 'jobs'}
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-[#34435b] bg-[#1c293d] p-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#24364d] text-[#ffda45]">
          <Wallet size={18} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="m-0 text-xs font-medium">Next payout · {payoutDate}</p>
          <p className="mb-0 mt-1 text-xs text-[#aebbd0]">
            Net payout: {formatPeso(netEarnings)}
          </p>
        </div>

        <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[#ffda45]">
          {payoutStatus}
          <ArrowUpRight size={14} aria-hidden="true" />
        </span>
      </div>
    </section>
  );
}