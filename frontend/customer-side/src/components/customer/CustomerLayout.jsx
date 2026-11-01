import { useEffect } from 'react';
import { Bell, History, House, UserRound } from 'lucide-react';
import { BrandLogo } from '../BrandLogo';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useLocale } from '../../context/useLocale';

const navigation = [
  { to: '/app', label: 'Home', icon: House },
  { to: '/history', label: 'History', icon: History },
  { to: '/updates', label: 'Updates', icon: Bell },
  { to: '/account', label: 'Account', icon: UserRound },
];

export function CustomerLayout() {
  const { t, language } = useLocale();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const title =
      {
        '/app': 'Home',
        '/history': 'History',
        '/updates': 'Updates',
        '/account': 'Account',
        '/vehicles': 'My vehicles',
        '/location': 'Pickup location',
      }[pathname] || (pathname.endsWith('/service') ? 'Active service' : pathname.endsWith('/provider-chat') ? 'Mechanic chat' : 'Customer');
    document.title = `${title} | FixMyBuddy`;
  }, [pathname, language]);

  return (
    <div className="auth-root customer-root">
      <a href="#customer-main" className="auth-skip">
        {t('Skip to content','Pumunta sa nilalaman')}
      </a>
      <div className="customer-shell">
        <header className="customer-header">
          <Link
            to="/app"
            className="auth-brand"
            aria-label="FixMyBuddy customer home"
          >
            <BrandLogo />
            <span>FixMyBuddy</span>
          </Link>
          <span className="auth-customer-tag">ROADSIDE</span>
        </header>
        <main
          id="customer-main"
          className="customer-page"
          key={pathname}
          tabIndex={-1}
        >
          <Outlet />
        </main>
        <nav className="customer-nav" aria-label="Customer navigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                isActive ||
                (to === '/account' &&
                  (['/vehicles', '/location'].includes(pathname) || pathname.startsWith('/account/') || pathname.startsWith('/settings/') || pathname.startsWith('/help')))
                  ? 'is-active'
                  : ''
              }
            >
              <Icon size={22} />
              <span>{t(label, { Home: 'Home', History: 'Kasaysayan', Updates: 'Mga abiso', Account: 'Account' }[label])}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
