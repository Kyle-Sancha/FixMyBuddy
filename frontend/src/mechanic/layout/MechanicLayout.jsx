import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  CircleUserRound,
  Wallet,
} from 'lucide-react';
import { BrandLogo } from '../../../customer-side/src/components/BrandLogo';
import { RoleGuard } from '../../../customer-side/src/components/auth/RoleGuard';

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
    <RoleGuard allowedRoles={['mechanic']} signInPath="/mechanic/signin">
    <div className="auth-root customer-root mechanic-root">
      <div className="customer-shell">
        <header className="customer-header">
          <div className="mechanic-header-brand">
            {showBack ? (
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="auth-back"
              >
                <ArrowLeft size={19} />
              </button>
            ) : (
              <Link
                to="/mechanic/jobs"
                className="auth-brand"
                aria-label="FixMyBuddy Pro home"
              >
                <BrandLogo />
                <span>FixMyBuddy</span>
              </Link>
            )}
          </div>

          {!isJobDetail && (
            <nav aria-label="Mechanic navigation" className="customer-nav">
              {navigationItems.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  className={({ isActive }) =>
                    isActive ||
                    (to === '/mechanic/account' && pathname.startsWith('/mechanic/availability'))
                      ? 'is-active'
                      : ''
                  }
                >
                  <Icon size={22} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          )}

          <span className="auth-customer-tag">PRO</span>
        </header>

        <main id="customer-main" className="customer-page" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
    </RoleGuard>
  );
}
