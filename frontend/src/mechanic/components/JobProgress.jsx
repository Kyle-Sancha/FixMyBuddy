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
      <div className="rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-3.5">
        <h2 className="m-0 text-base font-semibold">
          Customer-approved scope
        </h2>
        <p className="mb-0 mt-1 text-base leading-5 text-[rgb(var(--fmb-muted))]">
          Keep {customerName} updated as work moves forward.
        </p>
      </div>

      <ol className="m-0 flex list-none flex-col gap-1 rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-3.5">
        {steps.map((step) => {
          const isComplete = completed[step.id];
          const isCurrent = step.status === 'current' && !isComplete;

          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => toggleStep(step)}
                className="flex min-h-12 w-full items-center gap-3 rounded-lg px-1 text-left hover:bg-[rgb(var(--fmb-text)/0.05)]"
              >
                {isComplete ? (
                  <CircleCheck
                    size={19}
                    className="shrink-0 text-[rgb(var(--fmb-accent))]"
                    aria-hidden="true"
                  />
                ) : isCurrent ? (
                  <span className="grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full border-2 border-[rgb(var(--fmb-accent))]">
                    <span className="h-2 w-2 rounded-full bg-[rgb(var(--fmb-accent))]" />
                  </span>
                ) : (
                  <Circle
                    size={19}
                    className="shrink-0 text-[rgb(var(--fmb-muted))]"
                    aria-hidden="true"
                  />
                )}

                <span
                  className={[
                    'flex-1 text-base leading-5',
                    isComplete || isCurrent ? 'text-[rgb(var(--fmb-text))]' : 'text-[rgb(var(--fmb-muted))]',
                  ].join(' ')}
                >
                  {step.label}
                </span>

                {isComplete && (
                  <Check
                    size={15}
                    className="text-[rgb(var(--fmb-accent))]"
                    aria-hidden="true"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex items-start gap-2 rounded-lg bg-[rgb(var(--fmb-panel))] px-3 py-3 text-base leading-5 text-[rgb(var(--fmb-muted))]">
        <ShieldCheck
          size={17}
          className="mt-0.5 shrink-0 text-[rgb(var(--fmb-success))]"
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