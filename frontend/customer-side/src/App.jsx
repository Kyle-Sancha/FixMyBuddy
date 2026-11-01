import { AppRoutes } from './routes/AppRoutes';
import { useLocation } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import { LoadingState } from './components/ui/LoadingState';
import { NetworkStatus } from './components/ui/NetworkStatus';

function App() {
  const { key } = useLocation();
  const { sessionStatus } = useAuth();
  return <><NetworkStatus />{sessionStatus === 'loading' ? <main className="auth-root buddy-splash"><div><strong>FixMyBuddy</strong><LoadingState /></div></main> : <><div key={key} className="buddy-route-progress" aria-hidden="true" /><AppRoutes /></>}</>;
}

export default App;

