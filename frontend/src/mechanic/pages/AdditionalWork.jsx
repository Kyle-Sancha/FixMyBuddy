import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Camera,
  Clock3,
  Pause,
  Pencil,
  Plus,
  Send,
} from 'lucide-react';

function formatPeso(value) {
  return `₱${Number(value).toLocaleString('en-PH')}`;
}

export function AdditionalWork() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [reason, setReason] = useState(
    'Battery terminal is corroded and brittle. Replacement will improve connection reliability.',
  );
  const [photoCount, setPhotoCount] = useState(1);

  return (
    <div className="pb-4">
      <div className="mb-4">
        <h1 className="m-0 text-xl font-bold">Request additional work</h1>
        <p className="mb-0 mt-1 text-base text-[rgb(var(--fmb-muted))]">
          {jobId || 'FMB-1042'} · Extra request sent · 10:05 AM
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-[rgb(var(--fmb-accent)/0.12)] px-3 py-2.5 text-base leading-4 text-[rgb(var(--fmb-secondary))]">
        <Pause size={14} className="mt-0.5 shrink-0 text-[rgb(var(--fmb-accent))]" />
        <p className="m-0">
          Waiting for approval. Do not start the extra work or add it to the bill yet.
        </p>
      </div>

      <label className="mt-3 block text-base font-medium text-[rgb(var(--fmb-secondary))]">
        Reason for extra work
        <span className="relative mt-1 block">
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-2.5 pr-8 text-base leading-4 text-[rgb(var(--fmb-text))] outline-none focus:border-[rgb(var(--fmb-accent))]"
          />
          <Pencil size={13} className="pointer-events-none absolute right-2.5 top-2.5 text-[rgb(var(--fmb-muted))]" />
        </span>
      </label>

      <section className="mt-3 flex items-center gap-3">
        <div className="relative grid h-[60px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-[#9a8970] via-[#454b43] to-[#182436] text-[rgb(var(--fmb-accent))]">
          <span className="absolute inset-x-2 top-3 h-2 rounded bg-[#9e3426]/80" />
          <span className="absolute inset-x-3 bottom-3 h-1 rounded bg-[rgb(var(--fmb-ink)/0.7)]" />
          <Camera size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <strong className="block text-base font-semibold">Terminal close-up</strong>
          <span className="mt-1 block text-base text-[rgb(var(--fmb-muted))]">
            {photoCount} photo attached · Add more
          </span>
        </div>
        <label className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] text-[rgb(var(--fmb-accent))]">
          <Plus size={16} />
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              setPhotoCount((count) => count + (event.target.files?.length || 0));
              event.target.value = '';
            }}
          />
        </label>
      </section>

      <section className="mt-3 rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-2.5">
        <dl className="mb-0 flex flex-col gap-2 text-base">
          <div className="flex justify-between gap-3 text-[rgb(var(--fmb-muted))]">
            <dt>Original approved scope</dt>
            <dd className="m-0 font-semibold text-[rgb(var(--fmb-text))]">{formatPeso(4400)}</dd>
          </div>
          <div className="flex justify-between gap-3 text-[rgb(var(--fmb-muted))]">
            <dt>Terminal part + fitting</dt>
            <dd className="m-0 font-semibold text-[rgb(var(--fmb-text))]">₱150 + ₱50</dd>
          </div>
          <div className="flex justify-between gap-3 text-[rgb(var(--fmb-muted))]">
            <dt>Incremental cost</dt>
            <dd className="m-0 font-semibold text-[rgb(var(--fmb-accent))]">{formatPeso(200)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-[rgb(var(--fmb-border))] pt-2 text-[rgb(var(--fmb-muted))]">
            <dt>Proposed revised total</dt>
            <dd className="m-0 font-bold text-[rgb(var(--fmb-accent))]">{formatPeso(4600)}</dd>
          </div>
        </dl>
      </section>

      <p className="mb-0 mt-3 text-base leading-4 text-[rgb(var(--fmb-muted))]">
        Send the request again only if details change. A decline keeps the approved total at ₱4,400.
      </p>

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          disabled
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] px-3 text-base font-semibold text-[rgb(var(--fmb-text))]"
        >
          <Clock3 size={15} />
          Request sent · Waiting for Alex
        </button>
        <button
          type="button"
          onClick={() => navigate(`/mechanic/jobs/${jobId || 'FMB-1042'}/progress`)}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg text-base font-semibold text-[rgb(var(--fmb-accent))]"
        >
          <Send size={14} />
          Back to repair progress
        </button>
      </div>
    </div>
  );
}
