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
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1c293d] text-[#ffda45]"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="m-0 text-xl font-bold">Record your diagnosis</h1>
          <p className="mb-0 mt-1 text-xs text-[#aebbd0]">
            {jobId || 'FMB-1042'} · Battery · Toyota Vios
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="block text-xs font-semibold">
          Findings
          <span className="relative mt-2 block">
            <textarea
              value={findings}
              onChange={(event) => {
                setFindings(event.target.value);
                setError('');
              }}
              rows={4}
              className="w-full resize-y rounded-xl border border-[#34435b] bg-[#1c293d] p-3 pr-10 text-xs leading-5 text-white outline-none focus:border-[#ffda45]"
            />
            <Pencil
              size={16}
              className="pointer-events-none absolute right-3 top-3 text-[#aebbd0]"
              aria-hidden="true"
            />
          </span>
        </label>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="m-0 text-sm font-semibold">Diagnostic photos</h2>
            <span className="text-xs text-[#ffda45]">
              {photos.length} attached
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {photos.slice(0, 2).map((photo, index) => (
              <div
                key={`${photo.name}-${index}`}
                className="flex min-h-20 items-center justify-center rounded-xl border border-[#34435b] bg-[#1c293d] p-2 text-center text-[10px] text-[#aebbd0]"
              >
                <span className="line-clamp-3">{photo.name}</span>
              </div>
            ))}

            <label className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#34435b] bg-[#1c293d] text-[#aebbd0] hover:border-[#ffda45] hover:text-[#ffda45]">
              <ImagePlus size={20} />
              <span className="text-[10px]">Add photo</span>
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

        <section className="rounded-xl border border-[#34435b] bg-[#1c293d] p-3.5">
          <h2 className="m-0 text-sm font-semibold">Service checklist</h2>
          <ul className="mb-0 mt-3 flex list-none flex-col gap-3 p-0">
            {initialChecklist.map((item) => (
              <li key={item}>
                <label className="flex min-h-8 items-center gap-3 text-xs leading-5 text-[#c4cede]">
                  <input
                    type="checkbox"
                    checked={checkedItems.includes(item)}
                    onChange={() => toggleItem(item)}
                    className="h-4 w-4 accent-[#ffda45]"
                  />
                  <span>{item}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex items-start gap-2 rounded-lg bg-[#1c293d] px-3 py-3 text-xs leading-5 text-[#aebbd0]">
          <FileText
            size={17}
            className="mt-0.5 shrink-0 text-[#80dfc6]"
            aria-hidden="true"
          />
          <p className="m-0">
            Diagnosis does not authorize repairs. Send a quote and wait for
            customer approval.
          </p>
        </div>

        {error && (
          <p role="alert" className="m-0 text-xs text-[#ff9b8f]">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ffda45] px-4 text-sm font-bold text-[#111827]"
        >
          <Check size={18} />
          Create repair quote
        </button>
      </form>
    </div>
  );
}