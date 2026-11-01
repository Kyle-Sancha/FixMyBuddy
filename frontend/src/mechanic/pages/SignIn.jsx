import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Upload,
} from 'lucide-react';
import { MechanicHeader } from '../components/MechanicHeader';

const onboardingSteps = [
  'Verify identity & mobile',
  'Upload TESDA / trade credentials',
  'Review vehicle & service capability',
];

export function SignIn() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [credentialFiles, setCredentialFiles] = useState([]);

  function handleSubmit(event) {
    event.preventDefault();
    navigate('/mechanic/availability');
  }

  return (
    <div className="mechanic-public-shell">
      <div className="mechanic-public-page">
        <MechanicHeader />

      <div className="mt-4">
        <h1 className="m-0 text-2xl font-bold">Put your skills to work.</h1>
        <p className="mb-0 mt-1 text-sm text-[#aebbd0]">
          FixMyBuddy Pro · Your roadside workspace
        </p>
      </div>

      <form
        id="mechanic-sign-in-form"
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-4"
      >
        <label className="flex flex-col gap-2 text-xs font-medium text-[#c4cede]">
          Mobile or email
          <span className="flex min-h-12 items-center gap-2 rounded-xl border border-[#34435b] bg-[#1c293d] px-3 focus-within:border-[#ffda45]">
            <input
              type="text"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#718097]"
              required
            />
            <Mail size={17} className="text-[#aebbd0]" aria-hidden="true" />
          </span>
        </label>

        <label className="flex flex-col gap-2 text-xs font-medium text-[#c4cede]">
          Password
          <span className="flex min-h-12 items-center gap-2 rounded-xl border border-[#34435b] bg-[#1c293d] px-3 focus-within:border-[#ffda45]">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#718097]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="grid h-9 w-9 place-items-center text-[#aebbd0]"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
        </label>

        <div className="flex justify-between gap-3 text-xs text-[#aebbd0]">
          <span>Secure provider login</span>
          <Link to="/forgot-password" className="font-semibold text-[#ffda45]">
            Forgot password?
          </Link>
        </div>

      </form>

      <section className="mt-5 rounded-xl border border-[#34435b] bg-[#1c293d] p-3.5">
        <h2 className="m-0 text-sm font-semibold">New to the network?</h2>
        <p className="mb-0 mt-1 text-xs leading-5 text-[#aebbd0]">
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
                className="flex min-h-8 w-full items-center gap-2 rounded-md text-left text-xs"
              >
                <span
                  className={[
                    'grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full border',
                    isActive
                      ? 'border-[#ffda45] bg-[#ffda45]'
                      : 'border-[#718097] bg-transparent',
                  ].join(' ')}
                >
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-[#10192d]" />}
                </span>
                <span className={isActive ? 'font-semibold text-white' : 'text-[#aebbd0]'}>
                  {step}
                </span>
                {isActive && (
                  <span className="ml-auto shrink-0 text-[10px] text-[#ffda45]">
                    Now
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <label className="mt-2 flex min-h-9 cursor-pointer items-center gap-2 text-xs">
          <Upload size={16} className="shrink-0 text-[#ffda45]" aria-hidden="true" />
          <span className="flex-1 text-[#aebbd0]">Credential upload</span>
          <span className="font-semibold text-[#ffda45]">
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
          <p className="mb-0 mt-1 pl-6 text-[10px] text-[#aebbd0]">
            {credentialFiles.map((file) => file.name).join(', ')}
          </p>
        )}
        </section>

      <p className="mb-0 mt-3 text-[10px] leading-4 text-[#aebbd0]">
        By joining, you agree to the Provider Terms and Privacy Policy.
      </p>

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="submit"
          form="mechanic-sign-in-form"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ffda45] px-4 text-sm font-bold text-[#111827]"
        >
          <ArrowRight size={18} />
          Sign in to Pro
        </button>
        <Link
          to="/mechanic/availability"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1c293d] px-4 text-sm font-semibold text-white"
        >
          Join the provider network
        </Link>
      </div>
      </div>
    </div>
  );
}
