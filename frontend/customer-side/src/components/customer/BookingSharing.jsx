import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Save } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useLocale } from '../../context/useLocale';
import { accountService } from '../../services/accountService';
import { useCustomer } from '../../context/useCustomer';
export function BookingSharing({ booking }) {
  const { user } = useAuth(), { t } = useLocale();
  const { refreshData } = useCustomer();
  const [confirmed, setConfirmed] = useState(booking.sharing?.enabled === true);
  const [enabled, setEnabled] = useState(booking.sharing?.enabled === true);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const active = !['completed','cancelled','rejected'].includes(booking.status);
  async function save(event) {
    event.preventDefault(); if (busy || enabled === confirmed) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const sharing = await accountService.sharing(booking.id, enabled, booking.version);
      setConfirmed(sharing.enabled); setEnabled(sharing.enabled);
      setNotice(sharing.enabled ? t('Sharing is enabled for this booking only.','Pinayagan ang pagbabahagi para lang sa booking na ito.') : t('Sharing is disabled for this booking.','Naka-off ang pagbabahagi para sa booking na ito.'));
      refreshData();
    } catch (problem) { setError(problem.message); } finally { setBusy(false); }
  }
  return <section className="booking-sharing"><h2><ShieldCheck size={20} />{t('Booking sharing','Pagbabahagi sa booking')}</h2><p className="auth-hint">{t('Share this booking and pickup location with your saved emergency contact only when you choose.','Ibahagi lang ang booking at pickup location sa iyong naka-save na emergency contact kapag pinili mo.')}</p>
    {!user?.emergencyContact && !confirmed ? <Link to="/account/emergency-contact" className="provider-text-link">{t('Add an emergency contact first','Magdagdag muna ng kontak sa emergency')}</Link> : <form className="request-form" onSubmit={save}>
      <label className="provider-consent"><input type="checkbox" checked={enabled} disabled={busy || (!active && !confirmed)} onChange={event => { setEnabled(event.target.checked); setNotice(''); }} /><span>{t('Share this booking with','Ibahagi ang booking na ito kay')} {user?.emergencyContact?.name || t('your emergency contact','iyong kontak sa emergency')}</span></label>
      <p className="auth-hint">{confirmed ? t('Current confirmed setting: sharing enabled.','Kumpirmadong setting: pinapayagan ang pagbabahagi.') : t('Current confirmed setting: sharing off.','Kumpirmadong setting: naka-off ang pagbabahagi.')}</p>
      <button className="auth-secondary" type="submit" disabled={busy || enabled === confirmed}><Save size={17} />{busy ? t('Saving...','Sine-save...') : t('Save sharing choice','I-save ang piniling pagbabahagi')}</button>
    </form>}
    {error && <p role="alert" className="auth-error">{error}</p>}{notice && <p role="status" className="customer-save-status">{notice}</p>}
  </section>;
}

