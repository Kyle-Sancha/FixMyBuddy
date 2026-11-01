import { ArrowLeft, Wrench } from 'lucide-react';

export function MechanicHeader({
  title,
  subtitle,
  showBack = false,
  showBrand = true,
  onBack,
  badge = 'PRO',
}) {
  return (
    <header className="mb-5">
      {showBrand && <div className="flex min-h-11 items-center gap-3">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1c293d] text-[#ffda45] hover:bg-[#263851]"
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#1c293d] text-[#ffda45]">
            <Wrench size={19} />
          </span>
        )}

        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          FixMyBuddy
        </span>

        {badge && (
          <span className="rounded-md bg-[#ffda45] px-2.5 py-1 text-[10px] font-bold leading-none text-[#111827]">
            {badge}
          </span>
        )}
      </div>}

      {(title || subtitle) && (
        <div className={showBrand ? 'mt-4' : 'mt-0'}>
          {title && (
            <h1 className="m-0 text-[22px] font-bold leading-7 tracking-tight">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mb-0 mt-1 text-xs leading-5 text-[#aebbd0]">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </header>
  );
}
