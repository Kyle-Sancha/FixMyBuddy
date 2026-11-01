import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, UserRound } from 'lucide-react';
import { CustomerHeading } from '../components/customer/CustomerHeading';
import { useAuth } from '../context/useAuth';
import { useLocale } from '../context/useLocale';
import { authService } from '../services/authService';
import { normalizePhone } from '../utils/authValidation';
export function AccountProfile() {
  const { section } = useParams();
  const { user, acceptUser } = useAuth();
  const { t } = useLocale();
  const contact = section === 'emergency-contact';
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  async function save(event) {
    event.preventDefault(); if (!user || busy) return;
    const fields = new FormData(event.currentTarget);
    setError(''); setMessage('');
    let details;
    if (contact) {
      const name = fields.get('contactName').trim(), phone = fields.get('contactPhone').trim(), relationship = fields.get('relationship');
      const hasContact = Boolean(name || phone || relationship);
      if (hasContact && (name.length < 2 || !normalizePhone(phone) || !relationship)) { setError(t('Enter a name, valid Philippine mobile number, and relationship.','Ilagay ang pangalan, wastong numerong mobile sa Pilipinas, at relasyon.')); return; }
      if (hasContact && normalizePhone(phone) === normalizePhone(user.phone || '')) { setError(t('Choose someone other than yourself.','Pumili ng ibang tao, hindi ang iyong sarili.')); return; }
      details = { emergencyContact: hasContact ? { name, phone: normalizePhone(phone), relationship } : null };
    } else {
      const name = fields.get('name').trim();
      if (name.length < 2) { setError(t('Enter your full name.','Ilagay ang buong pangalan.')); return; }
      details = { name };
    }
    setBusy(true);
    try { acceptUser(await authService.profile(details)); setMessage(t('Saved to your account.','Na-save sa iyong account.')); }
    catch (problem) { setError(problem.message); } finally { setBusy(false); }
  }
  return <>
    <CustomerHeading title={contact ? t('Emergency contact','Kontak sa emergency') : t('Your profile','Iyong profile')} backTo="/account">{contact ? t('Someone you trust, only contacted when you choose to share.','Isang pinagkakatiwalaan, na makakatanggap lang kapag pinili mong magbahagi.') : t('Keep your customer details up to date.','Panatilihing tama ang iyong impormasyon.')}</CustomerHeading>
    {!user ? <div className="history-notice"><UserRound size={24} /><p>{t('Sign in to manage these details.','Mag-sign in para baguhin ang impormasyong ito.')}</p><Link className="auth-primary" to="/login">{t('Sign in','Mag-sign in')}</Link></div> : <form className="request-form account-form" onSubmit={save} key={`${user.id}-${section}`}>
      {contact ? <>
        <label className="request-field">{t('Contact name','Pangalan ng kontak')}<input name="contactName" maxLength={100} defaultValue={user.emergencyContact?.name || ''} autoComplete="name" /></label>
        <label className="request-field">{t('Relationship','Relasyon')}<select name="relationship" defaultValue={user.emergencyContact?.relationship || ''}><option value="">{t('Choose a relationship','Pumili ng relasyon')}</option>{[['Parent','Magulang'],['Spouse or partner','Asawa o partner'],['Sibling','Kapatid'],['Friend','Kaibigan'],['Other','Iba']].map(([en,fil]) => <option key={en} value={en}>{t(en,fil)}</option>)}</select></label>
        <label className="request-field">{t('Mobile number','Numerong mobile')}<input name="contactPhone" type="tel" maxLength={25} defaultValue={user.emergencyContact?.phone || ''} autoComplete="tel" /></label>
        <p className="auth-hint">{t('Ask their permission first. Leave all contact fields empty to remove the contact. Sharing remains off unless enabled for an individual booking.','Humingi muna ng pahintulot. Iwanang blangko ang lahat para alisin ang kontak. Naka-off ang pagbabahagi maliban kung pinayagan sa isang booking.')}</p>
      </> : <>
        <label className="request-field">{t('Full name','Buong pangalan')}<input required minLength={2} maxLength={100} name="name" autoComplete="name" defaultValue={user.name || ''} /></label>
        <dl className="account-readonly"><div><dt>{t('Mobile number','Numerong mobile')}</dt><dd>{user.phone || t('Not provided','Walang nakalagay')}</dd></div><div><dt>Email</dt><dd>{user.email || t('Not provided','Walang nakalagay')}</dd></div></dl>
        <p className="auth-hint">{t('Phone and email changes require a verified account-update flow. They cannot be changed here.','Kailangan ng verification para baguhin ang mobile at email. Hindi sila mababago rito.')}</p>
      </>}
      {error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="customer-save-status" role="status">{message}</p>}
      <button className="auth-primary" type="submit" disabled={busy}><Check size={18} />{busy ? t('Saving...','Sine-save...') : t('Save changes','I-save ang pagbabago')}</button>
    </form>}
  </>;
}

