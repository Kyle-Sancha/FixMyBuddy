import { ArrowLeft } from 'lucide-react';
import { BrandLogo } from '../../../customer-side/src/components/BrandLogo';

export function MechanicHeader({
  title,
  subtitle,
  showBack = false,
  showBrand = true,
  onBack,
  badge = 'PRO',
}) {
  return (
    <header className="customer-heading">
      {showBrand && <div className="flex min-h-11 items-center gap-3">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[rgb(var(--fmb-panel))] text-[rgb(var(--fmb-accent))] hover:bg-[rgb(var(--fmb-selected))]"
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <span className="auth-brand-icon shrink-0">
            <BrandLogo />
          </span>
        )}

        <span className="min-w-0 flex-1 truncate text-base font-medium">
          FixMyBuddy
        </span>

        {badge && (
          <span className="rounded-md bg-[rgb(var(--fmb-accent))] px-2.5 py-1 text-base font-bold leading-none text-[rgb(var(--fmb-ink))]">
            {badge}
          </span>
        )}
      </div>}

      {(title || subtitle) && (
        <div className={showBrand ? 'mt-4' : 'mt-0'}>
          {title && (
            <h1>{title}</h1>
          )}
          {subtitle && (
            <p>{subtitle}</p>
          )}
        </div>
      )}
    </header>
  );
}
