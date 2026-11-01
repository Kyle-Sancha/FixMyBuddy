import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  CarFront,
  ChevronDown,
  MapPin,
  Wrench,
} from 'lucide-react';

const job = {
  id: 'FMB-1042',
  customer: 'Alex Reyes',
  vehicle: 'Toyota Vios · 2021',
  issue: 'Clicking, won’t start',
  location: 'Mabolo Barangay Hall',
  distance: '2.4 km',
  estimate: 405,
};

function formatPeso(value) {
  return `₱${Number(value).toLocaleString('en-PH')}`;
}

export function JobOffer() {
  const navigate = useNavigate();
  const { jobId } = useParams();

  function acceptJob() {
    navigate(`/mechanic/jobs/${jobId || job.id}/travel`);
  }

  function declineOffer() {
    navigate('/mechanic/jobs');
  }

  return (
    <div className="pb-4">
      <div className="mb-4">
        <h1 className="m-0 text-xl font-bold">New job offer</h1>
        <p className="mb-0 mt-1 text-xs text-[#aebbd0]">
          {jobId || job.id} · Battery · Request expires in 00:42
        </p>
      </div>

      <section className="mb-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-[#24364d] font-bold text-[#ffda45]">
          AR
        </span>
        <div>
          <strong className="block text-sm">{job.customer}</strong>
          <span className="text-xs text-[#aebbd0]">
            Customer · Verified mobile
          </span>
        </div>
      </section>

      <section className="mb-3 flex min-h-[56px] items-center gap-3 rounded-xl border border-[#34435b] bg-[#1c293d] px-3.5">
        <CarFront size={21} className="shrink-0 text-[#ffda45]" />
        <div className="min-w-0 flex-1">
          <strong className="block text-sm">{job.vehicle}</strong>
          <span className="mt-1 block text-xs text-[#aebbd0]">Silver · ABC 1234</span>
        </div>
        <ChevronDown size={17} className="text-[#aebbd0]" />
      </section>

      <section className="rounded-xl border border-[#34435b] bg-[#1c293d] p-3">
        <div className="flex items-center gap-3">
          <div className="relative grid h-[72px] w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-[#68746d] via-[#39443f] to-[#182436] text-[#ffda45]">
            <span className="absolute inset-x-2 top-4 h-1 rounded-full bg-[#9da69b]/60" />
            <span className="absolute inset-x-3 bottom-4 h-1 rounded-full bg-[#111827]/70" />
            <Wrench size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <strong className="block text-sm">{job.issue}</strong>
            <span className="mt-1 block text-xs leading-5 text-[#aebbd0]">
              Dashboard lights are dim. Parked on a safe shoulder.
            </span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-[#aebbd0]">
            <MapPin size={15} className="shrink-0" />
            <span className="truncate">{job.location}</span>
          </span>
          <strong className="shrink-0">{job.distance}</strong>
        </div>
      </section>

      <section className="mt-3 rounded-xl border border-[#34435b] bg-[#1c293d] p-3.5">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs">
          <span className="inline-flex items-center gap-2 text-[#aebbd0]">
            <MapPin size={15} /> Travel ETA
          </span>
          <strong>12 min</strong>
        </div>
        <div className="flex items-center justify-between gap-3 py-1.5 text-xs">
          <span className="text-[#aebbd0]">Customer visit estimate</span>
          <strong>₱450</strong>
        </div>
        <div className="flex items-center justify-between gap-3 py-1.5 text-xs">
          <span className="text-[#aebbd0]">Platform fee · 10%</span>
          <strong>₱45</strong>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3 border-t border-[#34435b] pt-2 text-xs">
          <span className="text-[#aebbd0]">Estimated visit earnings</span>
          <strong className="text-[#ffda45]">{formatPeso(job.estimate)}</strong>
        </div>
      </section>

      <p className="mb-0 mt-3 text-[10px] leading-4 text-[#aebbd0]">
        Repairs require a separate customer-approved quote.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={acceptJob}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ffda45] px-4 text-sm font-bold text-[#111827]"
        >
          <ArrowRight size={17} />
          Accept job
        </button>
        <button
          type="button"
          onClick={declineOffer}
          className="min-h-10 rounded-xl bg-[#1c293d] px-4 text-sm font-semibold text-white"
        >
          Decline offer
        </button>
      </div>
    </div>
  );
}
