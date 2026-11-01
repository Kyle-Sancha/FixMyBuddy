import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CarFront,
  Clock3,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Wrench,
} from 'lucide-react';

export function JobTravel() {
  const navigate = useNavigate();
  const { jobId } = useParams();

  function markArrived() {
    navigate(`/mechanic/jobs/${jobId || 'FMB-1042'}/arrival`);
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
          <h1 className="m-0 text-xl font-bold">Head to Alex</h1>
          <p className="mb-0 mt-1 text-base text-[rgb(var(--fmb-muted))]">
            {jobId || 'FMB-1042'} · Accepted · ETA 12 minutes
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-3">
        <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-xl bg-[#dce8e4] text-[#274b5d]">
          <div className="absolute left-3 top-3 rounded-lg bg-[rgb(var(--fmb-bg))] px-3 py-1.5 text-base font-semibold text-[rgb(var(--fmb-text))]">
            2.4 km · 12 min
          </div>

          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[rgb(var(--fmb-accent))] text-[rgb(var(--fmb-bg))]">
              <CarFront size={20} />
            </span>
            <span className="h-1 w-20 rounded bg-[#356ca0]" />
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[rgb(var(--fmb-bg))] text-[rgb(var(--fmb-accent))]">
              <Wrench size={20} />
            </span>
          </div>

          <span className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-lg bg-white text-[rgb(var(--fmb-bg))]">
            <Navigation size={18} />
          </span>
        </div>
      </section>

      <section className="mt-3 rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-base font-semibold">
            <MapPin size={17} className="text-[rgb(var(--fmb-accent))]" />
            Pickup
          </span>
          <strong className="text-base text-[rgb(var(--fmb-accent))]">Mabolo Road</strong>
        </div>
        <p className="mb-0 mt-2 text-base leading-5 text-[rgb(var(--fmb-muted))]">
          Near Mabolo Barangay Hall. Silver Vios on the safe shoulder.
        </p>
      </section>

      <section className="mt-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-[rgb(var(--fmb-selected))] font-bold text-[rgb(var(--fmb-accent))]">
          AR
        </span>
        <div className="min-w-0 flex-1">
          <strong className="block text-base">Alex Reyes</strong>
          <span className="text-base text-[rgb(var(--fmb-muted))]">Toyota Vios · ABC 1234</span>
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          to="/mechanic/updates"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] text-base font-semibold"
        >
          <MessageCircle size={17} />
          Chat
        </Link>
        <button
          type="button"
          disabled
          title="Calling will be available when contact details are connected."
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] text-base font-semibold text-[rgb(var(--fmb-muted))] disabled:opacity-70"
        >
          <Phone size={17} />
          Call
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between text-base">
        <span className="inline-flex items-center gap-2 text-[rgb(var(--fmb-muted))]">
          <Navigation size={16} className="text-[rgb(var(--fmb-accent))]" />
          Job status
        </span>
        <strong className="text-[rgb(var(--fmb-accent))]">On the way</strong>
      </div>
      <p className="mb-0 mt-2 text-base leading-5 text-[rgb(var(--fmb-muted))]">
        Your location and ETA are visible to Alex.
      </p>

      <button
        type="button"
        onClick={markArrived}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--fmb-accent))] px-4 text-base font-bold text-[rgb(var(--fmb-ink))]"
      >
        <MapPin size={18} />
        I’ve arrived
      </button>
    </div>
  );
}