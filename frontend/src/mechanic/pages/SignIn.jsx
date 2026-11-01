import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Mail,
  Phone,
  Upload,
} from 'lucide-react';
import { BrandLogo } from '../../../customer-side/src/components/BrandLogo';
import {
  AccountLink,
  AuthField,
  AuthHeading,
  AuthNotice,
  AuthSubmit,
  LegalLinks,
  PasswordField,
} from '../../../customer-side/src/components/auth/AuthControls';
import { useAuth } from '../../../customer-side/src/context/useAuth';
import {
  authService,
  isAuthConfigured,
} from '../../../customer-side/src/services/authService';
import {
  isEmail,
  normalizePhone,
} from '../../../customer-side/src/utils/authValidation';

const onboardingSteps = [
  'Verify identity & mobile',
  'Upload TESDA / trade credentials',
  'Review vehicle & service capability',
];

export function SignIn() {
  const navigate = useNavigate();
  const { phone, setPhone, setChallenge, acceptUser } = useAuth();
  const [mode, setMode] = useState('phone');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [credentialFiles, setCredentialFiles] = useState([]);

  useEffect(() => {
    document.title = 'Sign in | FixMyBuddy Pro';
    window.scrollTo(0, 0);
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    if (!isAuthConfigured) {
      navigate('/mechanic/availability');
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const nextErrors = {};
    if (mode === 'phone' && !normalizePhone(phone)) {
      nextErrors.phone = 'Enter a valid Philippine mobile number.';
    }
    if (mode === 'email' && !isEmail(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    setErrors(nextErrors);
    setError('');
    if (Object.keys(nextErrors).length) {
      return;
    }

    setBusy(true);
    try {
      if (mode === 'phone') {
        const normalized = normalizePhone(phone);
        const challenge = await authService.phone(normalized);
        setPhone(normalized);
        setChallenge({ ...challenge, flow: 'mechanic' });
        navigate('/verify');
      } else {
        const user = await authService.login(
          email.trim(),
          data.get('password'),
          'mechanic',
        );
        acceptUser(user);
        navigate('/mechanic/availability');
      }
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-root">
      <a href="#mechanic-auth-main" className="auth-skip">
        Skip to form
      </a>
      <header className="auth-nav">
        <Link to="/mechanic" className="auth-brand" aria-label="FixMyBuddy Pro home">
          <BrandLogo />
          <span>
            FixMyBuddy
            <span className="auth-brand-caption">PRO WORKSPACE</span>
          </span>
        </Link>
        <Link to="/mechanic/jobs" className="auth-browse">
          Browse first
          <ArrowUpRight size={16} />
        </Link>
      </header>
      <div className="auth-workspace">
        <main id="mechanic-auth-main" className="auth-main" tabIndex={-1}>
          <div className="auth-form-wrap">
            <div className="auth-form-top">
              <Link to="/mechanic" className="auth-back">
                <ArrowLeft size={18} />
                Back
              </Link>
              <span className="auth-customer-tag">PRO</span>
            </div>

            <div className="auth-page">
              <AuthHeading
                eyebrow="FIXMYBUDDY PRO"
                title="Put your skills to work."
              >
                Your roadside workspace for verified providers.
              </AuthHeading>

              <div className="auth-segments" role="group" aria-label="Sign-in method">
                <button
                  type="button"
                  aria-pressed={mode === 'phone'}
                  onClick={() => {
                    setMode('phone');
                    setErrors({});
                    setError('');
                  }}
                  disabled={busy}
                >
                  <Phone size={16} />
                  Mobile number
                </button>
                <button
                  type="button"
                  aria-pressed={mode === 'email'}
                  onClick={() => {
                    setMode('email');
                    setErrors({});
                    setError('');
                  }}
                  disabled={busy}
                >
                  <Mail size={16} />
                  Email
                </button>
              </div>

              <form
                id="mechanic-sign-in-form"
                onSubmit={handleSubmit}
                className="auth-form"
                key={mode}
              >
                {mode === 'phone' ? (
                  <AuthField
                    id="mechanic-phone"
                    name="phone"
                    label="Mobile number"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="09XX XXX XXXX"
                    required
                    icon={Phone}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    error={errors.phone}
                    hint="We'll send a one-time code to verify your provider account."
                  />
                ) : (
                  <>
                    <AuthField
                      id="mechanic-email"
                      name="email"
                      label="Email address"
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      required
                      icon={Mail}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      error={errors.email}
                    />
                    <PasswordField />
                    <Link to="/forgot-password" className="auth-forgot">
                      Forgot password?
                    </Link>
                  </>
                )}

                {error && <AuthNotice error>{error}</AuthNotice>}

                <div className="auth-actions">
                  <AuthSubmit busy={busy}>
                    {mode === 'phone' ? 'Continue with phone' : 'Sign in to Pro'}
                  </AuthSubmit>
                  <Link to="/mechanic/availability" className="auth-secondary">
                    Join the provider network
                  </Link>
                </div>
              </form>

              <section className="mt-5 rounded-xl border border-[rgb(var(--fmb-border))] bg-[rgb(var(--fmb-panel))] p-3.5">
                <h2 className="m-0 text-base font-semibold">New to the network?</h2>
                <p className="mb-0 mt-1 text-base leading-6 text-[rgb(var(--fmb-muted))]">
                  Get verified before accepting your first job.
                </p>
                <div
                  role="radiogroup"
                  aria-label="Provider onboarding steps"
                  className="mt-3 flex flex-col gap-1"
                >
                  {onboardingSteps.map((step, index) => {
                    const isActive = activeStep === index;

                    return (
                      <button
                        key={step}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => setActiveStep(index)}
                        className="flex min-h-8 w-full items-center gap-2 rounded-md text-left text-base"
                      >
                        <span
                          className={[
                            'grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full border',
                            isActive
                              ? 'border-[rgb(var(--fmb-accent))] bg-[rgb(var(--fmb-accent))]'
                              : 'border-[rgb(var(--fmb-muted2))] bg-transparent',
                          ].join(' ')}
                        >
                          {isActive && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--fmb-bg))]" />
                          )}
                        </span>
                        <span
                          className={
                            isActive
                              ? 'font-semibold text-[rgb(var(--fmb-text))]'
                              : 'text-[rgb(var(--fmb-muted))]'
                          }
                        >
                          {step}
                        </span>
                        {isActive && (
                          <span className="ml-auto shrink-0 text-base text-[rgb(var(--fmb-accent))]">
                            Now
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <label className="mt-2 flex min-h-9 cursor-pointer items-center gap-2 text-base">
                  <Upload
                    size={16}
                    className="shrink-0 text-[rgb(var(--fmb-accent))]"
                    aria-hidden="true"
                  />
                  <span className="flex-1 text-[rgb(var(--fmb-muted))]">
                    Credential upload
                  </span>
                  <span className="font-semibold text-[rgb(var(--fmb-accent))]">
                    {credentialFiles.length > 0
                      ? `${credentialFiles.length} added`
                      : 'Add documents'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    className="sr-only"
                    onChange={(event) => {
                      setCredentialFiles((current) => [
                        ...current,
                        ...Array.from(event.target.files || []),
                      ]);
                      event.target.value = '';
                    }}
                  />
                </label>
                {credentialFiles.length > 0 && (
                  <p className="mb-0 mt-1 pl-6 text-base text-[rgb(var(--fmb-muted))]">
                    {credentialFiles.map((file) => file.name).join(', ')}
                  </p>
                )}
              </section>

              <p className="auth-legal">
                By continuing, you agree to our <LegalLinks />.
              </p>
              <AccountLink to="/mechanic/jobs" label="Browse first">
                Need a look around?
              </AccountLink>
            </div>
          </div>
          <footer className="auth-footer">
            <BrandLogo />
            FixMyBuddy <span>Here for your next move.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
