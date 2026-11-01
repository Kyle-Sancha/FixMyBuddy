import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, BriefcaseBusiness, Wallet } from 'lucide-react';
import { MechanicHeader } from '../components/MechanicHeader';

export function Welcome() {
  return (
    <div className="mechanic-public-shell">
      <div className="mechanic-public-page">
        <MechanicHeader />

      <section className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#ffda45]">
          Mechanic network
        </p>
        <h1 className="m-0 text-3xl font-bold leading-tight">
          Turn your skills into a helping hand.
        </h1>
        <p className="mb-0 mt-3 text-sm leading-6 text-[#aebbd0]">
          Grow your roadside business with Pro. Help drivers get moving again.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-[#34435b] bg-[#1c293d] p-4">
        <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#aebbd0]">
          Your roadside workspace
        </p>
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#24364d] p-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ffda45] text-[#10192d]">
            <BriefcaseBusiness size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[10px] font-semibold text-[#ffda45]">
              EXAMPLE JOB
            </p>
            <p className="mb-0 mt-1 text-sm font-semibold">Battery check</p>
            <p className="mb-0 mt-1 text-xs text-[#aebbd0]">
              Mabolo Road · Toyota Vios
            </p>
          </div>
          <strong className="shrink-0 text-sm text-[#ffda45]">₱405 net</strong>
        </div>
        <p className="mb-0 mt-4 text-xs text-[#aebbd0]">
          Your availability. Your next opportunity.
        </p>
      </section>

      <ul className="mb-0 mt-6 flex list-none flex-col gap-4 p-0">
        <li className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1c293d] text-[#ffda45]">
            <BriefcaseBusiness size={19} />
          </span>
          <span>
            <strong className="block text-sm">Find jobs close to you</strong>
            <small className="mt-1 block text-xs text-[#aebbd0]">
              Choose when you work by setting your availability.
            </small>
          </span>
        </li>
        <li className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1c293d] text-[#ffda45]">
            <BadgeCheck size={19} />
          </span>
          <span>
            <strong className="block text-sm">Get verified. Build trust.</strong>
            <small className="mt-1 block text-xs text-[#aebbd0]">
              Add your ID and trade credentials.
            </small>
          </span>
        </li>
        <li className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1c293d] text-[#ffda45]">
            <Wallet size={19} />
          </span>
          <span>
            <strong className="block text-sm">Your work. Your earnings.</strong>
            <small className="mt-1 block text-xs text-[#aebbd0]">
              See estimated net pay and track every job.
            </small>
          </span>
        </li>
      </ul>

        <div className="mt-auto flex flex-col gap-3 pt-8">
        <Link
          to="/mechanic/sign-in"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ffda45] px-4 text-sm font-bold text-[#111827]"
        >
          <ArrowRight size={18} />
          Get started as a mechanic
        </Link>
        <Link
          to="/mechanic/sign-in"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#1c293d] px-4 text-sm font-semibold text-white"
        >
          Sign in to Pro
        </Link>
        </div>
      </div>
    </div>
  );
}
