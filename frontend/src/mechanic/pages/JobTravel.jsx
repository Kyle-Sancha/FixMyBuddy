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
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1c293d] text-[#ffda45]"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="m-0 text-xl font-bold">Head to Alex</h1>
          <p className="mb-0 mt-1 text-xs text-[#aebbd0]">
            {jobId || 'FMB-1042'} · Accepted · ETA 12 minutes
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-[#34435b] bg-[#1c293d] p-3">
        <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-xl bg-[#dce8e4] text-[#274b5d]">
          <div className="absolute left-3 top-3 rounded-lg bg-[#10192d] px-3 py-1.5 text-xs font-semibold text-white">
            2.4 km · 12 min
          </div>

          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#ffda45] text-[#10192d]">
              <CarFront size={20} />
            </span>
            <span className="h-1 w-20 rounded bg-[#356ca0]" />
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#10192d] text-[#ffda45]">
              <Wrench size={20} />
            </span>
          </div>

          <span className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-lg bg-white text-[#10192d]">
            <Navigation size={18} />
          </span>
        </div>
      </section>

      <section className="mt-3 rounded-xl border border-[#34435b] bg-[#1c293d] p-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <MapPin size={17} className="text-[#ffda45]" />
            Pickup
          </span>
          <strong className="text-xs text-[#ffda45]">Mabolo Road</strong>
        </div>
        <p className="mb-0 mt-2 text-xs leading-5 text-[#aebbd0]">
          Near Mabolo Barangay Hall. Silver Vios on the safe shoulder.
        </p>
      </section>

      <section className="mt-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-[#24364d] font-bold text-[#ffda45]">
          AR
        </span>
        <div className="min-w-0 flex-1">
          <strong className="block text-sm">Alex Reyes</strong>
          <span className="text-xs text-[#aebbd0]">Toyota Vios · ABC 1234</span>
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          to="/mechanic/updates"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#34435b] bg-[#1c293d] text-sm font-semibold"
        >
          <MessageCircle size={17} />
          Chat
        </Link>
        <button
          type="button"
          disabled
          title="Calling will be available when contact details are connected."
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#34435b] bg-[#1c293d] text-sm font-semibold text-[#aebbd0] disabled:opacity-70"
        >
          <Phone size={17} />
          Call
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-2 text-[#aebbd0]">
          <Navigation size={16} className="text-[#ffda45]" />
          Job status
        </span>
        <strong className="text-[#ffda45]">On the way</strong>
      </div>
      <p className="mb-0 mt-2 text-xs leading-5 text-[#aebbd0]">
        Your location and ETA are visible to Alex.
      </p>

      <button
        type="button"
        onClick={markArrived}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ffda45] px-4 text-sm font-bold text-[#111827]"
      >
        <MapPin size={18} />
        I’ve arrived
      </button>
    </div>
  );
}