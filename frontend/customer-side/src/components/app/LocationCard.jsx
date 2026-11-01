import { tr, trTemplate } from "../../i18n/translations";
import { MapPin, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { formatCoordinate } from '../../utils/formatters';
export function LocationCard({
  compact = false
}) {
  const {
    location
  } = useApp();
  const hasCoordinates = Number.isFinite(location.latitude) && Number.isFinite(location.longitude);
  const coordinates = hasCoordinates ? `${formatCoordinate(location.latitude, 'N', 'S')}, ${formatCoordinate(location.longitude, 'E', 'W')}` : 'Coordinates pending';
  return <div className="panel flex items-center justify-between gap-3 px-4 py-4">
      <div className="flex items-center gap-3">
        <MapPin className="text-[rgb(var(--fmb-accent))]" size={22} />
        <div>
          <p className="font-bold leading-tight text-[rgb(var(--fmb-text))]">{location.address || tr("Use current location")}</p>
          <p className="text-base font-medium text-[rgb(var(--fmb-success))]">
            {compact ? location.source : trTemplate(["Current location - ", ""], [location.source])}
          </p>
          {!compact ? <p className="mt-1 text-base text-[rgb(var(--fmb-muted))]">{coordinates}</p> : null}
        </div>
      </div>
      <Link to="/confirm-location" className="grid h-9 w-9 place-items-center rounded-md text-[rgb(var(--fmb-accent))] transition hover:bg-white/5" aria-label={tr("Edit location")}>
        <Pencil size={18} />
      </Link>
    </div>;
}
