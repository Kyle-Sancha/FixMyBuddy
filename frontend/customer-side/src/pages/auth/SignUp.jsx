import { tr } from "../../i18n/translations";
import { useState } from 'react';
import { Mail, Phone, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AccountLink, AuthField, AuthHeading, AuthNotice, AuthSubmit, LegalLinks, PasswordField } from '../../components/auth/AuthControls';
import { useAuth } from '../../context/useAuth';
import { authService } from '../../services/authService';
import { isEmail, normalizePhone } from '../../utils/authValidation';
import { useLocale } from '../../context/useLocale';
export function SignUp() {
  const { t } = useLocale();
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const {
    setPhone,
    setChallenge
  } = useAuth();
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = data.get('name').trim();
    const phone = normalizePhone(data.get('phone'));
    const email = data.get('email').trim();
    const password = data.get('password');
    const nextErrors = {};
    if (name.length < 2) nextErrors.name = 'Enter your full name.';
    if (!phone) nextErrors.phone = 'Enter a valid Philippine mobile number.';
    if (!isEmail(email)) nextErrors.email = 'Enter a valid email address.';
    if (password.length < 8 || !/[0-9]/.test(password)) nextErrors.password = 'Use at least 8 characters, including a number.';
    if (!data.get('terms')) nextErrors.terms = t('Please agree to the Terms and acknowledge the Privacy Policy.','Sumang-ayon sa Mga Tuntunin at kilalanin ang Patakaran sa Privacy.');
    setErrors(nextErrors);
    setError('');
    if (Object.keys(nextErrors).length) {
      form.elements.namedItem(Object.keys(nextErrors)[0])?.focus();
      return;
    }
    setBusy(true);
    try {
      const challenge = await authService.signup({
        name,
        phone,
        email,
        password,
        acceptedTerms: true
      });
      setPhone(phone);
      setChallenge({
        ...challenge,
        flow: 'signup'
      });
      navigate('/verify');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
      form.elements.password.value = '';
    }
  }
  return <div className="auth-page">
      <AuthHeading title={tr("Let's get you ready.")}>{tr("Create your customer account.")}</AuthHeading>
      <form className="auth-form" onSubmit={submit}>
        <AuthField id="name" name="name" label={tr("Full name")} autoComplete="name" required maxLength={100} icon={UserRound} error={errors.name} />
        <AuthField id="phone" name="phone" label={tr("Mobile number")} type="tel" inputMode="tel" autoComplete="tel" placeholder={tr("09XX XXX XXXX")} required icon={Phone} error={errors.phone} />
        <AuthField id="email" name="email" label={tr("Email address")} type="email" autoComplete="email" required icon={Mail} error={errors.email} />
        <PasswordField autoComplete="new-password" error={errors.password} hint={tr("Use at least 8 characters, including a number.")} />
        <div>
          <div className="auth-consent">
            <input id="terms" type="checkbox" name="terms" aria-label={t('I agree to the Terms and acknowledge the Privacy Policy','Sumasang-ayon ako sa Mga Tuntunin at kinikilala ang Patakaran sa Privacy')} aria-describedby={errors.terms ? 'terms-error' : undefined} />
            <div>
              <label htmlFor="terms">{t('I agree to the Terms and acknowledge the Privacy Policy.','Sumasang-ayon ako sa Mga Tuntunin at kinikilala ang Patakaran sa Privacy.')}</label>{' '}
              <LegalLinks />.
            </div>
          </div>
          {errors.terms && <p id="terms-error" className="auth-field-error">
              {errors.terms}
            </p>}
        </div>
        <AuthNotice>{tr("Your password stays private. Choose one you don't use anywhere else.")}</AuthNotice>
        {error && <AuthNotice error>{tr(error)}</AuthNotice>}
        <div className="auth-actions">
          <AuthSubmit busy={busy}>{tr("Create account")}</AuthSubmit>
        </div>
      </form>
      <AccountLink />
    </div>;
}
