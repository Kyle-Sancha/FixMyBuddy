import { Check, Circle, CircleCheck, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const defaultSteps = [
  { id: 'diagnosis', label: 'Diagnosis recorded', status: 'done' },
  { id: 'approval', label: 'Customer approved quote', status: 'done' },
  { id: 'repair', label: 'Repair in progress', status: 'current' },
  { id: 'handover', label: 'Customer handover', status: 'upcoming' },
];

export function JobProgress({
  steps = defaultSteps,
  customerName = 'Customer',
  onStepChange,
}) {
  const [completed, setCompleted] = useState(() =>
    steps.reduce((result, step) => {
      result[step.id] = step.status === 'done';
      return result;
    }, {}),
  );

  function toggleStep(step) {
    const nextValue = !completed[step.id];
    setCompleted((current) => ({ ...current, [step.id]: nextValue }));
    onStepChange?.({ ...step, completed: nextValue });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-xl border border-[#34435b] bg-[#1c293d] p-3.5">
        <h2 className="m-0 text-sm font-semibold">
          Customer-approved scope
        </h2>
        <p className="mb-0 mt-1 text-xs leading-5 text-[#aebbd0]">
          Keep {customerName} updated as work moves forward.
        </p>
      </div>

      <ol className="m-0 flex list-none flex-col gap-1 rounded-xl border border-[#34435b] bg-[#1c293d] p-3.5">
        {steps.map((step) => {
          const isComplete = completed[step.id];
          const isCurrent = step.status === 'current' && !isComplete;

          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => toggleStep(step)}
                className="flex min-h-12 w-full items-center gap-3 rounded-lg px-1 text-left hover:bg-white/5"
              >
                {isComplete ? (
                  <CircleCheck
                    size={19}
                    className="shrink-0 text-[#ffda45]"
                    aria-hidden="true"
                  />
                ) : isCurrent ? (
                  <span className="grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full border-2 border-[#ffda45]">
                    <span className="h-2 w-2 rounded-full bg-[#ffda45]" />
                  </span>
                ) : (
                  <Circle
                    size={19}
                    className="shrink-0 text-[#708099]"
                    aria-hidden="true"
                  />
                )}

                <span
                  className={[
                    'flex-1 text-xs leading-5',
                    isComplete || isCurrent ? 'text-white' : 'text-[#aebbd0]',
                  ].join(' ')}
                >
                  {step.label}
                </span>

                {isComplete && (
                  <Check
                    size={15}
                    className="text-[#ffda45]"
                    aria-hidden="true"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex items-start gap-2 rounded-lg bg-[#1c293d] px-3 py-3 text-xs leading-5 text-[#aebbd0]">
        <ShieldCheck
          size={17}
          className="mt-0.5 shrink-0 text-[#80dfc6]"
          aria-hidden="true"
        />
        <p className="m-0">
          Only perform work included in the customer-approved quote. Request
          approval before adding extra work.
        </p>
      </div>
    </section>
  );
}