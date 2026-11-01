import { useMemo, useState } from 'react';
import { Check, Clock3, Pencil, Plus, Send, Trash2 } from 'lucide-react';

const defaultItems = [
  { id: 'diagnosis', label: 'Call-out & diagnosis', amount: 450 },
  { id: 'battery', label: '12V battery · 1 × ₱3,500', amount: 3500 },
  { id: 'labor', label: 'Installation labor', amount: 450 },
  { id: 'fees', label: 'Customer / payment fees', amount: 0 },
];

function formatPeso(value) {
  return `₱${Number(value || 0).toLocaleString('en-PH')}`;
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `item-${Date.now()}`;
}

export function QuoteEditor({
  initialItems = defaultItems,
  approvalStatus = 'Not sent',
  repairTime = '',
  warrantyTerms = 'Battery: 12 months. Installation: 30 days. Covers defects and fitting faults.',
  onSubmit,
  submitLabel = 'Send for customer approval',
}) {
  const [items, setItems] = useState(() =>
    initialItems.map((item) => ({ ...item })),
  );
  const [editingId, setEditingId] = useState(null);
  const [timeEstimate, setTimeEstimate] = useState(repairTime);
  const [warranty, setWarranty] = useState(warrantyTerms);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [items],
  );

  const estimatedNet = Math.round(total * 0.9);

  function updateItem(id, field, value) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addItem() {
    const id = createId();
    setItems((current) => [...current, { id, label: '', amount: 0 }]);
    setEditingId(id);
  }

  function removeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit?.({
      items,
      total,
      estimatedNet,
      repairTime: timeEstimate,
      warrantyTerms: warranty,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <section className="rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="m-0 text-base font-semibold">Parts &amp; labor</h2>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex min-h-7 items-center gap-1 text-base font-semibold text-[rgb(var(--fmb-accent))]"
          >
            <Plus size={15} aria-hidden="true" />
            Add line
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {items.map((item) => {
            const isEditing = editingId === item.id;

            return (
              <div
                key={item.id}
                className="grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-2 text-base"
              >
                <button
                  type="button"
                  onClick={() => setEditingId(isEditing ? null : item.id)}
                  aria-label={isEditing ? 'Finish editing line' : `Edit ${item.label}`}
                  className="grid h-7 w-5 place-items-center text-[rgb(var(--fmb-muted))]"
                >
                  {isEditing ? <Check size={14} /> : <Pencil size={14} />}
                </button>

                {isEditing ? (
                  <input
                    aria-label="Line item description"
                    value={item.label}
                    onChange={(event) =>
                      updateItem(item.id, 'label', event.target.value)
                    }
                    placeholder="Describe work or part"
                    className="min-h-7 min-w-0 rounded border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-bg))] px-2 text-base text-[rgb(var(--fmb-text))] outline-none focus:border-[rgb(var(--fmb-accent))]"
                  />
                ) : (
                  <span className="min-w-0 text-[rgb(var(--fmb-muted))]">{item.label}</span>
                )}

                <div className="flex items-center gap-1.5">
                  {isEditing ? (
                    <input
                      aria-label="Line item amount in pesos"
                      type="number"
                      min="0"
                      step="1"
                      value={item.amount}
                      onChange={(event) =>
                        updateItem(item.id, 'amount', event.target.value)
                      }
                      className="w-[72px] rounded border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-bg))] px-1.5 py-1 text-right text-base text-[rgb(var(--fmb-text))] outline-none focus:border-[rgb(var(--fmb-accent))]"
                    />
                  ) : (
                    <strong className="whitespace-nowrap">{formatPeso(item.amount)}</strong>
                  )}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.label || 'line item'}`}
                      className="grid h-7 w-6 place-items-center text-[rgb(var(--fmb-muted))]"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-2 space-y-1.5 border-t border-[rgb(var(--fmb-border))] pt-2 text-base">
          <div className="flex justify-between gap-3 text-[rgb(var(--fmb-muted))]">
            <span>Customer total</span>
            <strong className="text-[rgb(var(--fmb-accent))]">{formatPeso(total)}</strong>
          </div>
          <div className="flex justify-between gap-3 text-[rgb(var(--fmb-muted))]">
            <span>Est. net after 10% fee</span>
            <strong className="text-[rgb(var(--fmb-text))]">{formatPeso(estimatedNet)}</strong>
          </div>
        </div>
      </section>

      <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] px-2.5 text-base text-[rgb(var(--fmb-muted))]">
        <Clock3 size={16} className="shrink-0 text-[rgb(var(--fmb-accent))]" aria-hidden="true" />
        <span className="flex-1">Repair time estimate</span>
        <input
          value={timeEstimate}
          onChange={(event) => setTimeEstimate(event.target.value)}
          placeholder="30–40 minutes"
          className="w-28 bg-transparent text-right text-base text-[rgb(var(--fmb-text))] outline-none placeholder:text-[rgb(var(--fmb-muted2))]"
        />
      </label>

      <label className="block text-base font-medium text-[rgb(var(--fmb-secondary))]">
        Warranty terms
        <span className="relative mt-1 block">
          <textarea
            value={warranty}
            onChange={(event) => setWarranty(event.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-2.5 pr-8 text-base leading-4 text-[rgb(var(--fmb-text))] outline-none focus:border-[rgb(var(--fmb-accent))]"
          />
          <Pencil size={13} className="pointer-events-none absolute right-2.5 top-2.5 text-[rgb(var(--fmb-muted))]" />
        </span>
      </label>

      <div className="rounded-lg bg-[rgb(var(--fmb-accent)/0.12)] px-2.5 py-2 text-base leading-4 text-[rgb(var(--fmb-secondary))]">
        <p className="m-0 inline-flex items-center gap-1.5 font-medium">
          <Clock3 size={13} className="text-[rgb(var(--fmb-accent))]" />
          Approval status: {approvalStatus}. The customer sees itemized costs and can approve or decline.
        </p>
      </div>
      <p className="m-0 text-base leading-4 text-[rgb(var(--fmb-muted))]">
        Work stays blocked until Alex approves. If declined, only the ₱450 diagnostic visit is due.
      </p>

      <button
        type="submit"
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[rgb(var(--fmb-accent))] px-4 text-base font-bold text-[rgb(var(--fmb-ink))] hover:bg-[rgb(var(--fmb-brand-hover))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--fmb-accent))]"
      >
        <Send size={17} aria-hidden="true" />
        {submitLabel}
      </button>
    </form>
  );
}
