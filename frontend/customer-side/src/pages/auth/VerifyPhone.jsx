import { tr, trTemplate } from "../../i18n/translations";
import { useEffect, useState } from 'react';
import { Clock3, MessageSquareLock, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthHeading, AuthNotice, AuthSubmit } from '../../components/auth/AuthControls';
import { useAuth } from '../../context/useAuth';
import { authService } from '../../services/authService';
import { maskPhone } from '../../utils/authValidation';
export function VerifyPhone() {
  const {
    challenge,
    setChallenge,
    phone,
    acceptUser
  } = useAuth();
  const [code, setCode] = useState('');
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const remaining = challenge ? Math.max(0, Math.ceil((Date.parse(challenge.resendAt) - now) / 1000)) : 0;
  const expired = challenge && now >= Date.parse(challenge.expiresAt);
  useEffect(() => {
    if (!challenge) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [challenge]);
  async function submit(event) {
    event.preventDefault();
    if (!challenge || busy || resending || expired || code.length !== 6) return;
    setBusy(true);
    setError('');
    try {
      acceptUser(await authService.verify(challenge.id, code));
      setCode('');
      navigate(challenge.flow === 'signup' ? '/permissions' : '/app', {
        replace: true
      });
    } catch (failure) {
      setError(failure.message);
      setCode('');
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    if (remaining || resending || busy || !challenge) return;
    setResending(true);
    setError('');
    try {
      setChallenge({
        ...(await authService.resend(challenge.id)),
        flow: challenge.flow
      });
      setNow(Date.now());
      setCode('');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setResending(false);
    }
  }
  return <div className="auth-page">
      <AuthHeading title={tr("Verify your number.")}>
        {challenge ? trTemplate(["Enter the 6-digit code sent to ", "."], [maskPhone(phone)]) : tr("Verify your mobile number to keep your account secure.")}
      </AuthHeading>
      <div className="auth-verification-icon">
        <MessageSquareLock size={37} strokeWidth={1.5} />
      </div>
      {!challenge ? <>
          <AuthNotice>{tr("Request a code from the sign-in screen first. If you refreshed this page, start again to receive a new code.")}</AuthNotice>
          <div className="auth-actions">
            <Link to="/login" className="auth-primary">{tr("Continue with phone")}</Link>
          </div>
        </> : <form className="auth-form" onSubmit={submit}>
          <label className="auth-otp-label" htmlFor="verification-code">{tr("Verification code")}</label>
          <div className="auth-otp">
            <input id="verification-code" aria-label={tr("6-digit verification code")} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} disabled={busy || resending || Boolean(expired)} autoFocus required />
            <div aria-hidden="true" className="auth-otp-boxes">
              {Array.from({
            length: 6
          }, (_, index) => <span key={index} className={index === code.length ? 'is-current' : ''}>
                  {code[index] || ''}
                </span>)}
            </div>
          </div>
          <div className="auth-resend">
            <span>
              <Clock3 size={16} />{tr("Didn't receive a code?")}</span>
            <button type="button" onClick={resend} disabled={remaining > 0 || resending || busy}>
              {resending ? tr("Sending...") : remaining ? trTemplate(["Resend in ", ":", ""], [String(Math.floor(remaining / 60)).padStart(2, '0'), String(remaining % 60).padStart(2, '0')]) : tr("Resend code")}
            </button>
          </div>
          {expired && <p className="auth-field-error" role="alert">{tr("This code has expired. Request a new code.")}</p>}
          <AuthNotice>{tr("Never share your code. FixMyBuddy will not ask you for it by phone.")}</AuthNotice>
          {error && <AuthNotice error>{tr(error)}</AuthNotice>}
          <div className="auth-actions">
            <AuthSubmit busy={busy} disabled={code.length !== 6 || Boolean(expired) || resending} icon={ShieldCheck}>{tr("Verify & continue")}</AuthSubmit>
            <Link to="/login" className="auth-secondary" onClick={() => setChallenge(null)}>{tr("Change mobile number")}</Link>
          </div>
        </form>}
    </div>;
}
