import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Check,
  FileText,
  ImagePlus,
  Pencil,
} from 'lucide-react';

const initialChecklist = [
  'Battery voltage & load test recorded',
  'Alternator output checked',
  'Cables and terminal inspected',
  'Findings explained to customer',
];

export function Diagnosis() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [findings, setFindings] = useState(
    'Battery reads 10.6V and fails load test. Replace the 12V battery. Charging system is healthy.',
  );
  const [checkedItems, setCheckedItems] = useState(initialChecklist);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');

  function toggleItem(item) {
    setCheckedItems((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item],
    );
  }

  function addPhotos(event) {
    const selectedFiles = Array.from(event.target.files || []);
    setPhotos((current) => [...current, ...selectedFiles]);
    event.target.value = '';
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!findings.trim()) {
      setError('Add diagnosis findings before creating a quote.');
      return;
    }

    if (checkedItems.length !== initialChecklist.length) {
      setError('Complete the service checklist before continuing.');
      return;
    }

    navigate(`/mechanic/jobs/${jobId || 'FMB-1042'}/quote`);
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
          <h1 className="m-0 text-xl font-bold">Record your diagnosis</h1>
          <p className="mb-0 mt-1 text-base text-[rgb(var(--fmb-muted))]">
            {jobId || 'FMB-1042'} · Battery · Toyota Vios
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="block text-base font-semibold">
          Findings
          <span className="relative mt-2 block">
            <textarea
              value={findings}
              onChange={(event) => {
                setFindings(event.target.value);
                setError('');
              }}
              rows={4}
              className="w-full resize-y rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-3 pr-10 text-base leading-5 text-[rgb(var(--fmb-text))] outline-none focus:border-[rgb(var(--fmb-accent))]"
            />
            <Pencil
              size={16}
              className="pointer-events-none absolute right-3 top-3 text-[rgb(var(--fmb-muted))]"
              aria-hidden="true"
            />
          </span>
        </label>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="m-0 text-base font-semibold">Diagnostic photos</h2>
            <span className="text-base text-[rgb(var(--fmb-accent))]">
              {photos.length} attached
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {photos.slice(0, 2).map((photo, index) => (
              <div
                key={`${photo.name}-${index}`}
                className="flex min-h-20 items-center justify-center rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-2 text-center text-base text-[rgb(var(--fmb-muted))]"
              >
                <span className="line-clamp-3">{photo.name}</span>
              </div>
            ))}

            <label className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] text-[rgb(var(--fmb-muted))] hover:border-[rgb(var(--fmb-accent))] hover:text-[rgb(var(--fmb-accent))]">
              <ImagePlus size={20} />
              <span className="text-base">Add photo</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={addPhotos}
                className="sr-only"
              />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-3.5">
          <h2 className="m-0 text-base font-semibold">Service checklist</h2>
          <ul className="mb-0 mt-3 flex list-none flex-col gap-3 p-0">
            {initialChecklist.map((item) => (
              <li key={item}>
                <label className="flex min-h-8 items-center gap-3 text-base leading-5 text-[rgb(var(--fmb-secondary))]">
                  <input
                    type="checkbox"
                    checked={checkedItems.includes(item)}
                    onChange={() => toggleItem(item)}
                    className="h-4 w-4 accent-[rgb(var(--fmb-accent))]"
                  />
                  <span>{item}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex items-start gap-2 rounded-lg bg-[rgb(var(--fmb-panel))] px-3 py-3 text-base leading-5 text-[rgb(var(--fmb-muted))]">
          <FileText
            size={17}
            className="mt-0.5 shrink-0 text-[rgb(var(--fmb-success))]"
            aria-hidden="true"
          />
          <p className="m-0">
            Diagnosis does not authorize repairs. Send a quote and wait for
            customer approval.
          </p>
        </div>

        {error && (
          <p role="alert" className="m-0 text-base text-[rgb(var(--fmb-error))]">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[rgb(var(--fmb-accent))] px-4 text-base font-bold text-[rgb(var(--fmb-ink))]"
        >
          <Check size={18} />
          Create repair quote
        </button>
      </form>
    </div>
  );
}