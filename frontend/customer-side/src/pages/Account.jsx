import { useRef, useState } from 'react';
import { CarFront, ChevronRight, LogIn, LogOut, MapPin, UserRound, Bell, LockKeyhole, Wallet, Languages, Headphones, HeartHandshake, SunMoon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CustomerHeading } from '../components/customer/CustomerHeading';
import { useAuth } from '../context/useAuth';
import { useApp } from '../context/useApp';
import { useCustomer } from '../context/useCustomer';
import { useLocale } from '../context/useLocale';
import { useBrowserPermissions } from '../hooks/useBrowserPermissions';
import { useTheme } from '../context/useTheme';
export function Account() {
  const { user, signOut } = useAuth();
  const { resetRequest, setLocation } = useApp();
  const { vehicles } = useCustomer();
  const { language, t } = useLocale();
  const { preference } = useTheme();
  const permissions = useBrowserPermissions();
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const dialog = useRef(null);
  const navigate = useNavigate();
  const state = value => value === 'granted' ? t('Allowed by browser','Pinayagan ng browser') : value === 'denied' ? t('Blocked by browser','Hinarang ng browser') : t('Review access','Suriin ang pahintulot');
  const groups = [
    [
      ['/account/profile', UserRound, t('Profile','Profile'), user?.name || t('Sign in to manage your profile','Mag-sign in para sa iyong profile')],
      ['/vehicles', CarFront, t('My vehicles','Mga sasakyan ko'), `${vehicles.length} ${t('saved vehicles','naka-save na sasakyan')}`],
      ['/account/emergency-contact', HeartHandshake, t('Emergency contact','Kontak sa emergency'), user?.emergencyContact?.name || t('Add someone you trust','Magdagdag ng pinagkakatiwalaan')],
    ],
    [
      ['/settings/notifications', Bell, t('Notifications','Mga abiso'), state(permissions.notifications)],
      ['/settings/privacy', LockKeyhole, t('Privacy & sharing','Privacy at pagbabahagi'), t('Choose separately for each booking','Hiwalay na pahintulot sa bawat booking')],
      ['/settings/location', MapPin, t('Location access','Access sa lokasyon'), state(permissions.location)],
      ['/settings/payments', Wallet, t('Payment method','Paraan ng pagbabayad'), t('Provider GCash QR','GCash QR ng provider')],
      ['/settings/language', Languages, t('Language','Wika'), language === 'fil' ? 'Filipino' : 'English'],
      ['/settings/appearance', SunMoon, t('Appearance','Hitsura'), preference === 'light' ? t('Light','Maliwanag') : preference === 'dark' ? t('Dark','Madilim') : t('Use device setting','Sundin ang setting ng device')],
    ],
  ];
  async function logout() {
    setBusy(true); setError('');
    try { await signOut(); resetRequest(); setLocation({ latitude: null, longitude: null, address: 'Use current location', source: 'GPS pending' }); dialog.current.close(); navigate('/'); }
    catch (problem) { setError(problem.message); } finally { setBusy(false); }
  }
  return <>
    <CustomerHeading title={t('Account & settings','Account at mga setting')}>{t('Make FixMyBuddy work for you.','Iangkop ang FixMyBuddy sa iyong pangangailangan.')}</CustomerHeading>
    {!user && <Link to="/login" className="auth-primary account-sign-in"><LogIn size={18} />{t('Sign in','Mag-sign in')}</Link>}
    {groups.map((rows,index) => <ul className="account-settings-group" key={index}>{rows.map(([to,Icon,title,subtitle]) => <li key={to}><Link to={to}><Icon size={22} /><span><strong>{title}</strong><small>{subtitle}</small></span><ChevronRight size={18} /></Link></li>)}</ul>)}
    <Link className="account-help-link" to="/help"><Headphones size={21} /><span>{t('Help & support','Tulong at suporta')}</span><strong>{t('Open','Buksan')}</strong></Link>
    {user && <button className="auth-secondary" type="button" onClick={() => { setError(''); dialog.current.showModal(); }}><LogOut size={21} />{t('Sign out','Mag-sign out')}</button>}
    <dialog ref={dialog} className="auth-policy" aria-labelledby="signout-title" onCancel={event => { if (busy) event.preventDefault(); }}><h2 id="signout-title">{t('Sign out?','Mag-sign out?')}</h2><p>{t('Your session ends only after the server confirms sign-out.','Matatapos lang ang session kapag kinumpirma ng server.')}</p>{error && <p className="auth-error" role="alert">{error}</p>}<div className="customer-remove-actions"><button className="auth-secondary" type="button" disabled={busy} onClick={() => dialog.current.close()}>{t('Stay signed in','Manatiling naka-sign in')}</button><button className="auth-primary" type="button" disabled={busy} onClick={logout}>{busy ? t('Signing out...','Nagsa-sign out...') : t('Sign out','Mag-sign out')}</button></div></dialog>
  </>;
}

