import { Link } from 'react-router-dom';
import { CalendarDays, CarFront, MapPin, Wallet } from 'lucide-react';
import { MechanicHeader } from '../components/MechanicHeader';

const sampleJob = {
  id: 'FMB-1042',
  service: 'Incoming · Battery',
  customer: 'Alex Reyes',
  vehicle: 'Toyota Vios',
  description: 'Mabolo Road · Clicking, won’t start',
  location: 'Mabolo Barangay Hall',
  distance: '2.4 km',
  estimatedNet: 405,
  status: 'New offer',
};

export function Jobs() {
  return (
    <div>
      <MechanicHeader
        showBrand={false}
        title="Let’s get Naga moving."
        subtitle="Good morning, Miguel · Online · 15 km radius"
      />

      <section className="mb-2 overflow-hidden rounded-xl border border-[#34435b] bg-[#1c293d]">
        <div className="relative h-[108px] overflow-hidden bg-[#dce8e4] text-[#476777]">
          <svg
            aria-hidden="true"
            viewBox="0 0 600 220"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
          >
            <rect width="600" height="220" fill="#dce8e4" />
            <path d="M0 42h600M0 118h600M120 0v220M380 0v220" stroke="#c6d2ce" strokeWidth="28" />
            <path d="M0 42h600M0 118h600M120 0v220M380 0v220" stroke="#f8faf8" strokeWidth="19" />
            <path d="M-20 205C100 118 193 184 297 144s179-85 335-65" fill="none" stroke="#9fd1dc" strokeWidth="34" />
            <path d="M62 147 172 147 259 88 416 88 518 39" fill="none" stroke="#ffffff" strokeWidth="15" />
            <path d="M62 147 172 147 259 88 416 88 518 39" fill="none" stroke="#356ca0" strokeWidth="7" />
            <path d="M62 147 172 147 259 88 416 88 518 39" fill="none" stroke="#ffda45" strokeWidth="2" />
          </svg>
          <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded bg-[#10192d] px-2.5 py-1.5 text-[10px] font-semibold text-white">
            3 requests nearby
          </span>
          <span className="absolute right-2 top-2 text-[9px]">Panganiban Drive</span>
          <span className="absolute bottom-2 left-2 text-[9px]">Mabolo Road</span>
          <span className="absolute bottom-2 right-10 text-[9px]">Naga City</span>
          <span className="absolute bottom-2 right-2 text-[9px] italic">Naga River</span>
          <span className="absolute left-[20%] top-[54%] grid h-7 w-7 place-items-center rounded-full border-2 border-[#10192d] bg-[#ffda45] text-[#10192d]">
            <CarFront size={15} />
          </span>
          <span className="absolute right-[18%] top-[18%] grid h-7 w-7 place-items-center rounded-full border-2 border-[#10192d] bg-[#ffda45] text-[#10192d]">
            <MapPin size={15} />
          </span>
        </div>
      </section>

      <Link
        to={`/mechanic/jobs/${sampleJob.id}`}
        className="mb-4 block rounded-xl border border-[#6b5b2d] bg-[#39321e] p-3 text-inherit no-underline"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-sm font-semibold">Incoming · Battery</h2>
          <span className="text-[10px] font-semibold text-[#ffda45]">New offer</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-xs">
          <span className="inline-flex min-w-0 items-center gap-2 text-[#c4cede]">
            <CarFront size={16} className="shrink-0" />
            <span className="truncate">Alex Reyes · Toyota Vios</span>
          </span>
          <strong className="shrink-0">2.4 km</strong>
        </div>
        <p className="mb-3 mt-2 text-xs text-[#c4cede]">Mabolo Road · Clicking, won’t start</p>
        <span className="flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#ffda45] px-2 text-xs font-bold text-[#10192d]">
          Review job · ₱405 estimated net
        </span>
      </Link>

      <h2 className="mb-2 mt-4 text-sm font-semibold">Today so far</h2>
      <section className="mb-4 rounded-xl border border-[#34435b] bg-[#1c293d] p-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="inline-flex items-center gap-2 text-[#aebbd0]">
            <Wallet size={16} /> Gross earnings
          </span>
          <strong>₱0</strong>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-xs">
          <span className="text-[#aebbd0]">Completed jobs</span>
          <strong>0 · Fresh start</strong>
        </div>
      </section>

      <div className="mb-3 mt-6 flex items-center justify-between">
        <h2 className="m-0 text-sm font-semibold">Scheduled next</h2>
        <Link
          to="/mechanic/jobs"
          className="text-xs font-semibold text-[#ffda45]"
        >
          View schedule
        </Link>
      </div>

      <article className="flex items-center gap-3 rounded-xl border border-[#34435b] bg-[#1c293d] p-3">
        <CalendarDays
          size={19}
          className="shrink-0 text-[#aebbd0]"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <strong className="block text-xs font-medium">
            Alex · Battery check
          </strong>
          <span className="mt-1 block text-xs text-[#aebbd0]">
            9:00 AM · FMB-1051 · ₱450 visit
          </span>
        </div>
        <span className="shrink-0 text-xs text-[#aebbd0]">21 Oct</span>
      </article>
    </div>
  );
}
