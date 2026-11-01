import { tr } from "../../i18n/translations";
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
export function ScreenHeader({
  title,
  subtitle,
  backTo = '/app'
}) {
  return <header className="flex items-center gap-4 pt-11">
      <Link to={backTo} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[rgb(var(--fmb-border))] text-[rgb(var(--fmb-text))] transition hover:bg-white/10" aria-label={tr("Go back")}>
        <ArrowLeft size={24} />
      </Link>
      <div>
        <h1 className="text-base font-bold leading-tight text-[rgb(var(--fmb-text))]">{tr(title)}</h1>
        {subtitle ? <p className="mt-0.5 text-base italic text-[rgb(var(--fmb-muted))]">{tr(subtitle)}</p> : null}
      </div>
    </header>;
}
