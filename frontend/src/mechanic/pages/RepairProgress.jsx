import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Check,
  CircleDollarSign,
  MessageCircle,
  Pencil,
} from 'lucide-react';
import { JobProgress } from '../components/JobProgress';

export function RepairProgress() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [customerUpdate, setCustomerUpdate] = useState(
    'New battery fitted. Charging voltage 14.2V. Running final start test.',
  );
  const [photoCount, setPhotoCount] = useState(2);
  const [saved, setSaved] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSaved(true);
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
          <h1 className="m-0 text-xl font-bold">Keep Alex in the loop</h1>
          <p className="mb-0 mt-1 text-xs text-[#aebbd0]">
            {jobId || 'FMB-1042'} · In progress · Finish by 10:35 AM
          </p>
        </div>
      </div>

      <section className="mb-4 rounded-xl border border-[#34435b] bg-[#1c293d] p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-sm font-semibold">
              Customer-approved scope
            </h2>
            <p className="mb-0 mt-1 text-xs leading-5 text-[#aebbd0]">
              Battery + installation · Terminal extra approved
            </p>
          </div>
          <strong className="shrink-0 text-sm text-[#ffda45]">₱4,600</strong>
        </div>
      </section>

      <JobProgress
        customerName="Alex"
        steps={[
          { id: 'quote', label: 'Quote approved · 9:56', status: 'done' },
          { id: 'battery', label: 'Battery installed', status: 'done' },
          { id: 'terminal', label: 'Terminal fitted · Extra approved', status: 'done' },
          { id: 'test', label: 'Final voltage and starting test', status: 'current' },
          { id: 'handover', label: 'Customer handover', status: 'upcoming' },
        ]}
      />

      <button
        type="button"
        onClick={() => navigate(`/mechanic/jobs/${jobId || 'FMB-1042'}/additional-work`)}
        className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#34435b] bg-[#1c293d] px-3 text-xs font-semibold text-[#ffda45]"
      >
        <CircleDollarSign size={16} />
        Request additional work
      </button>

      <form
        onSubmit={handleSubmit}
        className="mt-5 rounded-xl border border-[#34435b] bg-[#1c293d] p-3.5"
      >
        <label className="block text-sm font-semibold">
          Customer update
          <span className="relative mt-3 block">
            <textarea
              value={customerUpdate}
              onChange={(event) => {
                setCustomerUpdate(event.target.value);
                setSaved(false);
              }}
              rows={3}
              className="w-full resize-y rounded-lg border border-[#34435b] bg-[#10192d] p-3 pr-9 text-xs leading-5 text-white outline-none focus:border-[#ffda45]"
            />
            <Pencil
              size={15}
              className="pointer-events-none absolute right-3 top-3 text-[#aebbd0]"
            />
          </span>
        </label>

        <button
          type="submit"
          className="mt-2 inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-[#ffda45]"
        >
          <MessageCircle size={16} />
          {saved ? 'Update saved' : 'Save customer update'}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-2 text-[#aebbd0]">
          <Camera size={16} className="text-[#ffda45]" />
          Repair photos
        </span>
        <label className="cursor-pointer font-semibold text-[#ffda45]">
          {photoCount} added · Add more
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

      <button
        type="button"
        onClick={() => navigate(`/mechanic/jobs/${jobId || 'FMB-1042'}/handover`)}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ffda45] px-4 text-sm font-bold text-[#111827]"
      >
        <Check size={18} />
        Mark repair complete
      </button>
    </div>
  );
}
