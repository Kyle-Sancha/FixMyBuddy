import { CarFront, MapPin, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';

function formatPeso(value) {
  return `₱${Number(value || 0).toLocaleString('en-PH')}`;
}

function JobCardContent({ job }) {
  return (
    <>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[rgb(var(--fmb-selected))] text-[rgb(var(--fmb-accent))]">
          <CarFront size={19} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-base font-semibold text-[rgb(var(--fmb-text))]">
              {job.service || 'Roadside assistance'}
            </strong>
            {job.status && (
              <span className="rounded-full bg-[rgb(var(--fmb-accent)/0.15)] px-2.5 py-1 text-base font-semibold text-[rgb(var(--fmb-accent))]">
                {job.status}
              </span>
            )}
          </div>

          <p className="mb-0 mt-1 text-base leading-5 text-[rgb(var(--fmb-muted))]">
            {job.customer || 'Customer'} · {job.vehicle || 'Vehicle details'}
          </p>
        </div>
      </div>

      {job.description && (
        <p className="mb-0 mt-3 text-base leading-5 text-[rgb(var(--fmb-muted))]">
          {job.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[rgb(var(--fmb-border))] pt-3 text-base">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[rgb(var(--fmb-muted))]">
          <MapPin size={15} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{job.location || 'Location pending'}</span>
          {job.distance && <span>· {job.distance}</span>}
        </span>

        {job.estimatedNet != null && (
          <strong className="shrink-0 text-[rgb(var(--fmb-accent))]">
            {formatPeso(job.estimatedNet)} estimated net
          </strong>
        )}
      </div>

      {job.vehicleIssue && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-[rgb(var(--fmb-bg))] px-3 py-2 text-base text-[rgb(var(--fmb-secondary))]">
          <Wrench size={15} className="shrink-0 text-[rgb(var(--fmb-accent))]" aria-hidden="true" />
          <span>{job.vehicleIssue}</span>
        </div>
      )}
    </>
  );
}

export function JobCard({ job, to, onClick, className = '' }) {
  const cardClassName = [
    'block w-full rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-3.5 text-left transition-colors',
    'hover:border-[rgb(var(--fmb-accent)/0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--fmb-accent))]',
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