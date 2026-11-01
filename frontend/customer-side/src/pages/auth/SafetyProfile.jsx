import { tr } from "../../i18n/translations";
import { useState } from 'react';
import { Check, Mail, Pencil, Phone, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthField, AuthHeading, AuthNotice, AuthSubmit } from '../../components/auth/AuthControls';
import { useAuth } from '../../context/useAuth';
import { authService } from '../../services/authService';
import { normalizePhone } from '../../utils/authValidation';
export function SafetyProfile() {
  const {
    user,
    acceptUser,
    sessionStatus
  } = useAuth();
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const initials = user?.name?.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (!user) {
      setError('Please sign in to save your profile and emergency contact.');
      return;
    }
    const data = new FormData(event.currentTarget);
    const name = data.get('contactName').trim();
    const number = data.get('contactPhone').trim();
    const relationship = data.get('relationship');
    const nextErrors = {};
    const hasContact = Boolean(name || number || relationship);
    if (hasContact && name.length < 2) nextErrors.contactName = "Enter your contact's name.";
    if (hasContact && !normalizePhone(number)) nextErrors.contactPhone = 'Enter a valid Philippine mobile number.';
    if (hasContact && !relationship) nextErrors.relationship = 'Choose a relationship.';
    if (editing && data.get('name').trim().length < 2) nextErrors.name = 'Enter your full name.';
    if (normalizePhone(number) && normalizePhone(number) === normalizePhone(user.phone || '')) nextErrors.contactPhone = 'Choose someone other than yourself.';
    setErrors(nextErrors);
    setError('');
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try {
      acceptUser(await authService.profile({
        ...(editing ? {
          name: data.get('name').trim()
        } : {}),
        emergencyContact: hasContact ? {
          name,
          phone: normalizePhone(number),
          relationship
        } : null
      }));
      navigate('/app');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  if (sessionStatus === 'loading') return <AuthNotice>{tr("Loading your account...")}</AuthNotice>;
  return <div className="auth-page">
      <AuthHeading title={tr("Your safety circle.")}>{tr("Your account and someone you trust.")}</AuthHeading>
      <form onSubmit={submit} className="auth-form">
        <div className="auth-profile-person">
          <span>{initials || <UserRound size={24} />}</span>
          <div>
            <h3>{user?.name || tr("Your customer profile")}</h3>
            <p>
              {user?.phoneVerified ? tr("Customer \xB7 Phone verified") : user ? tr("Customer account") : tr("Sign in to save your details")}
            </p>
          </div>
        </div>
        <div className="auth-profile-details">
          <div>
            <Phone size={18} />
            <span>{tr("Mobile")}</span>
            <strong>{user?.phone || tr("Not provided")}</strong>
          </div>
          <div>
            <Mail size={18} />
            <span>{tr("Email")}</span>
            <strong>{user?.email || tr("Not provided")}</strong>
          </div>
          {user && <div>
              <Pencil size={18} />
              <span>{tr("Account details")}</span>
              <button type="button" onClick={() => setEditing(!editing)}>
                {editing ? tr("Cancel edit") : tr("Edit profile")}
              </button>
            </div>}
        </div>
        {editing && <AuthField id="profile-name" name="name" label={tr("Full name")} autoComplete="name" defaultValue={user?.name || ''} error={errors.name} required icon={UserRound} />}
        <div className="auth-section-title">
          <h3>{tr("Emergency contact")}</h3>
          <span>{tr("Optional")}</span>
        </div>
        <AuthField id="contact-name" name="contactName" label={tr("Contact name")} defaultValue={user?.emergencyContact?.name || ''} maxLength={100} icon={UserRound} error={errors.contactName} />
        <div className="auth-field">
          <label htmlFor="relationship">{tr("Relationship")}</label>
          <select id="relationship" name="relationship" defaultValue={user?.emergencyContact?.relationship || ''} aria-invalid={Boolean(errors.relationship)} aria-describedby={errors.relationship ? 'relationship-error' : undefined}>
            <option value="">{tr("Choose a relationship")}</option>
            {['Parent', 'Spouse or partner', 'Sibling', 'Friend', 'Other'].map(value => <option key={value}>{value}</option>)}
          </select>
          {errors.relationship && <p id="relationship-error" className="auth-field-error">
              {errors.relationship}
            </p>}
        </div>
        <AuthField id="contact-phone" name="contactPhone" label={tr("Contact number")} type="tel" inputMode="tel" placeholder={tr("09XX XXX XXXX")} defaultValue={user?.emergencyContact?.phone || ''} icon={Phone} error={errors.contactPhone} />
        <AuthNotice>{tr("Choose someone you trust and ask for their permission before adding their contact details.")}</AuthNotice>
        {error && <AuthNotice error>{tr(error)}</AuthNotice>}
        <div className="auth-actions">
          {user ? <AuthSubmit busy={busy} icon={Check}>{tr("Save profile & contact")}</AuthSubmit> : <Link className="auth-primary" to="/login">{tr("Sign in to save details")}</Link>}
          <Link to="/app" className="auth-secondary">{tr("Skip for now")}</Link>
        </div>
      </form>
    </div>;
}
