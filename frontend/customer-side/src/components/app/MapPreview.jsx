import { tr } from "../../i18n/translations";
import { LocateFixed } from 'lucide-react';
import { useApp } from '../../context/useApp';
export function MapPreview() {
  const {
    location
  } = useApp();
  const hasCoordinates = Number.isFinite(location.latitude) && Number.isFinite(location.longitude);
  if (!hasCoordinates) {
    return <div className="relative grid h-[420px] place-items-center overflow-hidden rounded-[1.35rem] bg-[rgb(var(--fmb-panel))]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-400 text-slate-950">
            <LocateFixed size={22} />
          </div>
          <p className="mt-4 text-base font-semibold text-[rgb(var(--fmb-text))]">{tr("Location not set")}</p>
          <p className="mt-1 text-base text-[rgb(var(--fmb-muted))]">{tr("Use GPS or type your service address.")}</p>
        </div>
      </div>;
  }
  const delta = 0.008;
  const bbox = [location.longitude - delta, location.latitude - delta, location.longitude + delta, location.latitude + delta].join(',');
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${location.latitude},${location.longitude}`;
  return <div className="relative h-[420px] overflow-hidden rounded-[1.35rem] bg-[rgb(var(--fmb-panel))]">
      <iframe className="h-full w-full border-0 opacity-90 grayscale-[20%] contrast-110" title={tr("Current location map")} src={mapUrl} />
      <div className="pointer-events-none absolute inset-0 bg-slate-950/10" />
      <div className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/25">
        <LocateFixed size={22} />
      </div>
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded bg-slate-900/75 px-4 py-2 text-sm font-semibold text-slate-200 backdrop-blur">
        {location.address}
      </div>
    </div>;
}
