import { CarFront, MapPin, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';

function formatPeso(value) {
  return `₱${Number(value || 0).toLocaleString('en-PH')}`;
}

function JobCardContent({ job }) {
  return (
    <>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#24364d] text-[#ffda45]">
          <CarFront size={19} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-sm font-semibold text-white">
              {job.service || 'Roadside assistance'}
            </strong>
            {job.status && (
              <span className="rounded-full bg-[#ffda45]/15 px-2.5 py-1 text-[10px] font-semibold text-[#ffda45]">
                {job.status}
              </span>
            )}
          </div>

          <p className="mb-0 mt-1 text-xs leading-5 text-[#aebbd0]">
            {job.customer || 'Customer'} · {job.vehicle || 'Vehicle details'}
          </p>
        </div>
      </div>

      {job.description && (
        <p className="mb-0 mt-3 text-xs leading-5 text-[#aebbd0]">
          {job.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#34435b] pt-3 text-xs">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[#aebbd0]">
          <MapPin size={15} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{job.location || 'Location pending'}</span>
          {job.distance && <span>· {job.distance}</span>}
        </span>

        {job.estimatedNet != null && (
          <strong className="shrink-0 text-[#ffda45]">
            {formatPeso(job.estimatedNet)} estimated net
          </strong>
        )}
      </div>

      {job.vehicleIssue && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#10192d] px-3 py-2 text-xs text-[#d8e0ec]">
          <Wrench size={15} className="shrink-0 text-[#ffda45]" aria-hidden="true" />
          <span>{job.vehicleIssue}</span>
        </div>
      )}
    </>
  );
}

export function JobCard({ job, to, onClick, className = '' }) {
  const cardClassName = [
    'block w-full rounded-xl border border-[#34435b] bg-[#1c293d] p-3.5 text-left transition-colors',
    'hover:border-[#ffda45]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffda45]',
    className,
  ].join(' ');

  if (to) {
    return (
      <Link to={to} className={cardClassName}>
        <JobCardContent job={job} />
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cardClassName}>
        <JobCardContent job={job} />
      </button>
    );
  }

  return (
    <article className={cardClassName}>
      <JobCardContent job={job} />
    </article>
  );
}