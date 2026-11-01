import { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  CircleUserRound,
  Wallet,
  Wrench,
} from 'lucide-react';

const navigationItems = [
  {
    label: 'Jobs',
    to: '/mechanic/jobs',
    icon: BriefcaseBusiness,
  },
  {
    label: 'Earnings',
    to: '/mechanic/earnings',
    icon: Wallet,
  },
  {
    label: 'Updates',
    to: '/mechanic/updates',
    icon: Bell,
  },
  {
    label: 'Account',
    to: '/mechanic/account',
    icon: CircleUserRound,
  },
];

function getPageTitle(pathname) {
  if (pathname.includes('/additional-work')) return 'Request additional work';
  if (pathname.includes('/arrival')) return 'Verify arrival';
  if (pathname.includes('/diagnosis')) return 'Record diagnosis';
  if (pathname.includes('/quote')) return 'Repair quote';
  if (pathname.includes('/progress')) return 'Repair progress';
  if (pathname.includes('/handover')) return 'Towing and handover';
  if (pathname.includes('/complete')) return 'Job complete';
  if (pathname.includes('/travel')) return 'Head to customer';
  if (/\/jobs\/[^/]+$/.test(pathname)) return 'Job offer';
  if (pathname.startsWith('/mechanic/availability')) return 'Availability';
  if (pathname.startsWith('/mechanic/earnings')) return 'Earnings';
  if (pathname.startsWith('/mechanic/updates')) return 'Updates';
  if (pathname.startsWith('/mechanic/account')) return 'Account';
  return 'Jobs';
}

export function MechanicLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isJobOffer = /^\/mechanic\/jobs\/[^/]+$/.test(pathname);
  const showBack =
    isJobOffer ||
    pathname.endsWith('/quote') ||
    pathname.endsWith('/additional-work');
  const isJobDetail = /^\/mechanic\/jobs\/[^/]+(?:\/.*)?$/.test(pathname);

  useEffect(() => {
    document.title = `${getPageTitle(pathname)} | FixMyBuddy Pro`;
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-[#090f1e] text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-[488px] flex-col border-x border-white/5 bg-[#10192d]">
        <header className="flex h-[72px] shrink-0 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            {showBack ? (
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="grid h-9 w-9 place-items-center rounded-xl bg-[#1c293d] text-[#ffda45]"
              >
                <ArrowLeft size={19} />
              </button>
            ) : (
              <span
                aria-hidden="true"
                className="grid h-9 w-9 place-items-center rounded-xl bg-[#1c293d] text-[#ffda45]"
              >
                <Wrench size={19} strokeWidth={2.2} />
              </span>
            )}
            <span className="text-sm font-medium tracking-wide">
              FixMyBuddy
            </span>
          </div>

          <span className="rounded-md bg-[#ffda45] px-2.5 py-1 text-[10px] font-bold leading-none text-[#111827]">
            PRO
          </span>
        </header>

        <main className="min-h-0 flex-1 px-5 pb-6">
          <Outlet />
        </main>

        {!isJobDetail && (
          <nav
            aria-label="Mechanic navigation"
            className="sticky bottom-0 z-10 grid grid-cols-4 border-t border-[#26354d] bg-[#17243a] px-2 pb-2 pt-2"
          >
            {navigationItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] transition-colors',
                    isActive
                      ? 'bg-[#24364d] font-semibold text-[#ffda45]'
                      : 'text-[#aebbd0] hover:text-white',
                  ].join(' ')
                }
              >
                <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
