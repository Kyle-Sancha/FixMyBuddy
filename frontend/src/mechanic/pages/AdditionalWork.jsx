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
        <p className="mb-0 mt-1 text-xs text-[#aebbd0]">
          {jobId || 'FMB-1042'} · Extra request sent · 10:05 AM
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-[#3b3420] px-3 py-2.5 text-[10px] leading-4 text-[#d7c98d]">
        <Pause size={14} className="mt-0.5 shrink-0 text-[#ffda45]" />
        <p className="m-0">
          Waiting for approval. Do not start the extra work or add it to the bill yet.
        </p>
      </div>

      <label className="mt-3 block text-[10px] font-medium text-[#c4cede]">
        Reason for extra work
        <span className="relative mt-1 block">
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-[#34435b] bg-[#1c293d] p-2.5 pr-8 text-[10px] leading-4 text-white outline-none focus:border-[#ffda45]"
          />
          <Pencil size={13} className="pointer-events-none absolute right-2.5 top-2.5 text-[#aebbd0]" />
        </span>
      </label>

      <section className="mt-3 flex items-center gap-3">
        <div className="relative grid h-[60px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-[#9a8970] via-[#454b43] to-[#182436] text-[#ffda45]">
          <span className="absolute inset-x-2 top-3 h-2 rounded bg-[#9e3426]/80" />
          <span className="absolute inset-x-3 bottom-3 h-1 rounded bg-[#111827]/70" />
          <Camera size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <strong className="block text-[10px] font-semibold">Terminal close-up</strong>
          <span className="mt-1 block text-[9px] text-[#aebbd0]">
            {photoCount} photo attached · Add more
          </span>
        </div>
        <label className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-[#34435b] bg-[#1c293d] text-[#ffda45]">
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

      <section className="mt-3 rounded-xl border border-[#34435b] bg-[#1c293d] p-2.5">
        <dl className="mb-0 flex flex-col gap-2 text-[9px]">
          <div className="flex justify-between gap-3 text-[#aebbd0]">
            <dt>Original approved scope</dt>
            <dd className="m-0 font-semibold text-white">{formatPeso(4400)}</dd>
          </div>
          <div className="flex justify-between gap-3 text-[#aebbd0]">
            <dt>Terminal part + fitting</dt>
            <dd className="m-0 font-semibold text-white">₱150 + ₱50</dd>
          </div>
          <div className="flex justify-between gap-3 text-[#aebbd0]">
            <dt>Incremental cost</dt>
            <dd className="m-0 font-semibold text-[#ffda45]">{formatPeso(200)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-[#34435b] pt-2 text-[#aebbd0]">
            <dt>Proposed revised total</dt>
            <dd className="m-0 font-bold text-[#ffda45]">{formatPeso(4600)}</dd>
          </div>
        </dl>
      </section>

      <p className="mb-0 mt-3 text-[9px] leading-4 text-[#aebbd0]">
        Send the request again only if details change. A decline keeps the approved total at ₱4,400.
      </p>

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          disabled
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#34435b] bg-[#1c293d] px-3 text-[10px] font-semibold text-white"
        >
          <Clock3 size={15} />
          Request sent · Waiting for Alex
        </button>
        <button
          type="button"
          onClick={() => navigate(`/mechanic/jobs/${jobId || 'FMB-1042'}/progress`)}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg text-[10px] font-semibold text-[#ffda45]"
        >
          <Send size={14} />
          Back to repair progress
        </button>
      </div>
    </div>
  );
}
