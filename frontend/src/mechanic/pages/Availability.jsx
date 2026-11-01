import { useState } from 'react';
import { Clock3, MapPin, ShieldCheck, Truck } from 'lucide-react';
import { MechanicHeader } from '../components/MechanicHeader';

const serviceOptions = [
  'Battery',
  'Flat tire',
  'Overheating',
  'Fuel delivery',
  'Lockout',
  'Not starting',
  'Towing',
];

export function Availability() {
  const [isOnline, setIsOnline] = useState(true);
  const [services, setServices] = useState([
    'Battery',
    'Flat tire',
    'Overheating',
    'Not starting',
  ]);
  const [saved, setSaved] = useState(false);

  function toggleService(service) {
    setServices((current) =>
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service],
    );
    setSaved(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSaved(true);
  }

  return (
    <div>
      <MechanicHeader
        showBrand={false}
        title="Ready when they need you"
        subtitle="Your provider profile & availability"
      />

      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-[#24364d] font-bold text-[#ffda45]">
          MS
        </span>
        <div>
          <strong className="block text-sm">Miguel Santos</strong>
          <span className="text-xs text-[#aebbd0]">
            TESDA NC II · Identity verified
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => {
            setIsOnline((value) => !value);
            setSaved(false);
          }}
          aria-pressed={isOnline}
          className="flex min-h-[68px] items-center justify-between rounded-xl border border-[#34435b] bg-[#1c293d] px-3.5 text-left"
        >
          <span>
            <strong className="block text-sm">
              {isOnline ? 'You’re online' : 'You’re offline'}
            </strong>
            <small className="mt-1 block text-xs text-[#80dfc6]">
              {isOnline ? 'Receiving new job offers' : 'Not receiving offers'}
            </small>
          </span>
          <span
            className={[
              'flex h-7 w-12 items-center rounded-full p-1 transition-colors',
              isOnline ? 'bg-[#ffda45]' : 'bg-[#45536a]',
            ].join(' ')}
          >
            <span
              className={[
                'h-5 w-5 rounded-full bg-[#10192d] transition-transform',
                isOnline ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </span>
        </button>

        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-3 text-sm font-semibold">
            Your service capabilities
          </legend>
          <div className="flex flex-wrap gap-2">
            {serviceOptions.map((service) => {
              const selected = services.includes(service);
              return (
                <button
                  key={service}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleService(service)}
                  className={[
                    'min-h-9 rounded-full border px-3 text-xs transition-colors',
                    selected
                      ? 'border-[#ffda45] bg-[#ffda45]/15 text-[#ffda45]'
                      : 'border-[#34435b] bg-[#1c293d] text-[#aebbd0]',
                  ].join(' ')}
                >
                  {service}
                </button>
              );
            })}
          </div>
        </fieldset>

        <section className="flex flex-col gap-3 rounded-xl border border-[#34435b] bg-[#1c293d] p-3.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-[#aebbd0]">
              <MapPin size={16} /> Service radius
            </span>
            <strong>15 km</strong>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-[#aebbd0]">
              <Clock3 size={16} /> Working hours
            </span>
            <strong>Mon–Sat · 8–6</strong>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-[#aebbd0]">
              <Truck size={16} /> Flatbed capability
            </span>
            <strong>FMB-08</strong>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-[#aebbd0]">
              <ShieldCheck size={16} /> Credentials
            </span>
            <button
              type="button"
              className="font-semibold text-[#ffda45]"
              onClick={() => window.alert('Credential upload will be connected later.')}
            >
              View / upload
            </button>
          </div>
        </section>

        {saved && (
          <p role="status" className="m-0 text-xs text-[#80dfc6]">
            Availability saved.
          </p>
        )}

        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ffda45] px-4 text-sm font-bold text-[#111827]"
        >
          <ShieldCheck size={18} />
          Save availability
        </button>
      </form>
    </div>
  );
}
