import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { LoadingState } from '../ui/LoadingState';

/**
 * Protects routes against cross-role access:
 * - When a logged-in account has a role that is not in `allowedRoles` (e.g., a customer
 *   trying to open `/mechanic/jobs`, or a mechanic trying to open `/app`), it blocks access
 *   and directs them to their own workspace or to sign in with the right account.
 * - When `requireSession` is true, unauthenticated guests are redirected to the sign-in screen.
 */
export function RoleGuard({
  allowedRoles = ['customer'],
  requireSession = false,
  signInPath = '/signin',
  children,
}) {
  const { user, sessionStatus, signOut } = useAuth();

  if (sessionStatus === 'loading') {
    return (
      <main className="auth-root buddy-splash">
        <div>
          <strong>FixMyBuddy</strong>
          <LoadingState />
        </div>
      </main>
    );
  }

  const userRole = user?.role || 'customer';

  if (user && !allowedRoles.includes(userRole) && userRole !== 'admin') {
    const isMechanicTarget = allowedRoles.includes('mechanic');
    const ownWorkspace = userRole === 'mechanic' ? '/mechanic/jobs' : '/app';
    const ownLabel = userRole === 'mechanic' ? 'Go to FixMyBuddy Pro' : 'Go to Customer Home';

    return (
      <main className="auth-root customer-root">
        <div className="customer-shell">
          <div className="customer-empty mt-12">
            <ShieldAlert size={36} />
            <h2>
              {isMechanicTarget
                ? 'Provider account required'
                : 'Customer account required'}
            </h2>
            <p>
              You are currently signed in as <strong>{user.name}</strong> ({userRole} account).
              To protect account privacy, {userRole} accounts cannot access{' '}
              {isMechanicTarget ? 'FixMyBuddy Pro mechanic' : 'customer'} pages.
            </p>
            <div className="mt-4 flex w-full flex-col gap-2.5">
              <Link to={ownWorkspace} className="auth-primary">
                {ownLabel}
              </Link>
              <Link
                to={signInPath}
                onClick={() => signOut().catch(() => {})}
                className="auth-secondary"
              >
                Switch account
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (requireSession && !user) {
    return (
      <main className="auth-root customer-root">
        <div className="customer-shell">
          <div className="customer-empty mt-12">
            <ShieldAlert size={36} />
            <h2>Sign in required</h2>
            <p>Please sign in to access this workspace.</p>
            <Link to={signInPath} className="auth-primary mt-4">
              Sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return children;
}
