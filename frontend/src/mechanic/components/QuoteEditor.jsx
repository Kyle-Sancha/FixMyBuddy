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
      <section className="rounded-xl border border-[#34435b] bg-[#1c293d] p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="m-0 text-sm font-semibold">Parts &amp; labor</h2>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex min-h-7 items-center gap-1 text-[10px] font-semibold text-[#ffda45]"
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
                className="grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-2 text-[10px]"
              >
                <button
                  type="button"
                  onClick={() => setEditingId(isEditing ? null : item.id)}
                  aria-label={isEditing ? 'Finish editing line' : `Edit ${item.label}`}
                  className="grid h-7 w-5 place-items-center text-[#aebbd0]"
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
                    className="min-h-7 min-w-0 rounded border border-[#34435b] bg-[#10192d] px-2 text-[10px] text-white outline-none focus:border-[#ffda45]"
                  />
                ) : (
                  <span className="min-w-0 text-[#aebbd0]">{item.label}</span>
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
                      className="w-[72px] rounded border border-[#34435b] bg-[#10192d] px-1.5 py-1 text-right text-[10px] text-white outline-none focus:border-[#ffda45]"
                    />
                  ) : (
                    <strong className="whitespace-nowrap">{formatPeso(item.amount)}</strong>
                  )}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.label || 'line item'}`}
                      className="grid h-7 w-6 place-items-center text-[#aebbd0]"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-2 space-y-1.5 border-t border-[#34435b] pt-2 text-[10px]">
          <div className="flex justify-between gap-3 text-[#aebbd0]">
            <span>Customer total</span>
            <strong className="text-[#ffda45]">{formatPeso(total)}</strong>
          </div>
          <div className="flex justify-between gap-3 text-[#aebbd0]">
            <span>Est. net after 10% fee</span>
            <strong className="text-white">{formatPeso(estimatedNet)}</strong>
          </div>
        </div>
      </section>

      <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[#34435b] bg-[#1c293d] px-2.5 text-[10px] text-[#aebbd0]">
        <Clock3 size={16} className="shrink-0 text-[#ffda45]" aria-hidden="true" />
        <span className="flex-1">Repair time estimate</span>
        <input
          value={timeEstimate}
          onChange={(event) => setTimeEstimate(event.target.value)}
          placeholder="30–40 minutes"
          className="w-28 bg-transparent text-right text-[10px] text-white outline-none placeholder:text-[#7f8da3]"
        />
      </label>

      <label className="block text-[10px] font-medium text-[#c4cede]">
        Warranty terms
        <span className="relative mt-1 block">
          <textarea
            value={warranty}
            onChange={(event) => setWarranty(event.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-[#34435b] bg-[#1c293d] p-2.5 pr-8 text-[10px] leading-4 text-white outline-none focus:border-[#ffda45]"
          />
          <Pencil size={13} className="pointer-events-none absolute right-2.5 top-2.5 text-[#aebbd0]" />
        </span>
      </label>

      <div className="rounded-lg bg-[#3b3420] px-2.5 py-2 text-[10px] leading-4 text-[#d7c98d]">
        <p className="m-0 inline-flex items-center gap-1.5 font-medium">
          <Clock3 size={13} className="text-[#ffda45]" />
          Approval status: {approvalStatus}. The customer sees itemized costs and can approve or decline.
        </p>
      </div>
      <p className="m-0 text-[10px] leading-4 text-[#aebbd0]">
        Work stays blocked until Alex approves. If declined, only the ₱450 diagnostic visit is due.
      </p>

      <button
        type="submit"
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#ffda45] px-4 text-[11px] font-bold text-[#111827] hover:bg-[#ffe16a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffda45]"
      >
        <Send size={17} aria-hidden="true" />
        {submitLabel}
      </button>
    </form>
  );
}
