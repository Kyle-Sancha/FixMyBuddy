import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Check,
  MapPin,
  ShieldCheck,
  Truck,
} from 'lucide-react';

export function TowingHandover() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [pin, setPin] = useState('7152');
  const [checked, setChecked] = useState(false);
  const [photoCount, setPhotoCount] = useState(4);
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();

    if (pin.trim().length !== 4) {
      setError('Enter the customer’s 4-digit handover PIN.');
      return;
    }

    if (!checked) {
      setError('Confirm the vehicle condition and returned keys first.');
      return;
    }

    navigate(`/mechanic/jobs/${jobId || 'TOW-1043'}/complete`);
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
          <h1 className="m-0 text-xl font-bold">Towing &amp; handover</h1>
          <p className="mb-0 mt-1 text-base text-[rgb(var(--fmb-muted))]">
            {jobId || 'TOW-1043'} · Alex Reyes · Toyota Vios
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-3.5">
        <div className="flex items-center gap-2 text-base font-semibold">
          <Truck size={18} className="text-[rgb(var(--fmb-accent))]" />
          Tow route
        </div>
        <div className="mt-3 flex h-32 items-center justify-center rounded-lg bg-[#dce8e4]">
          <span className="rounded-full bg-[rgb(var(--fmb-bg))] px-3 py-1.5 text-base font-semibold text-[rgb(var(--fmb-text))]">
            5.0 km · Delivered
          </span>
        </div>
        <p className="mb-0 mt-3 text-base leading-5 text-[rgb(var(--fmb-muted))]">
          Mabolo Road → Naga AutoCare, Panganiban Drive · 5.0 km
        </p>
      </section>

      <div className="mt-3 flex gap-2 text-base">
        <span className="rounded-full bg-[rgb(var(--fmb-selected))] px-3 py-2 text-[rgb(var(--fmb-muted))]">
          Picked up ✓
        </span>
        <span className="rounded-full bg-[rgb(var(--fmb-selected))] px-3 py-2 text-[rgb(var(--fmb-muted))]">
          Transported ✓
        </span>
        <span className="rounded-full border border-[rgb(var(--fmb-accent))] bg-[rgb(var(--fmb-accent)/0.1)] px-3 py-2 text-[rgb(var(--fmb-accent))]">
          Handover
        </span>
      </div>

      <section className="mt-4 rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-3.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-base font-semibold">Vehicle condition record</h2>
          <label className="cursor-pointer text-base font-semibold text-[rgb(var(--fmb-accent))]">
            {photoCount} photos · Add/view
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => {
                setPhotoCount(
                  (count) => count + (event.target.files?.length || 0),
                );
                event.target.value = '';
              }}
            />
          </label>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-lg bg-[rgb(var(--fmb-bg))] p-3">
          <Camera size={18} className="text-[rgb(var(--fmb-accent))]" />
          <span className="text-base text-[rgb(var(--fmb-muted))]">
            Front, rear and side views saved
          </span>
        </div>

        <label className="mt-3 flex min-h-10 items-center gap-3 text-base text-[rgb(var(--fmb-secondary))]">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => {
              setChecked(event.target.checked);
              setError('');
            }}
            className="h-4 w-4 accent-[rgb(var(--fmb-accent))]"
          />
          No new damage · Keys returned
        </label>
      </section>

      <form onSubmit={handleSubmit} className="mt-4">
        <label className="block text-base font-semibold">
          Customer handover PIN
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            value={pin}
            onChange={(event) => {
              setPin(event.target.value.replace(/\D/g, '').slice(0, 4));
              setError('');
            }}
            className="mt-2 min-h-12 w-full rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] px-3 text-center text-lg font-bold tracking-[0.6em] text-[rgb(var(--fmb-text))] outline-none focus:border-[rgb(var(--fmb-accent))]"
          />
        </label>

        <div className="mt-3 flex items-start gap-2 rounded-lg bg-[rgb(var(--fmb-panel))] px-3 py-3 text-base leading-5 text-[rgb(var(--fmb-muted))]">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[rgb(var(--fmb-success))]" />
          <p className="m-0">
            Awaiting customer handover confirmation. Do not close the job
            before customer verification.
          </p>
        </div>

        {error && (
          <p role="alert" className="mb-0 mt-3 text-base text-[rgb(var(--fmb-error))]">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--fmb-accent))] px-4 text-base font-bold text-[rgb(var(--fmb-ink))]"
        >
          <MapPin size={18} />
          Verify PIN &amp; complete tow
        </button>
      </form>
    </div>
  );
}