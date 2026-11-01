import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, BriefcaseBusiness, Wallet } from 'lucide-react';
import { MechanicHeader } from '../components/MechanicHeader';

export function Welcome() {
  return (
    <div className="auth-root mechanic-public-shell">
      <div className="mechanic-public-page">
        <MechanicHeader />

      <section className="mt-4">
        <p className="mb-2 text-base font-semibold uppercase tracking-wide text-[rgb(var(--fmb-accent))]">
          Mechanic network
        </p>
        <h1 className="m-0 text-3xl font-bold leading-tight">
          Turn your skills into a helping hand.
        </h1>
        <p className="mb-0 mt-3 text-base leading-6 text-[rgb(var(--fmb-muted))]">
          Grow your roadside business with Pro. Help drivers get moving again.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-4">
        <p className="m-0 text-base font-semibold uppercase tracking-wide text-[rgb(var(--fmb-muted))]">
          Your roadside workspace
        </p>
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-[rgb(var(--fmb-selected))] p-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[rgb(var(--fmb-accent))] text-[rgb(var(--fmb-bg))]">
            <BriefcaseBusiness size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-base font-semibold text-[rgb(var(--fmb-accent))]">
              EXAMPLE JOB
            </p>
            <p className="mb-0 mt-1 text-base font-semibold">Battery check</p>
            <p className="mb-0 mt-1 text-base text-[rgb(var(--fmb-muted))]">
              Mabolo Road · Toyota Vios
            </p>
          </div>
          <strong className="shrink-0 text-base text-[rgb(var(--fmb-accent))]">₱405 net</strong>
        </div>
        <p className="mb-0 mt-4 text-base text-[rgb(var(--fmb-muted))]">
          Your availability. Your next opportunity.
        </p>
      </section>

      <ul className="mb-0 mt-6 flex list-none flex-col gap-4 p-0">
        <li className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[rgb(var(--fmb-panel))] text-[rgb(var(--fmb-accent))]">
            <BriefcaseBusiness size={19} />
          </span>
          <span>
            <strong className="block text-base">Find jobs close to you</strong>
            <small className="mt-1 block text-base text-[rgb(var(--fmb-muted))]">
              Choose when you work by setting your availability.
            </small>
          </span>
        </li>
        <li className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[rgb(var(--fmb-panel))] text-[rgb(var(--fmb-accent))]">
            <BadgeCheck size={19} />
          </span>
          <span>
            <strong className="block text-base">Get verified. Build trust.</strong>
            <small className="mt-1 block text-base text-[rgb(var(--fmb-muted))]">
              Add your ID and trade credentials.
            </small>
          </span>
        </li>
        <li className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[rgb(var(--fmb-panel))] text-[rgb(var(--fmb-accent))]">
            <Wallet size={19} />
          </span>
          <span>
            <strong className="block text-base">Your work. Your earnings.</strong>
            <small className="mt-1 block text-base text-[rgb(var(--fmb-muted))]">
              See estimated net pay and track every job.
            </small>
          </span>
        </li>
      </ul>

        <div className="mt-auto flex flex-col gap-3 pt-8">
        <Link
          to="/mechanic/signin"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[rgb(var(--fmb-accent))] px-4 text-base font-bold text-[rgb(var(--fmb-ink))]"
        >
          <ArrowRight size={18} />
          Get started as a mechanic
        </Link>
        <Link
          to="/mechanic/signin"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[rgb(var(--fmb-panel))] px-4 text-base font-semibold text-[rgb(var(--fmb-text))]"
        >
          Sign in to Pro
        </Link>
        </div>
      </div>
    </div>
  );
}
