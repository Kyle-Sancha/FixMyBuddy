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
      <header className="mb-5">
        <h1 className="m-0 text-xl font-bold">Provider account</h1>
        <p className="mb-0 mt-1 text-xs text-[#aebbd0]">
          Manage your profile and work preferences.
        </p>
      </header>

      <section className="flex items-center gap-3 rounded-xl border border-[#34435b] bg-[#1c293d] p-3.5">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#24364d] font-bold text-[#ffda45]">
          MS
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-sm">Miguel Santos</strong>
          <small className="mt-1 block text-xs text-[#aebbd0]">
            Provider · Verified mobile
          </small>
        </span>
        <ShieldCheck size={19} className="text-[#80dfc6]" />
      </section>

      <div className="mb-3 mt-6 flex items-center justify-between">
        <h2 className="m-0 text-sm font-semibold">Account settings</h2>
        <Link
          to="/mechanic/availability"
          className="text-xs font-semibold text-[#ffda45]"
        >
          Edit availability
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-[#34435b] bg-[#1c293d]">
        {accountLinks.map(({ title, detail, icon: Icon }, index) => (
          <button
            key={title}
            type="button"
            className={[
              'flex min-h-[68px] w-full items-center gap-3 px-3.5 text-left hover:bg-white/5',
              index < accountLinks.length - 1 ? 'border-b border-[#34435b]' : '',
            ].join(' ')}
          >
            <Icon size={18} className="shrink-0 text-[#ffda45]" />
            <span className="min-w-0 flex-1">
              <strong className="block text-xs font-semibold">{title}</strong>
              <small className="mt-1 block text-xs text-[#aebbd0]">
                {detail}
              </small>
            </span>
            <ChevronRight size={17} className="text-[#aebbd0]" />
          </button>
        ))}
      </section>

      <div className="mt-4 rounded-xl bg-[#1c293d] p-3.5 text-xs leading-5 text-[#aebbd0]">
        <p className="m-0">
          Provider verification helps customers trust who is responding to
          their roadside request.
        </p>
      </div>

      <Link
        to="/mechanic"
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#34435b] bg-[#1c293d] text-sm font-semibold text-white"
      >
        Sign out
      </Link>
    </div>
  );
}