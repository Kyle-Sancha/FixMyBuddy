import { tr } from "../i18n/translations";
import { Button } from '../components/ui/Button';
export function NotFound() {
  return <section className="screen grid place-items-center text-center">
      <div>
        <p className="text-base font-semibold uppercase tracking-wide text-[rgb(var(--fmb-accent))]">404</p>
        <h1 className="mt-3 text-3xl font-bold text-[rgb(var(--fmb-text))]">{tr("Page not found")}</h1>
        <p className="mt-3 text-[rgb(var(--fmb-muted))]">{tr("The screen you are looking for does not exist.")}</p>
        <Button to="/app" className="mt-6">{tr("Go to app home")}</Button>
      </div>
    </section>;
}
