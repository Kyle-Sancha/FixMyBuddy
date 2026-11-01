import { useLocale } from '../../context/useLocale';
import { validTowingQuote } from '../../utils/towingValidation';
export function TowingRouteSummary({ quote }) {
  const { t } = useLocale();
  return <section className="towing-route"><h2>{t('Your towing route','Ruta ng iyong towing')}</h2>{validTowingQuote(quote) ? <dl><div><dt>{t('Pickup','Pickup')}</dt><dd>{quote.pickupAddress}</dd></div><div><dt>{t('Destination','Destinasyon')}</dt><dd>{quote.destinationAddress}</dd></div><div><dt>{t('Route distance','Distansya ng ruta')}</dt><dd>{quote.distanceKm} km</dd></div><div><dt>{t('Equipment','Kagamitan')}</dt><dd>{quote.equipment}</dd></div></dl> : <p className="auth-hint">{t('A provider-confirmed route and equipment estimate is required before booking.','Kailangan ng ruta at kagamitang kinumpirma ng provider bago mag-book.')}</p>}</section>;
}

