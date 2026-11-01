import { Bell, BriefcaseBusiness, CircleUserRound, Wallet } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navigationItems = [
  { label: 'Jobs', to: '/mechanic/jobs', icon: BriefcaseBusiness },
  { label: 'Earnings', to: '/mechanic/earnings', icon: Wallet },
  { label: 'Updates', to: '/mechanic/updates', icon: Bell },
  { label: 'Account', to: '/mechanic/account', icon: CircleUserRound },
];

export function MechanicBottomNav() {
  return (
    <nav
      aria-label="Mechanic navigation"
      className="grid grid-cols-4 border-t border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] px-2 pb-2 pt-2"
    >
      {navigationItems.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            [
              'flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl text-base transition-colors',
              isActive
                ? 'bg-[rgb(var(--fmb-selected))] font-semibold text-[rgb(var(--fmb-accent))]'
                : 'text-[rgb(var(--fmb-muted))] hover:text-[rgb(var(--fmb-text))]',
            ].join(' ')
          }
        >
          <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}