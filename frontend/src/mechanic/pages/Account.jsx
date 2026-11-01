import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  ChevronRight,
  Clock3,
  FileText,
  MapPin,
  ShieldCheck,
  Truck,
  UserRound,
} from 'lucide-react';
import { MechanicHeader } from '../components/MechanicHeader';

const accountLinks = [
  {
    title: 'Provider profile',
    detail: 'Name, mobile and identity',
    icon: UserRound,
  },
  {
    title: 'Credentials',
    detail: 'TESDA / trade documents',
    icon: BadgeCheck,
  },
  {
    title: 'Service area',
    detail: '15 km radius',
    icon: MapPin,
  },
  {
    title: 'Working hours',
    detail: 'Mon–Sat · 8 AM–6 PM',
    icon: Clock3,
  },
  {
    title: 'Vehicle capability',
    detail: 'Flatbed · FMB-08',
    icon: Truck,
  },
  {
    title: 'Terms and privacy',
    detail: 'Provider documents',
    icon: FileText,
  },
];

export function Account() {
  return (
    <div className="pb-4">
      <MechanicHeader showBrand={false} title="Provider account" subtitle="Manage your profile and work preferences." />

      <section className="flex items-center gap-3 rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-3.5">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[rgb(var(--fmb-selected))] font-bold text-[rgb(var(--fmb-accent))]">
          MS
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-base">Miguel Santos</strong>
          <small className="mt-1 block text-base text-[rgb(var(--fmb-muted))]">
            Provider · Verified mobile
          </small>
        </span>
        <ShieldCheck size={19} className="text-[rgb(var(--fmb-success))]" />
      </section>

      <div className="mb-3 mt-6 flex items-center justify-between">
        <h2 className="m-0 text-base font-semibold">Account settings</h2>
        <Link
          to="/mechanic/availability"
          className="text-base font-semibold text-[rgb(var(--fmb-accent))]"
        >
          Edit availability
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))]">
        {accountLinks.map(({ title, detail, icon: Icon }, index) => (
          <button
            key={title}
            type="button"
            className={[
              'flex min-h-[68px] w-full items-center gap-3 px-3.5 text-left hover:bg-[rgb(var(--fmb-text)/0.05)]',
              index < accountLinks.length - 1 ? 'border-b border-[rgb(var(--fmb-border))]' : '',
            ].join(' ')}
          >
            <Icon size={18} className="shrink-0 text-[rgb(var(--fmb-accent))]" />
            <span className="min-w-0 flex-1">
              <strong className="block text-base font-semibold">{title}</strong>
              <small className="mt-1 block text-base text-[rgb(var(--fmb-muted))]">
                {detail}
              </small>
            </span>
            <ChevronRight size={17} className="text-[rgb(var(--fmb-muted))]" />
          </button>
        ))}
      </section>

      <div className="mt-4 rounded-xl bg-[rgb(var(--fmb-panel))] p-3.5 text-base leading-5 text-[rgb(var(--fmb-muted))]">
        <p className="m-0">
          Provider verification helps customers trust who is responding to
          their roadside request.
        </p>
      </div>

      <Link
        to="/mechanic"
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] text-base font-semibold text-[rgb(var(--fmb-text))]"
      >
        Sign out
      </Link>
    </div>
  );
}