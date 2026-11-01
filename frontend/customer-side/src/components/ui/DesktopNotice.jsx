import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { useLocale } from '../../context/useLocale';

const QUERY = '(min-width: 1024px) and (hover: hover) and (pointer: fine)';
const STORAGE_KEY = 'fmb-desktop-notice-dismissed';

function wasDismissed() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function DesktopNotice() {
  const { t } = useLocale();
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(QUERY).matches);
  const [dismissed, setDismissed] = useState(wasDismissed);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const update = () => setIsDesktop(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  if (!isDesktop || dismissed) return null;

  function dismiss() {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* storage unavailable; dismiss for this view only */
    }
    setDismissed(true);
  }

  return (
    <div className="desktop-notice-backdrop">
      <div className="desktop-notice" role="dialog" aria-modal="true" aria-labelledby="desktop-notice-title">
        <span className="desktop-notice-icon"><Smartphone size={28} aria-hidden="true" /></span>
        <h2 id="desktop-notice-title">
          {t('FixMyBuddy works best on your phone', 'Pinakamainam ang FixMyBuddy sa iyong phone')}
        </h2>
        <p>
          {t(
            'FixMyBuddy is designed for mobile devices, so we recommend opening it on your phone. You can still continue here, but some screens may look stretched.',
            'Ang FixMyBuddy ay para sa mga mobile device, kaya inirerekomenda naming buksan ito sa iyong phone. Maaari ka pa ring magpatuloy dito, pero maaaring hindi maganda ang itsura ng ilang screen.',
          )}
        </p>
        <button type="button" className="auth-primary" onClick={dismiss}>
          {t('Continue anyway', 'Magpatuloy pa rin')}
        </button>
      </div>
    </div>
  );
}