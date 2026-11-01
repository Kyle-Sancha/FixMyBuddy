import { tr, trTemplate } from "../../i18n/translations";
import { useEffect } from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { BrandLogo } from '../BrandLogo';
import { Link, Outlet, useLocation } from 'react-router-dom';
const steps = ['/signup', '/verify', '/permissions', '/profile'];
const titles = {
  '/start': 'Welcome',
  '/login': 'Sign in',
  '/signup': 'Create account',
  '/verify': 'Verify number',
  '/permissions': 'Your preferences',
  '/profile': 'Safety contact',
  '/forgot-password': 'Reset password'
};
export function AuthLayout() {
  const {
    pathname
  } = useLocation();
  const step = steps.indexOf(pathname);
  const backTo = {
    '/start': '/',
    '/login': '/',
    '/signup': '/',
    '/verify': '/login',
    '/permissions': '/app',
    '/profile': '/permissions',
    '/forgot-password': '/login'
  }[pathname] || '/';
  useEffect(() => {
    document.title = `${titles[pathname] || 'Account'} | FixMyBuddy`;
    window.scrollTo(0, 0);
    return () => {
      document.title = 'FixMyBuddy';
    };
  }, [pathname]);
  return <div className="auth-root">
      <a href="#auth-main" className="auth-skip">{tr("Skip to form")}</a>
      <header className="auth-nav">
        <Link to="/" className="auth-brand" aria-label={tr("FixMyBuddy home")}>
          <BrandLogo />
          <span>{tr("FixMyBuddy")}<span className="auth-brand-caption">{tr("YOUR ROADSIDE BUDDY")}</span>
          </span>
        </Link>
        <Link to="/app" className="auth-browse">{tr("Browse first")}<ArrowUpRight size={16} />
        </Link>
      </header>
      <div className="auth-workspace">
        <main id="auth-main" className="auth-main" tabIndex={-1}>
          <div className="auth-form-wrap" key={pathname}>
            <div className="auth-form-top">
              <Link to={backTo} className="auth-back">
                <ArrowLeft size={18} />{tr("Back")}</Link>
              <span className="auth-customer-tag">{tr("CUSTOMER")}</span>
            </div>
            {step >= 0 && <div className="auth-progress" aria-label={trTemplate(["Onboarding step ", " of 4"], [step + 1])}>
                <div className="auth-progress-bars">
                  {steps.map((path, index) => <span key={path} className={index <= step ? 'is-current' : ''} />)}
                </div>
                <span>{step + 1} / 4</span>
              </div>}
            <Outlet />
          </div>
          <footer className="auth-footer">
            <BrandLogo />{tr("FixMyBuddy")} {' '}
            <span>{tr("Here for your next move.")}</span>
          </footer>
        </main>
      </div>
    </div>;
}
