import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Headphones,
  ShieldCheck,
} from 'lucide-react';

const checklistItems = [
  'Customer and plate match the booking',
  'Vehicle is in a safe working area',
  'Hazard lights / safety triangle checked',
  'Customer agrees to diagnostic visit',
];

export function VerifyArrival() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [pin, setPin] = useState('4826');
  const [checkedItems, setCheckedItems] = useState(checklistItems);
  const [error, setError] = useState('');

  function toggleItem(item) {
    setCheckedItems((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item],
    );
    setError('');
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (pin.trim().length !== 4) {
      setError('Enter the 4-digit arrival PIN.');
      return;
    }

    if (checkedItems.length !== checklistItems.length) {
      setError('Complete the safety checklist before continuing.');
      return;
    }

    navigate(`/mechanic/jobs/${jobId || 'FMB-1042'}/diagnosis`);
  }

  return (
    <div className="pb-4">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[rgb(var(--fmb-panel))] text-[rgb(var(--fmb-accent))]"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="m-0 text-xl font-bold">Arrived. Verify first.</h1>
          <p className="mb-0 mt-1 text-base text-[rgb(var(--fmb-muted))]">
            {jobId || 'FMB-1042'} · Mabolo Road · 9:43 AM
          </p>
        </div>
      </div>

      <section className="mb-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-[rgb(var(--fmb-selected))] font-bold text-[rgb(var(--fmb-accent))]">
          AR
        </span>
        <div>
          <strong className="block text-base">Alex Reyes</strong>
          <span className="text-base text-[rgb(var(--fmb-muted))]">
            Toyota Vios · Silver · ABC 1234
          </span>
        </div>
      </section>

      <form onSubmit={handleSubmit}>
        <label className="block text-base font-semibold">
          Ask Alex for the arrival PIN
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            value={pin}
            onChange={(event) => {
              setPin(event.target.value.replace(/\D/g, '').slice(0, 4));
              setError('');
            }}
            className="mt-3 min-h-14 w-full rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] px-4 text-center text-2xl font-bold tracking-[0.7em] text-[rgb(var(--fmb-text))] outline-none focus:border-[rgb(var(--fmb-accent))]"
            aria-label="4-digit arrival PIN"
          />
        </label>

        <section className="mt-4 rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-3.5">
          <h2 className="m-0 text-base font-semibold">Before you begin</h2>
          <ul className="mb-0 mt-3 flex list-none flex-col gap-3 p-0">
            {checklistItems.map((item) => {
              const checked = checkedItems.includes(item);

              return (
                <li key={item}>
                  <label className="flex min-h-8 items-center gap-3 text-base leading-5 text-[rgb(var(--fmb-secondary))]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(item)}
                      className="h-4 w-4 accent-[rgb(var(--fmb-accent))]"
                    />
                    <span>{item}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="mt-3 flex items-start gap-2 rounded-lg bg-[rgb(var(--fmb-panel))] px-3 py-3 text-base leading-5 text-[rgb(var(--fmb-muted))]">
          <ShieldCheck
            size={17}
            className="mt-0.5 shrink-0 text-[rgb(var(--fmb-success))]"
            aria-hidden="true"
          />
          <p className="m-0">
            The PIN confirms the right customer. Never request a PIN before
            arriving.
          </p>
        </div>

        <button
          type="button"
          className="mt-3 inline-flex min-h-10 items-center gap-2 text-base font-semibold text-[rgb(var(--fmb-accent))]"
          onClick={() => setError('Contact support will be connected later.')}
        >
          <Headphones size={16} />
          Can’t verify? Contact support
        </button>

        {error && (
          <p role="alert" className="mb-0 mt-2 text-base text-[rgb(var(--fmb-error))]">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--fmb-accent))] px-4 text-base font-bold text-[rgb(var(--fmb-ink))]"
        >
          <Check size={18} />
          Verify PIN &amp; start diagnosis
        </button>
      </form>
    </div>
  );
}