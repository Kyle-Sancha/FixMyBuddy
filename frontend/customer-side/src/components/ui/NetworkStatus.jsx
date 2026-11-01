import { useEffect, useState } from 'react';
import { LoaderCircle, Wifi, WifiOff, X } from 'lucide-react';
import { useLocale } from '../../context/useLocale';
export function NetworkStatus() {
  const { t } = useLocale();
  const [status, setStatus] = useState(() => navigator.onLine ? 'connected' : 'offline');
  useEffect(() => {
    const offline = () => setStatus('offline');
    const online = () => setStatus('retry');
    const failed = () => setStatus(navigator.onLine ? 'error' : 'offline');
    const response = () => setStatus(navigator.onLine ? 'connected' : 'offline');
    window.addEventListener('offline', offline);
    window.addEventListener('online', online);
    window.addEventListener('fixmybuddy:connection-error', failed);
    window.addEventListener('fixmybuddy:connection-response', response);
    return () => {
      window.removeEventListener('offline', offline);
      window.removeEventListener('online', online);
      window.removeEventListener('fixmybuddy:connection-error', failed);
      window.removeEventListener('fixmybuddy:connection-response', response);
    };
  }, []);
  if (status === 'connected') return null;
  return <aside className="buddy-network" role="status" aria-live="polite">
    <div className="buddy-network-inner">
      {status === 'retry' ? <Wifi size={22} aria-hidden="true" /> : <WifiOff size={22} aria-hidden="true" />}
      <div><strong>{status === 'offline' ? t('Waiting for internet...','Naghihintay ng internet...') : status === 'retry' ? t('Network detected. Try again.','May network na. Subukan muli.') : t('Could not connect.','Hindi makakonekta.')}</strong>
      <span>{status === 'offline' ? t('Hang tight. Reconnect, then retry your action.','Sandali lang. Kumonekta muli, saka ulitin ang aksyon.') : t('Bookings, payments and messages are not automatically resent.','Hindi awtomatikong ipinapadala muli ang booking, bayad at mensahe.')}</span></div>
      {status === 'offline' ? <LoaderCircle className="buddy-network-spin" size={21} aria-hidden="true" /> : <button type="button" aria-label={t('Dismiss connection notice','Isara ang abiso sa koneksyon')} title={t('Dismiss','Isara')} onClick={() => setStatus('connected')}><X size={18} /></button>}
    </div>
  </aside>;
}

