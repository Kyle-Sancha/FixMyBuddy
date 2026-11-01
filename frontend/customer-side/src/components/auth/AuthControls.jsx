import { tr } from "../../i18n/translations";
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PolicyDocument } from '../PolicyDocument';
import { useLocale } from '../../context/useLocale';
export function AuthHeading({
  eyebrow,
  title,
  children
}) {
  return <div className="auth-heading">
      {eyebrow && <p className="auth-eyebrow">{eyebrow}</p>}
      <h1>{tr(title)}</h1>
      {children && <p>{children}</p>}
    </div>;
}
export function AuthField({
  label,
  id,
  error,
  hint,
  icon: Icon,
  ...props
}) {
  return <div className="auth-field">
      <label htmlFor={id}>{tr(label)}</label>
      <div className="auth-input-wrap">
        <input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...props} />
        {Icon && <Icon className="auth-input-icon" size={18} aria-hidden="true" />}
      </div>
      {error && <p className="auth-field-error" id={`${id}-error`}>
          {tr(error)}
        </p>}
      {hint && !error && <p className="auth-hint" id={`${id}-hint`}>
          {tr(hint)}
        </p>}
    </div>;
}
export function PasswordField({
  error,
  autoComplete = 'current-password',
  hint
}) {
  const [visible, setVisible] = useState(false);
  return <div className="auth-field">
      <label htmlFor="password">{tr("Password")}</label>
      <div className="auth-input-wrap">
        <input id="password" name="password" type={visible ? 'text' : 'password'} autoComplete={autoComplete} required aria-invalid={Boolean(error)} aria-describedby={error ? 'password-error' : hint ? 'password-hint' : undefined} />
        <button className="auth-password-toggle" type="button" onClick={() => setVisible(!visible)} aria-label={visible ? tr("Hide password") : tr("Show password")} title={visible ? tr("Hide password") : tr("Show password")}>
          {visible ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>
      {error ? <p id="password-error" className="auth-field-error">
          {tr(error)}
        </p> : hint ? <p id="password-hint" className="auth-hint">
          {tr(hint)}
        </p> : null}
    </div>;
}
export function AuthSubmit({
  busy,
  children,
  disabled = false,
  icon: Icon = ArrowRight
}) {
  return <button className="auth-primary" type="submit" disabled={busy || disabled}>
      {busy ? <LoaderCircle size={19} className="auth-spin" /> : <Icon size={19} />}
      <span>{busy ? tr("Please wait...") : children}</span>
    </button>;
}
export function AuthNotice({
  children,
  error = false
}) {
  return <div className={`auth-notice ${error ? 'auth-notice-error' : ''}`} role={error ? 'alert' : undefined}>
      <LockKeyhole size={18} aria-hidden="true" />
      <p>{children}</p>
    </div>;
}
export function AccountLink({
  children = 'Already have an account?',
  to = '/login',
  label = 'Sign in'
}) {
  return <p className="auth-account-link">
      {children} <Link to={to}>{tr(label)}</Link>
    </p>;
}
export function LegalLinks() {
  const dialog = useRef(null);
  const [policy, setPolicy] = useState('terms');
  const { t } = useLocale();
  function link(label, url, kind) {
    return url ? <a href={url} target="_blank" rel="noreferrer">
        {tr(label)}
      </a> : <button type="button" className="auth-inline-link" onClick={() => {
      setPolicy(kind);
      dialog.current.showModal();
    }}>
        {tr(label)}
      </button>;
  }
  return <>
      {link('Terms', import.meta.env.VITE_TERMS_URL, 'terms')}{' '}{tr("and")}{' '}
      {link('Privacy Policy', import.meta.env.VITE_PRIVACY_URL, 'privacy')}
      {createPortal(<dialog ref={dialog} className="policy-modal" aria-labelledby="policy-modal-title">
          <header className="policy-modal-header">
            <h2 id="policy-modal-title">{policy === 'terms' ? t('Terms of Use','Mga Tuntunin sa Paggamit') : t('Privacy Policy','Patakaran sa Privacy')}</h2>
            <button type="button" onClick={() => dialog.current.close()} aria-label={tr("Close policy")} title={tr("Close")}>
              <X size={21} />
            </button>
          </header>
          <div className="policy-modal-body" key={policy}><PolicyDocument kind={policy} /></div>
          <footer className="policy-modal-footer"><button type="button" className="auth-secondary" onClick={() => dialog.current.close()}>{tr("Close")}</button></footer>
        </dialog>, document.body)}
    </>;
}
