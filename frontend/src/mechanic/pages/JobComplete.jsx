import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  CircleCheck,
  FileText,
  ReceiptText,
} from 'lucide-react';

const breakdown = [
  ['Call-out & diagnosis', 450],
  ['12V battery · 1 unit', 3500],
  ['Installation labor', 450],
  ['Terminal · approved extra', 200],
];

function formatPeso(value) {
  return `₱${Number(value).toLocaleString('en-PH')}`;
}

export function JobComplete() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [receiptReady, setReceiptReady] = useState(false);
  const total = breakdown.reduce((sum, [, amount]) => sum + amount, 0);

  return (
    <div className="pb-4">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#183c3a] text-[#80dfc6]">
          <CircleCheck size={21} />
        </span>
        <div>
          <h1 className="m-0 text-xl font-bold">Job done. Nicely done.</h1>
          <p className="mb-0 mt-1 text-xs text-[#aebbd0]">
            {jobId || 'FMB-1042'} · 19 Oct 2026 · 10:38 AM
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-start gap-2 rounded-xl bg-[#1c293d] p-3 text-xs leading-5 text-[#aebbd0]">
        <CircleCheck size={17} className="mt-0.5 shrink-0 text-[#80dfc6]" />
        <p className="m-0">
          Alex confirmed completion at 10:35 AM. Payment received: ₱4,600 via
          GCash.
        </p>
      </div>

      <section className="rounded-xl border border-[#34435b] bg-[#1c293d] p-3.5">
        <h2 className="m-0 text-sm font-semibold">Approved breakdown</h2>
        <dl className="mb-0 mt-4 flex flex-col gap-3">
          {breakdown.map(([label, amount]) => (
            <div key={label} className="flex justify-between gap-3 text-xs">
              <dt className="text-[#aebbd0]">{label}</dt>
              <dd className="m-0 shrink-0 font-semibold">{formatPeso(amount)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 border-t border-[#34435b] pt-3 text-sm">
            <dt className="font-semibold">Total</dt>
            <dd className="m-0 font-bold text-[#ffda45]">{formatPeso(total)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-4 rounded-xl border border-[#34435b] bg-[#1c293d] p-3.5">
        <h2 className="m-0 text-sm font-semibold">Work summary</h2>
        <p className="mb-0 mt-2 text-xs leading-5 text-white">
          Replaced 12V battery and approved terminal. Starting test passed;
          charging at 14.2V.
        </p>
        <p className="mb-0 mt-2 text-xs leading-5 text-[#aebbd0]">
          Installation warranty: 30 days. Battery warranty ends 18 Oct 2027.
        </p>
      </section>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-[#1c293d] px-3 py-3 text-xs">
        <span className="inline-flex items-center gap-2 text-[#aebbd0]">
          <FileText size={16} className="text-[#ffda45]" />
          Receipt number
        </span>
        <strong className="text-[#ffda45]">RC-1042</strong>
      </div>

      {receiptReady && (
        <p role="status" className="mb-0 mt-3 text-xs text-[#80dfc6]">
          Receipt preview is ready.
        </p>
      )}

      <button
        type="button"
        onClick={() => setReceiptReady(true)}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ffda45] px-4 text-sm font-bold text-[#111827]"
      >
        <ReceiptText size={18} />
        Issue paid receipt
      </button>

      <button
        type="button"
        onClick={() => navigate('/mechanic/earnings')}
        className="mt-2 min-h-11 w-full rounded-xl bg-[#1c293d] text-sm font-semibold text-white"
      >
        View earnings
      </button>
    </div>
  );
}